# Change Log — 2025-12-18

## Summary
Fixed “用户购买后管理员审核通过，但用户端看不到已激活套餐”的问题：统一 `/profile/packages` 使用 Prisma 迁移后的套餐数据接口，并让导航入口直达“我的套餐”。

## Changes
- UI: `/profile/packages` 路由切换为使用 `src/features/packages/MyPackagesPage.tsx`（基于 `GET /api/packages/user`）。
- UI: `MyPackagesPage` 兼容 Prisma 字段 `expiry`（并保留对历史字段 `expires_at/expiry_date` 的兼容读取），确保新创建的 `user_packages` 能正常显示有效期与状态判断。
- UI: 顶部导航与移动端底部导航的“套餐/我的套餐”入口改为指向 `/profile/packages`，避免用户误入购买列表页导致误判“没有套餐”。
- Admin UI: 管理后台侧边栏补充入口 `支付审核` → `/admin/payments`，用于审核并确认用户支付（订单/套餐）。
- API: 管理员确认支付 `POST /api/admin/payments/[id]/confirm` 在历史 `metadata.type` 缺失时仍可依据 `packageId` 激活套餐（创建 `user_packages`），提升审核通过后的套餐激活可靠性。
- API: `POST /api/packages/buy` 现在会根据 `paymentMethod` 创建 `provider=tng|cash` 的支付单（不再使用 `manual`），让支付记录能进入管理员审核流程。
- UI: `src/features/packages/PackagePurchaseFlow.tsx` 改为“创建支付单 →（TNG 上传收据/现金等待确认）→ 管理员审核通过后才显示套餐”，避免用户在未审核前误以为已购买成功。

## Impact
- 管理员审核通过套餐支付后，用户可在 `/profile/packages` 立即看到已激活的套餐与剩余次数。
- 入口更清晰：用户端“我的套餐”默认展示已购买套餐，购买入口仍可从页面内跳转到 `/packages`。

## Tests
- Manual: 用户购买套餐（TNG 上传收据或现金）→ 管理后台 `/admin/payments` 审核通过 → 用户打开 `/profile/packages` 可见新套餐记录。
- Manual: 用户无套餐时打开 `/profile/packages` 显示空状态，并可跳转到 `/packages` 购买。
