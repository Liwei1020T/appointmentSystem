# Change Log — 2026-02-11

## Summary
完成管理员库存详情页类型加固，移除 `AdminInventoryDetailPage` 中 `any`，并修正库存服务更新接口类型以支持前端数值提交。

## Changes

### Modified
- `src/components/admin/AdminInventoryDetailPage.tsx`
  - 新增 `InventoryDetailFormData`，统一表单字段类型。
  - 新增 `getErrorMessage(error: unknown)`，替换 `catch (err: any)`。
  - 移除 `fetchedString as any`，直接使用 `StringInventory` 可选字段。
  - `handleFieldChange` 改为泛型键值约束，避免 `value: any`。
  - 移除 `updateString(... as any)` 断言。
- `src/services/inventoryService.ts`
  - 新增 `UpdateStringInput`，将 `updateString` 入参从 `Partial<StringInventory>` 调整为前端友好的更新类型（支持 `number | string` 价格字段）。

### Fixed
- 修复库存详情保存流程中因 Prisma `Decimal` 类型限制导致的类型断言依赖问题。
- 修复库存详情页面多个 `any` 带来的类型保护缺失。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/admin/AdminInventoryDetailPage.tsx` | Modified | 管理库存详情页移除 `any` 并加固表单类型 |
| `src/services/inventoryService.ts` | Modified | 更新接口输入类型，兼容前端编辑提交 |

## API Changes
- 无新增 API。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
