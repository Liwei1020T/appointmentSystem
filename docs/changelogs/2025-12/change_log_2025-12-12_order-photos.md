# Change Log — 2025-12-12 订单照片上传系统

## 📌 概述

实现订单照片管理系统，允许管理员上传穿线照片（before/after/detail/other），用户可查看并放大浏览，首张照片上传时自动通知用户。

## 🎯 业务价值

- **提升专业形象** - 展示专业穿线工艺
- **增强透明度** - 客户可远程查看球拍状态
- **减少到店次数** - 照片确认后再取件
- **质量证明** - 留存工作记录

---

## 📊 数据库变更

### 1. 新建表: `order_photos`

**文件:** `supabase/migrations/20251212000008_create_order_photos_table.sql`

```sql
CREATE TABLE order_photos (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before', 'after', 'detail', 'other')),
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明:**
- `photo_type`: 照片类型（穿线前/穿线后/细节图/其他）
- `caption`: 可选照片说明
- `display_order`: 显示顺序（支持排序）
- `uploaded_by`: 上传管理员ID

### 2. 修改表: `orders`

```sql
ALTER TABLE orders ADD COLUMN has_photos BOOLEAN DEFAULT false;
```

### 3. 索引

```sql
CREATE INDEX idx_order_photos_order_id ON order_photos(order_id);
CREATE INDEX idx_order_photos_created_at ON order_photos(created_at DESC);
CREATE INDEX idx_order_photos_type ON order_photos(photo_type);
```

### 4. RLS 策略

- 用户查看自己订单照片
- 管理员完整CRUD权限

### 5. 触发器与函数

#### `notify_user_on_photo_upload()`
首张照片上传时创建通知：
```
标题: "您的球拍已完成穿线"
内容: "订单 #{order_number} 的穿线已完成，点击查看照片"
```

#### `update_order_has_photos()`
自动维护 `orders.has_photos` 标志

#### `get_order_photos_count(order_id)`
快速获取订单照片数量

---

## 🎨 组件变更

### 1. 新建: `OrderPhotosUpload.tsx` (管理端)

**路径:** `src/components/OrderPhotosUpload.tsx`

**功能:**
- 4种照片类型选择（before/after/detail/other）
- 可选照片说明输入
- 拖拽/点击上传（最多6张）
- 照片预览与删除
- 拖拽排序（↑↓按钮）
- 自动保存到数据库

**Props:**
```typescript
interface OrderPhotosUploadProps {
  orderId: string;
  existingPhotos?: OrderPhoto[];
  onUploadSuccess?: () => void;
}
```

**使用:**
```typescript
<OrderPhotosUpload
  orderId={order.id}
  onUploadSuccess={() => {
    toast.success('照片上传成功');
    loadOrder();
  }}
/>
```

### 2. 重构: `OrderPhotosDisplay.tsx` (用户端)

**路径:** `src/components/OrderPhotosDisplay.tsx`

**功能:**
- 网格展示所有照片
- 照片类型标签（颜色编码）
- 点击放大（Lightbox全屏）
- 键盘导航（← → ESC）
- 缩略图快速切换
- 响应式设计

**Props:**
```typescript
interface OrderPhotosDisplayProps {
  orderId: string;  // 新：直接传orderId，组件内部加载照片
}
```

**使用:**
```typescript
<OrderPhotosDisplay orderId={order.id} />
```

### 3. 修改: `AdminOrderDetailPage.tsx`

移除旧的 OrderPhotosUploader，集成新的 OrderPhotosUpload 组件。

### 4. 修改: `OrderDetailPage.tsx`

更新为从数据库加载照片，简化props。

---

## 🔧 API集成

### Supabase Storage

- Bucket: `order-photos`
- 文件夹: `{orderId}/{uuid}.jpg`
- 压缩: 最大1920x1920px
- 格式: JPG, PNG, WebP

### 数据库操作示例

```typescript
// 获取订单照片
const { data } = await supabase
  .from('order_photos')
  .select('*')
  .eq('order_id', orderId)
  .order('display_order');

