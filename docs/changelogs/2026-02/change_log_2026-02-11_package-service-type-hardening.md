# Change Log — 2026-02-11

## Summary
完成 `packageService` 高密度 `any` 清理，补齐套餐相关响应类型，并新增优先级排序测试，保持现有业务行为不变。

## Changes

### Added
- 新增 `sortPackagesByPriority`，统一套餐优先级排序逻辑（剩余次数优先、到期时间次优先）。
- 新增 `src/__tests__/packageServicePriority.test.ts`，覆盖排序核心规则与兼容字段。
- 新增套餐服务层类型：
  - `PackagePurchaseResult`
  - `PendingPackagePayment`
  - `ProfileUserPackagePayload`
  - `PackageUsageRecord`
  - `PackageSummaryData`

### Modified
- `src/services/packageService.ts`
  - 全面移除 `any` 与 `catch (error: any)`。
  - 统一错误收敛为 `Error` / message，避免调用方类型丢失。
  - `getPriorityPackage` 改用可测试排序函数，去除 `(pkg as any)`。
- `src/features/home/PackageSummary.tsx`
  - 套餐状态类型改为 `UserPackageWithPackage[]`。
  - 移除 `session.user as any`。
  - 修复最近到期日期计算与 Hook 依赖。

### Fixed
- 修复 `PackageSummary` 与 `getUserPackageSummary` 新类型的对齐问题。
- 修复套餐最近到期日期读取路径中对旧字段访问导致的类型错误。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/packageService.ts` | Modified | 套餐服务类型收敛、去 any、排序逻辑可测试化 |
| `src/features/home/PackageSummary.tsx` | Modified | 对齐套餐类型并移除 `as any` |
| `src/__tests__/packageServicePriority.test.ts` | Added | 新增套餐优先级排序测试 |

## API Changes
- 无 API 协议变更（仅客户端类型与解析逻辑增强）。

## Database Changes
- 无数据库变更。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，仅历史 warning）
- [x] 测试通过（`npm run test:run`）
- [x] 构建成功（`npm run build`）
