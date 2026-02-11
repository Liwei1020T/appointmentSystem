# Change Log — 2026-02-10

## Summary

完成一轮 P1 类型安全加固，聚焦 `auth + services` 高风险 `any`，并补充了服务层回归测试，保持 API/业务行为兼容。

## Changes

### Added
- 新增 `src/__tests__/profileService.test.ts`：覆盖 `getPoints` 的响应规范化行为。
- 新增 `src/__tests__/adminUserService.test.ts`：覆盖 admin 用户列表 snake_case 字段映射行为。

### Modified
- `src/lib/auth.ts`：移除 `as any`，改为明确字段读取与类型安全赋值。
- `src/types/next-auth.d.ts`：完善 NextAuth 扩展字段可空/可选定义。
- `src/services/adminUserService.ts`：新增用户 payload 规范化与 `unknown` 错误处理。
- `src/services/profileService.ts`：新增积分/推荐/会员详情返回类型与规范化逻辑，移除 `any`。
- `src/services/reviewService.ts`：替换 `apiRequest<any>`、`catch (error: any)`，补全评价统计类型。
- `src/features/profile/ProfilePage.tsx` 与 `src/features/profile/EditProfilePage.tsx`：适配 `getUserProfile` 的错误类型。

### Fixed
- 修复 admin 用户列表在 snake_case 返回下 `fullName/referralCode/时间字段` 丢失问题。
- 修复积分中心在非标准响应（如 `balance` 字符串、`logs` 非数组）下的类型不稳定问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/auth.ts` | Modified | 移除 `as any`，增强 JWT/session 字段赋值类型安全 |
| `src/types/next-auth.d.ts` | Modified | 扩展 NextAuth 类型定义，支持可空字段 |
| `src/services/adminUserService.ts` | Modified | 用户列表字段规范化与 `unknown` 错误处理 |
| `src/services/profileService.ts` | Modified | 积分/推荐/会员接口类型化与返回规范化 |
| `src/services/reviewService.ts` | Modified | 评价服务去 `any` 并补全统计类型 |
| `src/features/profile/ProfilePage.tsx` | Modified | 适配 profile 错误类型 |
| `src/features/profile/EditProfilePage.tsx` | Modified | 适配 profile 错误类型 |
| `src/__tests__/profileService.test.ts` | Added | getPoints 规范化测试 |
| `src/__tests__/adminUserService.test.ts` | Added | getAllUsers snake_case 映射测试 |

## API Changes

无 API 协议变更（仅客户端服务层类型与容错增强）。

## Database Changes

无。

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，存在历史 warning）
- [x] 测试通过（`npm run test:run`，24 文件 59 测试）
- [x] 构建成功（`npm run build`）