// 上传照片
await supabase.from('order_photos').insert({
  order_id: orderId,
  photo_url: photoUrl,
  photo_type: 'after',
  caption: '26磅 BG66UM',
  uploaded_by: adminId,
});

// 删除照片
await supabase.from('order_photos').delete().eq('id', photoId);
```

---

## 📬 通知系统

### 应用内通知

首张照片上传时自动创建：

```json
{
  "title": "您的球拍已完成穿线",
  "message": "订单 #{order_number} 的穿线已完成，点击查看照片",
  "type": "order",
  "action_url": "/orders/{order_id}"
}
```

### SMS通知（预留）

在 `notify_user_on_photo_upload()` 函数中预留接口，待集成SMS服务商。

---

## 📁 文件结构

```
supabase/migrations/
  └── 20251212000008_create_order_photos_table.sql   [新增]

src/components/
  ├── OrderPhotosUpload.tsx                          [新增]
  ├── OrderPhotosDisplay.tsx                         [重构]
  └── admin/
      └── AdminOrderDetailPage.tsx                   [修改]

src/features/orders/
  └── OrderDetailPage.tsx                            [修改]

docs/
  └── change_log_2025-12-12_order-photos.md          [本文件]
```

---

## ✅ 测试指南

### 1. 数据库迁移
```bash
supabase migration up
supabase db diff
```

### 2. 管理端上传
1. 进入管理后台 → 订单管理 → 订单详情
2. 选择照片类型 → 输入说明 → 上传照片
3. 验证照片显示、删除、排序功能

### 3. 用户端查看
1. 以用户身份查看订单详情
2. 点击照片打开Lightbox
3. 测试键盘导航（← → ESC）

### 4. 通知测试
1. 管理员上传第一张照片
2. 用户检查通知列表
3. 验证通知内容和跳转链接

### 5. 权限测试

| 用户 | 操作 | 预期 |
|------|------|------|
| 用户 | 上传照片 | ❌ 失败 |
| 管理员 | 上传照片 | ✅ 成功 |
| 用户A | 查看用户B订单照片 | ❌ 失败 |
| 用户A | 查看自己订单照片 | ✅ 成功 |

---

## 🚀 性能优化

- 索引优化查询
- has_photos标志避免JOIN
- 图片自动压缩
- CDN加速

---

## ⚠️ 已知限制

1. 单次最多上传6张照片
2. SMS通知未实现
3. 用户端需手动刷新查看新照片

---

## 🔮 未来优化

### P1 - 短期
- [ ] 集成SMS通知
- [ ] 照片打水印
- [ ] 实时更新

### P2 - 中期
- [ ] Before/After对比视图
- [ ] 批量上传优化

### P3 - 长期
- [ ] AI自动分类照片
- [ ] 照片质量检测

---

## 📋 部署清单

- [x] 数据库迁移
- [x] OrderPhotosUpload组件
- [x] OrderPhotosDisplay组件
- [x] AdminOrderDetailPage集成
- [x] OrderDetailPage集成
- [x] RLS策略
- [x] 触发器与函数
- [x] 通知系统
- [x] 文档

---

## 🔄 回滚计划

```sql
DROP TRIGGER IF EXISTS trigger_notify_user_on_first_photo ON order_photos;
DROP TRIGGER IF EXISTS trigger_update_order_has_photos ON order_photos;
DROP FUNCTION IF EXISTS notify_user_on_photo_upload();
DROP FUNCTION IF EXISTS update_order_has_photos();
DROP TABLE IF EXISTS order_photos CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS has_photos;
```

---

## 📚 相关文档

- [ERD](./erd.md) - 数据库设计
- [API规范](./api_spec.md)
- [系统设计](./System-Design-Document.md)
- [图片上传系统](./change_log_2025-12-12_image-upload.md)

---

**完成时间**: 2025-12-12  
**影响范围**: 管理端、用户端、数据库、通知  
**测试状态**: 待测试  
**部署状态**: 待部署  
**优先级**: P1
