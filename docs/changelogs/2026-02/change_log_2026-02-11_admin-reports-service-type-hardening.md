# Change Log — 2026-02-11

## Summary
完成 `adminReportsService` 类型加固，移除所有 `catch (error: any)`，统一使用 `unknown` + 错误消息提取，并补充报表服务单测。

## Changes

### Added
- 新增 `src/__tests__/adminReportsService.test.ts`：
  - 覆盖收入报表失败时的 API 错误透传。
  - 覆盖导出报表异常抛错时的错误消息回传。

### Modified
- `src/services/adminReportsService.ts`
  - 新增 `getErrorMessage(error: unknown, fallback: string)`。
  - 所有 `catch (error: any)` 改为 `catch (error: unknown)`。
  - 各报表接口保留原默认数据兜底，同时改为类型安全错误处理。

### Fixed
- 修复报表服务层 `any` 导致的类型保护缺失问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/adminReportsService.ts` | Modified | 报表服务错误处理类型化，移除 `any` |
| `src/__tests__/adminReportsService.test.ts` | Added | 报表服务失败场景单测 |

## API Changes
- 无。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
