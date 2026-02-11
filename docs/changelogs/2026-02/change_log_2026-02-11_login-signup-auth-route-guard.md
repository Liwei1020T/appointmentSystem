# Change Log — 2026-02-11

## Summary
修复首页“登录/注册按钮点击无跳转”问题：中间件不再把无效/过期 token 误判为已登录，从而避免错误地将 `/login`、`/signup` 重定向回首页。

## Changes

### Added
- 新增中间件回归测试，覆盖 auth route 在异常 token 场景下的重定向行为。

### Modified
- `src/middleware.ts`
  - 新增会话 token 有效性判定：
    - 必须包含非空 `id`
    - 若存在 `exp`，必须未过期
  - 管理员判定改为基于有效会话 token 后再读取角色。

### Fixed
- 修复 `/login`、`/signup` 在“token 存在但会话无效”时被错误重定向到 `/` 的问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/middleware.ts` | Modified | 收紧登录态判定，避免误重定向 |
| `src/__tests__/middlewareAuthRouteGuard.test.ts` | Added | 新增 auth route 重定向回归测试 |

## API Changes
- 无 API 端点变更。

## Database Changes
- 无数据库变更。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`）
- [x] 测试通过（`npm run test:run`）
- [x] 构建成功（`npm run build`）
