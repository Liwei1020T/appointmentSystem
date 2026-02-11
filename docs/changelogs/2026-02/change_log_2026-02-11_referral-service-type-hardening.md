# Change Log — 2026-02-11

## Summary
完成 `referralService` 类型加固：移除 `any`、引入 payload 类型与归一化工具，提升推荐统计与排行榜的类型安全和容错能力，并新增针对异常 payload 的回归测试。

## Changes

### Added
- 新增 `src/__tests__/referralService.test.ts`：
  - 覆盖推荐统计 `referrals` 非数组时的兜底行为。
  - 覆盖我的推荐统计 `referrals` 非数组时的兜底行为。
  - 覆盖排行榜字符串数字/布尔字段的归一化行为。

### Modified
- `src/services/referralService.ts`
  - 新增 payload 接口定义，替换 `apiRequest<any>`。
  - 新增 `isRecord`、`toString`、`toNumber`、`toBoolean`、`toDate`、`getErrorMessage` 等类型守卫/归一化工具。
  - 新增推荐统计与我的推荐统计条目归一化函数，确保返回结构稳定。
  - 将 `catch (error: any)` / `catch (err: any)` 改为 `unknown` 并统一错误消息提取。
  - 排行榜映射改为显式字段归一化，避免字符串数字泄漏到 UI 层。

### Fixed
- 修复推荐服务在后端返回异常数据结构时可能把非数组值直接透传到 UI 的问题。
- 修复排行榜字段在字符串类型输入下未做数值/布尔归一化的问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/services/referralService.ts` | Modified | 移除 `any` 并增加类型守卫与数据归一化 |
| `src/__tests__/referralService.test.ts` | Added | 推荐服务异常 payload 与归一化单测 |

## API Changes
- 无。

## Database Changes
- 无。

## Testing
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] `npm run test:run`
- [x] `npm run build`
