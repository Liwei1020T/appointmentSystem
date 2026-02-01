# Events Center Design

**日期：2026-01-29**
**功能：活动中心 - 让登录用户看到促销和公告**

---

## 需求背景

用户登录后需要能看到当月的促销活动和公告，不仅仅是 Landing Page 的弹窗。

## 设计决策

| 决策点 | 选择 |
|--------|------|
| 展示位置 | 首页轮播 + 完整活动页面 |
| 首页形式 | 可滑动轮播 |
| 内容来源 | 促销自动显示 + 额外公告 |
| 公告管理 | 独立的 Admin 页面 |
| 活动页面路径 | `/events` |
| 页面内容 | 促销 + 公告 + 历史归档 + 优惠券入口 |
| 导航入口 | 底部导航新增第五个入口 |

---

## 数据模型

### 新增 Announcement 模型

```prisma
model Announcement {
  id          String    @id @default(cuid())
  title       String    // 标题
  content     String    // 内容详情
  imageUrl    String?   // 可选配图
  linkUrl     String?   // 可选跳转链接
  linkText    String?   // 链接按钮文字
  priority    Int       @default(0)  // 排序优先级
  startAt     DateTime  // 生效时间
  endAt       DateTime  // 结束时间
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Promotion 模型
保持现有设计不变，已支持 FLASH_SALE、POINTS_BOOST、SPEND_SAVE。

---

## API 设计

### 用户端 API

```
GET /api/events/active
```
返回当前生效的促销和公告：
```typescript
{
  promotions: Promotion[],
  announcements: Announcement[]
}
```

```
GET /api/events/history
```
返回已结束的活动，支持分页。

### 管理端 API

```
GET    /api/admin/announcements      // 列表
POST   /api/admin/announcements      // 创建
PATCH  /api/admin/announcements/[id] // 更新
DELETE /api/admin/announcements/[id] // 删除
```

---

## 前端组件

### 新增组件

| 组件 | 文件 | 用途 |
|------|------|------|
| EventCarousel | `src/components/EventCarousel.tsx` | 首页可滑动轮播 |
| EventCard | `src/components/EventCard.tsx` | 活动卡片 |
| EventsPage | `src/features/events/EventsPage.tsx` | 活动中心页面 |

### 新增页面

| 路径 | 文件 |
|------|------|
| `/events` | `src/app/events/page.tsx` |
| `/admin/announcements` | `src/app/admin/announcements/page.tsx` |

---

## 页面布局

### 首页改动

在 QuickActions 下方插入 EventCarousel：
```
Welcome Section
QuickActions
EventCarousel  ← 新增
OrderStatusCapsule
PackageSummary
...
```

### 底部导航

新增第五个入口：
```
首页 | 预约 | 活动 | 订单 | 我的
```

### 活动中心页面

```
PageHeader: 活动中心
Tab: [进行中] [已结束]

分类区块：
- 🔥 限时优惠 (FLASH_SALE)
- ✨ 积分翻倍 (POINTS_BOOST)
- 💰 满减活动 (SPEND_SAVE)
- 📢 公告通知
- 🎟️ 优惠券兑换入口
```

### Admin 公告管理

```
PageHeader: 公告管理 [+ 新增公告]
统计卡片: 进行中 | 已结束
公告列表: 卡片形式，支持编辑/删除
```

创建/编辑字段：
- 标题（必填）
- 内容（必填）
- 配图（可选）
- 跳转链接（可选）
- 按钮文字（有链接时必填）
- 优先级（默认 0）
- 开始时间（必填）
- 结束时间（必填）

---

## 实现顺序

1. **数据层** - Schema + 迁移
2. **API 层** - events/active、admin/announcements
3. **组件层** - EventCard、EventCarousel
4. **页面层** - /events、/admin/announcements
5. **整合** - BottomNav、HomePage

---

## 文件清单

### 新增文件

- `prisma/schema.prisma` - 添加 Announcement
- `src/app/api/events/active/route.ts`
- `src/app/api/events/history/route.ts`
- `src/app/api/admin/announcements/route.ts`
- `src/app/api/admin/announcements/[id]/route.ts`
- `src/components/EventCarousel.tsx`
- `src/components/EventCard.tsx`
- `src/features/events/EventsPage.tsx`
- `src/app/events/page.tsx`
- `src/app/admin/announcements/page.tsx`

### 修改文件

- `src/components/BottomNav.tsx` - 新增活动入口
- `src/features/home/HomePage.tsx` - 插入 EventCarousel
