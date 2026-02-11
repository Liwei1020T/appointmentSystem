# Change Log — 2026-02-11

## Summary
继续完成第二批安全加固：补齐管理端关键操作限流、订单照片相关端点限流，并修复 `review.service` 点赞切换的并发竞态。

## Changes

### Added
- 新增订单照片端点限流回归测试：
  - `src/__tests__/orderPhotoRouteRateLimit.test.ts`
- 新增评论点赞并发回归测试：
  - `src/__tests__/reviewServiceLikeRace.test.ts`

### Modified
- 管理端高风险操作新增限流：
  - `src/app/api/payments/[id]/verify/route.ts`
  - `src/app/api/payments/[id]/reject/route.ts`
  - `src/app/api/orders/[id]/complete/route.ts`
- 订单照片相关端点新增限流（防止上传/排序/删除滥用）：
  - `src/app/api/orders/[id]/photos/route.ts`
  - `src/app/api/orders/[id]/photos/[photoId]/route.ts`
  - `src/app/api/orders/[id]/photos/reorder/route.ts`
- `review.service` 点赞逻辑改为抗并发实现：
  - 先 `deleteMany` 实现幂等取消点赞
  - `likesCount` 使用数据库最新值返回
  - 捕获唯一约束冲突（`P2002`）避免并发点赞异常

### Fixed
- 修复管理员支付审核/拒绝、订单完成端点缺少速率限制。
- 修复订单照片管理端点缺少速率限制。
- 修复 `toggleReviewLike` 在并发下可能抛错或返回过时计数的问题。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/app/api/payments/[id]/verify/route.ts` | Modified | 新增管理员支付审核限流 |
| `src/app/api/payments/[id]/reject/route.ts` | Modified | 新增管理员支付拒绝限流 |
| `src/app/api/orders/[id]/complete/route.ts` | Modified | 新增订单完成限流 |
| `src/app/api/orders/[id]/photos/route.ts` | Modified | 新增订单照片新增限流 |
| `src/app/api/orders/[id]/photos/[photoId]/route.ts` | Modified | 新增订单照片删除限流 |
| `src/app/api/orders/[id]/photos/reorder/route.ts` | Modified | 新增订单照片重排限流 |
| `src/server/services/review.service.ts` | Modified | 点赞切换并发安全与计数一致性修复 |
| `src/__tests__/orderPhotoRouteRateLimit.test.ts` | Added | 覆盖照片端点 429 限流回归 |
| `src/__tests__/reviewServiceLikeRace.test.ts` | Added | 覆盖点赞并发竞态回归 |

## API Changes
- 以上端点在触发限流时统一返回 `429`。

## Database Changes
- 无

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，存在既有 warning）
- [x] 测试通过（`npm run test:run`，120 项）
- [x] 构建成功（`npm run build`）
