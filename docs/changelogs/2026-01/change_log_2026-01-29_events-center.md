# Change Log — 2026-01-29

## Summary

新增「活动中心」功能，让登录用户可以在首页和专属页面查看当前促销活动和公告通知。

## Changes

### Added
- 新增 `Announcement` 数据模型，支持公告管理
- 新增用户端活动 API (`/api/events/active`, `/api/events/history`)
- 新增 Admin 公告管理 API (`/api/admin/announcements`)
- 新增 `EventCard` 组件 - 活动卡片（促销/公告通用）
- 新增 `EventCarousel` 组件 - 首页可滑动轮播
- 新增 `/events` 活动中心页面
- 新增 `/admin/announcements` 公告管理页面
- 底部导航新增「活动」入口（替换原「评价」位置）
- 首页新增活动优惠轮播区块

### Modified
- `ClientLayout.tsx` - 更新底部导航项，加入活动入口
- `HomePage.tsx` - 在 QuickActions 下方插入 EventCarousel
- `OnboardingTutorial.tsx` - 修复 TypeScript 类型错误

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `prisma/schema.prisma` | Modified | 添加 Announcement 模型 |
| `src/app/api/events/active/route.ts` | Added | 获取当前活动 API |
| `src/app/api/events/history/route.ts` | Added | 获取历史活动 API |
| `src/app/api/admin/announcements/route.ts` | Added | 公告 CRUD API |
| `src/app/api/admin/announcements/[id]/route.ts` | Added | 单个公告操作 API |
| `src/components/EventCard.tsx` | Added | 活动卡片组件 |
| `src/components/EventCarousel.tsx` | Added | 首页轮播组件 |
| `src/features/events/EventsPage.tsx` | Added | 活动中心页面 |
| `src/app/events/page.tsx` | Added | 活动中心路由 |
| `src/app/admin/announcements/page.tsx` | Added | 公告管理页面 |
| `src/app/ClientLayout.tsx` | Modified | 更新底部导航 |
| `src/features/home/HomePage.tsx` | Modified | 插入 EventCarousel |
| `src/components/OnboardingTutorial.tsx` | Modified | 修复类型错误 |
| `docs/plans/2026-01-29-events-center-design.md` | Added | 设计文档 |

## API Changes

### User APIs (New)
- `GET /api/events/active` - 获取当前生效的促销和公告
- `GET /api/events/history` - 获取已结束的活动（分页）

### Admin APIs (New)
- `GET /api/admin/announcements` - 获取公告列表
- `POST /api/admin/announcements` - 创建公告
- `PATCH /api/admin/announcements/[id]` - 更新公告
- `DELETE /api/admin/announcements/[id]` - 删除公告

## Database Changes

新增 `announcements` 表：
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  priority INT DEFAULT 0,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

## Testing
- [x] TypeScript 类型检查通过
- [x] ESLint 检查通过（仅 warnings）
- [x] 构建成功

## Documentation Updated
- [x] `docs/core/api_spec.md` - 添加 Events 和 Announcements API 文档
- [x] `docs/core/erd.md` - 添加 Announcement 表定义
- [x] `docs/core/components.md` - 添加 EventCard 和 EventCarousel 组件文档
- [x] `docs/plans/2026-01-29-events-center-design.md` - 设计文档

## Notes
- 底部导航从原来的 5 个入口（首页、预约、订单、评价、我的）调整为（首页、预约、活动、订单、我的）
- 促销活动自动从现有 Promotion 系统读取，无需额外配置
- 公告需要在 Admin 后台手动创建管理
