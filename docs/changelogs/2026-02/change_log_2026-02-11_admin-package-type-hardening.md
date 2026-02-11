# Change Log — 2026-02-11

## Summary
强化管理员套餐模块的类型安全：移除 `adminPackageService` 与对应页面中的 `any` 断言，统一 snake_case / camelCase 字段兼容，并补充服务层单元测试。

## Changes

### Added
- 新增 `src/__tests__/adminPackageService.test.ts`，覆盖套餐列表与购买记录字段归一化逻辑。

### Modified
- `src/services/adminPackageService.ts`
  - 移除 `Package = any` / `UserPackage = any`。
  - 增加明确的 `AdminPackage`、`PackagePurchase` 类型与 payload 归一化函数。
  - 全部 `catch (error: any)` 改为 `catch (error: unknown)` + 统一错误消息提取。
- `src/components/admin/AdminPackageListPage.tsx`
  - 删除 `(pkg as any)` 断言，改为类型安全的有效期读取辅助函数。
- `src/components/admin/AdminPackageDetailPage.tsx`
  - 删除 `(pkg as any)`、`(purchase as any)` 断言，改为直接使用强类型字段。
  - 日期格式化函数增强为可处理 `string | Date | undefined`。

### Fixed
- 修复管理员套餐页面依赖 `any` 导致的类型保护缺失问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/adminPackageService.ts` | Modified | 管理员套餐服务类型与错误处理重构 |
| `src/components/admin/AdminPackageListPage.tsx` | Modified | 移除 `any` 断言，统一有效期字段读取 |
| `src/components/admin/AdminPackageDetailPage.tsx` | Modified | 移除 `any` 断言并强化日期/金额显示类型 |
| `src/__tests__/adminPackageService.test.ts` | Added | 覆盖字段归一化场景的单元测试 |

## API Changes
- 无新增 API；仅客户端服务层类型与解析逻辑改进。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
