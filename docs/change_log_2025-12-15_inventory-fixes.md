# Change Log — 2025-12-15

## Summary
Fixed inventory list display and detail page rendering issues.

## Changes

### 1. Fixed Inventory List Not Displaying Data
**File:** `src/services/inventory.service.ts`

**Problem:** 
- API returns data in format `{ success: true, data: [...] }`
- Service was trying to access `data.inventory` instead of `data.data`
- This caused inventory list to show "暂无库存数据" even when data existed

**Solution:**
```typescript
// Before
return data.inventory || [];

// After  
return data.data || [];
```

### 2. Fixed Detail Page Decimal Type Error
**File:** `src/components/admin/AdminInventoryDetailPage.tsx`

**Problem:**
- When navigating to detail page, `costPrice` or `sellingPrice` could be undefined temporarily during data loading
- Error: `Cannot read properties of undefined (reading 'toString')`
- This happened at line 261 when trying to parse Decimal values

**Solution:**
Added optional chaining to safely handle undefined values:
```typescript
// Before
const costPrice = string ? parseFloat(string.costPrice.toString()) : 0;
const sellingPrice = string ? parseFloat(string.sellingPrice.toString()) : 0;

// After
const costPrice = string?.costPrice ? parseFloat(string.costPrice.toString()) : 0;
const sellingPrice = string?.sellingPrice ? parseFloat(string.sellingPrice.toString()) : 0;
```

## Root Cause Analysis

### API Response Format Mismatch
The project uses a standardized API response format via `successResponse()` helper:
```typescript
{
  success: true,
  data: <actual data>,
  message: string | undefined
}
```

However, the inventory service was expecting the old format where inventory data was returned directly under `inventory` key. This mismatch caused the service to return empty arrays even though API calls were successful.

### Decimal Type Handling
Prisma's `Decimal` type requires careful handling when converting to JavaScript numbers:
1. Always check for undefined/null before calling `.toString()`
2. Use optional chaining (`?.`) when accessing nested properties
3. Use `parseFloat(decimal.toString())` instead of `Number(decimal)` for reliable conversion

## Testing

### Manual Tests Performed:
1. ✅ Navigate to admin inventory list page - displays data correctly
2. ✅ Create new inventory item - redirects to detail page successfully
3. ✅ View inventory detail page - shows cost/selling prices without errors
4. ✅ Filter by stock status - works correctly
5. ✅ Search by brand/model - works correctly

### Edge Cases Covered:
- Empty inventory list (shows "暂无库存数据" message)
- Loading state (shows spinner)
- Missing costPrice/sellingPrice (defaults to 0)
- Invalid Decimal values (handled gracefully)

## Files Modified

- `src/services/inventory.service.ts` (line 30)
- `src/components/admin/AdminInventoryDetailPage.tsx` (lines 261-262)

## Impact

### User-Facing Changes:
- ✅ Inventory list now displays data correctly
- ✅ No more crashes when viewing inventory details
- ✅ Smooth navigation from add page to detail page
- ✅ Proper handling of price display (no more "RM NaN")

### Technical Improvements:
- More robust error handling for Prisma Decimal types
- Consistent use of standardized API response format
- Better null safety with optional chaining

## Notes

### Lessons Learned:
1. Always verify API response format matches service expectations
2. When changing API response structure, update all consuming services
3. Prisma Decimal type requires special handling - document conversion patterns
4. Use optional chaining for any data that might be undefined during loading states

### Future Considerations:
- Consider creating TypeScript utility type for API responses
- Add runtime validation for API response format (e.g., using Zod)
- Create helper functions for Decimal type conversions
- Add unit tests for inventory service functions

### Related Files to Monitor:
- All services in `src/services/` directory - may have similar issues
- Other admin detail pages that handle Decimal types
- API routes that use `successResponse()` helper

## Database Schema (Reference)

```prisma
model StringInventory {
  id           String   @id @default(uuid())
  model        String
  brand        String
  description  String?
  costPrice    Decimal  @db.Decimal(10, 2)  // NOT NULL
  sellingPrice Decimal  @db.Decimal(10, 2)  // NOT NULL
  stock        Int      @default(0)
  minimumStock Int      @default(5)
  // ... other fields
}
```

Both `costPrice` and `sellingPrice` are non-nullable in the schema, but optional chaining is still needed because:
1. Data may not have loaded yet (async fetch)
2. JSON serialization can introduce undefined values
3. Type safety during component mounting
