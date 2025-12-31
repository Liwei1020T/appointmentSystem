# Change Log — 2025-12-15

## Summary
- Fixed order detail currency formatting by normalizing monetary values before rendering to prevent runtime errors.
- Added UUID validation guardrails for order APIs and review service to stop Prisma from throwing on invalid IDs.

## Changes
- Normalized `finalAmount` and `discountAmount` to numeric values in `src/features/orders/OrderDetailPage.tsx` to avoid `toFixed` crashes when the API returns strings.
- Added `isValidUUID` helper in `src/lib/utils.ts` and applied validation in:
  - `src/app/api/orders/[id]/route.ts` (order detail)
  - `src/app/api/orders/[id]/cancel/route.ts` (cancel order)
  - `src/services/review.service.ts` (review fetch/checks)
- Order detail now reads both `created_at` and `createdAt` from Prisma responses to display the order time consistently.
- Order detail now shows precise timestamp (`yyyy-MM-dd HH:mm`) for 下单时间/更新时间 instead of date-only.
- Admin 订单列表对齐 API 数据结构与分页参数：`src/services/adminOrderService.ts`、`src/app/api/admin/orders/route.ts`、`src/components/admin/AdminOrderListPage.tsx`，确保订单能正常显示并支持搜索。
- Admin 订单列表金额显示使用数值归一化，避免 `toFixed` 在未定义/字符串金额上抛错。
- 新增 6 位数字订单简码：`generateShortCode` (`src/lib/utils.ts`)，在用户订单详情与管理员订单列表展示友好编号，同时保留原始 UUID 以便追溯。
- Admin 订单列表：球线展示回退到 model/brand，金额展示兼容 `price/final_price/total_price/totalAmount`，防止出现 `-` 或 0 金额误判（`src/components/admin/AdminOrderListPage.tsx`）。
- 新增管理员订单详情接口 `/api/admin/orders/[id]`，校验 UUID 并返回完整订单信息；服务解析兼容 `successResponse` 包装，解决“Failed to fetch order”。
- 新增订单照片 API（用户/管理员共用）：`/api/orders/[id]/photos`（GET/POST）、`/api/orders/[id]/photos/[photoId]`（DELETE）、`/api/orders/[id]/photos/reorder`（PUT），基于 `order_photos` 表，用户端 `OrderPhotosDisplay` 可显示管理员上传照片。
- Admin 订单详情：球线信息回退到 `stringInventory`，金额字段兼容 `price/final_price/total_price/totalAmount`，避免展示 0 或空（`src/components/admin/AdminOrderDetailPage.tsx`）。
- 新增管理员更新订单状态接口 `/api/admin/orders/[id]/status`，返回 JSON 包含订单数据；前端服务解析兼容 `successResponse`，解决更新状态时报 HTML/JSON 解析错误。
- 用户端订单详情时间线：补充支付/处理中时间可选字段，时间戳统一显示到秒；下单时间使用 createdAt/created_at 兜底（`src/components/OrderTimeline.tsx`, `src/features/orders/OrderDetailPage.tsx`）。
- 用户端订单详情头部不再显示拉力与价格，仅保留品牌/型号与下单时间（`src/features/orders/OrderDetailPage.tsx`）。
- 时间线“等待支付”使用支付创建时间，避免与下单时间重复；继续展示支付确认/处理中时间（`src/components/OrderTimeline.tsx`, `src/features/orders/OrderDetailPage.tsx`）。
- Admin 照片上传支持加载已存在照片，方便查看历史记录（`src/components/OrderPhotosUpload.tsx`）。

## Tests
- Manual: opened an order detail page where `final_price`/`price` are returned as strings and confirmed the amount renders without errors.
- Manual: navigated to an order detail page with a malformed ID and confirmed the API now returns a friendly 400 error instead of a Prisma UUID exception.
- Manual: opened order detail page and confirmed 下单时间 now shows the actual created timestamp.
