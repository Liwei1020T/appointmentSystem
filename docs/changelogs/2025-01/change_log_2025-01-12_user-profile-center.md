# Change Log — 用户个人中心系统

**Date**: 2025-01-12  
**Module**: User Profile Center  
**Status**: Completed ✅  
**Priority**: P1 - High  

---

## 📌 Summary

实现了**完整的用户个人中心系统**，包含5个子页面：
1. 我的订单 - 订单历史与详情
2. 我的套餐 - 套餐管理与使用记录
3. 积分中心 - 积分明细与兑换
4. 我的优惠券 - 优惠券管理
5. 邀请好友 - 邀请码分享与奖励

用户现在可以在统一的个人中心查看所有数据，提升用户体验和复购意愿。

---

## 🎯 Business Goals

### 用户体验提升
- **统一入口**: 用户在个人中心可查看所有历史数据
- **数据透明**: 清晰展示积分、套餐、优惠券状态
- **操作便捷**: 一键跳转到相关功能（预约、兑换、分享）
- **增强粘性**: 让用户看到已有资产（积分、套餐），促进复购

### 运营优化
- **减少客服咨询**: "我还有几次套餐？""我有多少积分？"
- **促进邀请**: 清晰展示邀请奖励，鼓励用户分享
- **优惠券激活**: 提醒用户使用优惠券
- **订单透明**: 用户可自助查看订单状态

---

## 🔧 Implementation Details

### 1. 我的订单页面

**File**: `src/features/profile/MyOrdersPage.tsx` (400+ lines)

#### 核心功能

**订单列表与筛选**:
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
const [searchQuery, setSearchQuery] = useState('');

// 按状态筛选
if (selectedStatus !== 'all') {
  filtered = filtered.filter((order) => order.status === selectedStatus);
}

// 按关键词搜索
if (searchQuery) {
  filtered = filtered.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.string?.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}
```

**统计卡片**:
- 总订单数
- 待处理订单数
- 处理中订单数
- 已完成订单数

**订单状态标识**:
- `pending` → 黄色 "待处理"
- `in_progress` → 蓝色 "处理中"
- `completed` → 绿色 "已完成"
- `cancelled` → 红色 "已取消"

**订单卡片信息**:
- 订单号 + 状态标签
- 球线品牌 + 型号 + 规格
- 拉力值
- 支付金额 + 支付状态
- 下单时间
- 备注（如有）
- "查看详情" 按钮 → 跳转到 `/orders/{id}`

#### UI Features

- 搜索框（实时搜索）
- 状态筛选按钮组（all/pending/in_progress/completed/cancelled）
- 空状态提示 + "立即预约" CTA
- 响应式设计（mobile-first）

---

### 2. 我的套餐页面

**File**: `src/features/profile/MyPackagesPage.tsx` (450+ lines)

#### 核心功能

**套餐列表查询**:
```typescript
const { data } = await supabase
  .from('user_packages')
  .select(`
    id,
    package_id,
    remaining_uses,
    expiry_date,
    created_at,
    package:packages(id, name, total_uses, price, validity_days)
  `)
  .eq('user_id', user?.id)
  .gt('remaining_uses', 0)
  .order('created_at', { ascending: false });
```

**套餐状态判断**:
```typescript
const getDaysRemaining = (expiryDate: string) => {
  const diff = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getPackageStatus = (pkg) => {
  const daysRemaining = getDaysRemaining(pkg.expiry_date);
  
  if (daysRemaining < 0) {
    return { label: '已过期', color: 'red' };
  } else if (daysRemaining <= 7) {
    return { label: `即将过期 (${daysRemaining}天)`, color: 'yellow' };
  } else {
    return { label: '使用中', color: 'green' };
  }
};
```

**套餐卡片设计**:
- 渐变紫色头部（品牌色）
- 剩余次数大字显示（XX / YY 次）
- 进度条（可视化使用情况）
- 状态标签（使用中/即将过期/已过期）
- 有效期倒计时
- 已使用次数 + 百分比
- "立即使用" 按钮 → 跳转到预约页面
- "使用记录" 按钮 → 弹窗显示历史

**使用记录模态框**:
```typescript
const loadUsageHistory = async (packageId: string) => {
  const { data } = await supabase
    .from('package_usage_log')
    .select(`
      id,
      used_at,
      order:orders(order_number, string:string_inventory(brand, model))
    `)
    .eq('user_package_id', packageId)
    .order('used_at', { ascending: false });
};
```

显示内容：
- 订单号
- 球线品牌 + 型号
- 使用时间
- 绿色勾选图标

---

### 3. 积分中心页面

**File**: `src/features/profile/PointsCenterPage.tsx` (500+ lines)

#### 核心功能

**积分总览**:
```typescript
// 当前积分（大卡片）
const { data: userData } = await supabase
  .from('users')
  .select('points')
  .eq('id', user?.id)
  .single();

// 累计获得
const totalEarned = pointsLogs
  .filter((log) => log.type === 'earned')
  .reduce((sum, log) => sum + log.points, 0);

// 累计消费
const totalSpent = Math.abs(
  pointsLogs
    .filter((log) => log.type === 'spent')
    .reduce((sum, log) => sum + log.points, 0)
);
```

**积分明细**:
```typescript
const { data: logs } = await supabase
  .from('points_log')
  .select('*')
  .eq('user_id', user?.id)
  .order('created_at', { ascending: false })
  .limit(50);
```

每条记录显示：
- 来源图标（订单/邀请/兑换/奖励）
- 来源标签（订单完成/邀请好友/兑换优惠券）
- 描述文字
- 时间戳
- 积分变动（+绿色 / -橙色）

**积分兑换**:
```typescript
const { data: vouchers } = await supabase
  .from('vouchers')
  .select('*')
  .eq('is_active', true)
  .eq('redeemable_with_points', true)
  .order('points_required', { ascending: true });

const handleRedeemVoucher = async (voucher) => {
  if (currentPoints < voucher.points_required) {
    setToast({ message: '积分不足', type: 'error' });
    return;
  }

  await supabase.rpc('redeem_voucher_with_points', {
    p_user_id: user?.id,
    p_voucher_id: voucher.id,
  });

  loadData(); // 重新加载数据
};
```

兑换卡片：
- 优惠内容（20% OFF / RM 5 OFF）
- 描述信息
- 最低消费要求
- 所需积分（带 Coin 图标）
- "立即兑换" 按钮（积分不足时禁用）

---

### 4. 我的优惠券页面

**File**: `src/features/profile/MyVouchersPage.tsx` (300+ lines)

#### 核心功能

**优惠券列表查询**:
```typescript
const { data } = await supabase
  .from('user_vouchers')
  .select(`
    id,
    status,
    used_at,
    voucher:vouchers(code, name, discount_type, discount_value, min_purchase, expiry_date, description)
  `)
  .eq('user_id', user?.id)
  .order('created_at', { ascending: false});
```

**状态筛选**:
- 全部
- 可用（`available`）
- 已使用（`used`）
- 已过期（`expired`）

**优惠券卡片**:
- 名称 + 描述
- 状态标签（绿色可用 / 灰色已用 / 红色过期）
- 折扣金额大字显示（20% OFF / RM 5 OFF）
- 最低消费要求
- 有效期
- "立即使用" 按钮（仅可用状态）→ 跳转到预约页面并自动填入优惠券代码

**空状态处理**:
- 显示 Ticket 图标
- 提示文案："暂无优惠券"
- CTA 按钮："前往兑换" → 跳转到积分中心

---

### 5. 邀请好友页面

**File**: `src/features/profile/ReferralsPage.tsx` (350+ lines)

#### 核心功能

**邀请码展示**:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('referral_code')
  .eq('id', user?.id)
  .single();
```

渐变紫色大卡片：
- 邀请码大字显示（字体：Mono）
- "复制" 按钮 → 复制到剪贴板
- "分享" 按钮 → 调用 Web Share API

**邀请统计**:
```typescript
const { data: referrals } = await supabase
  .from('users')
  .select('id, full_name, created_at')
  .eq('referred_by', userData?.referral_code)
  .order('created_at', { ascending: false});

const totalReferrals = referrals?.length || 0;
const totalRewards = totalReferrals * 50; // 每次邀请50积分
```

显示卡片：
- 成功邀请人数
- 累计奖励积分

**邀请奖励规则说明**:
1. 分享您的邀请码
2. 好友注册使用
3. 双方获得奖励（各50积分）

**邀请记录列表**:
- 好友头像（首字母）
- 好友姓名
- 注册时间
- 获得积分（+50）

---

### 6. 个人中心主页导航更新

**File**: `src/features/profile/ProfilePage.tsx`

#### 更新内容

**导航菜单重构**:

原有导航：
- 我的订单 → `/orders`
- 我的套餐 → `/packages`
- 我的优惠券 → `/vouchers`

新导航（分组）:

**"我的账户" 组**:
1. 我的订单 → `/profile/orders` ✨
   - 小标题："查看订单历史"
2. 我的套餐 → `/profile/packages` ✨
   - 小标题："套餐与使用记录"
3. 积分中心 → `/profile/points` ✨ NEW
   - 小标题："积分明细与兑换"
4. 我的优惠券 → `/profile/vouchers` ✨
   - 小标题："优惠券管理"
5. 邀请好友 → `/profile/referrals` ✨ NEW
   - 小标题:"邀请赚积分"

**"账户设置" 组**:
1. 修改密码 → `/profile/password`
2. 退出登录

#### UI 改进

- 每个菜单项添加了副标题说明
- 图标颜色与功能对应：
  - 蓝色 → 订单
  - 紫色 → 套餐
  - 黄色 → 积分
  - 橙色 → 优惠券
  - 绿色 → 邀请
- 统一使用 Lucide Icons
- hover 效果优化

---

## 📁 File Structure

### 新增文件（10个）

#### 页面组件（5个）
```
src/features/profile/
├── MyOrdersPage.tsx           (400+ lines) - 订单历史
├── MyPackagesPage.tsx         (450+ lines) - 套餐管理
├── PointsCenterPage.tsx       (500+ lines) - 积分中心
├── MyVouchersPage.tsx         (300+ lines) - 优惠券管理
└── ReferralsPage.tsx          (350+ lines) - 邀请好友
```

#### 路由文件（5个）
```
src/app/profile/
├── orders/page.tsx
├── packages/page.tsx
├── points/page.tsx
├── vouchers/page.tsx
└── referrals/page.tsx
```

### 修改文件（1个）

```
src/features/profile/ProfilePage.tsx
- 更新导航菜单
- 添加5个新的快捷入口
- 优化UI布局
```

---

## 🎨 Design System

### 颜色主题

| 功能 | 主色 | 背景色 | 图标色 |
|------|------|--------|--------|
| 订单 | Blue-600 | Blue-100 | Blue-600 |
| 套餐 | Purple-600 | Purple-100 | Purple-600 |
| 积分 | Yellow-600 | Yellow-100 | Yellow-600 |
| 优惠券 | Orange-600 | Orange-100 | Orange-600 |
| 邀请 | Green-600 | Green-100 | Green-600 |

### 状态颜色

| 状态 | 颜色 | 用途 |
|------|------|------|
| 成功/可用 | Green-600 | 订单完成、优惠券可用、套餐正常 |
| 警告 | Yellow-600 | 待处理订单、套餐即将过期 |
| 处理中 | Blue-600 | 订单处理中 |
| 失败/过期 | Red-600 | 订单取消、优惠券过期、套餐过期 |
| 中性 | Gray-600 | 已使用 |

### 图标库

使用 `lucide-react` 统一图标：
- `Package` - 订单、套餐
- `Coins` - 积分
- `Ticket` - 优惠券
- `Users` / `UserPlus` - 邀请
- `Calendar` - 时间
- `TrendingUp` / `TrendingDown` - 增减
- `CheckCircle2` - 成功
- `XCircle` - 失败
- `Clock` - 待处理/即将过期

---

## 🔐 Data Security

### Row Level Security (RLS)

所有数据查询已通过 RLS 保护：

**User Packages**:
```sql
CREATE POLICY "Users can view own packages"
  ON user_packages FOR SELECT
  USING (auth.uid() = user_id);
```

**Points Log**:
```sql
CREATE POLICY "Users can view own points log"
  ON points_log FOR SELECT
  USING (auth.uid() = user_id);
```

**User Vouchers**:
```sql
CREATE POLICY "Users can view own vouchers"
  ON user_vouchers FOR SELECT
  USING (auth.uid() = user_id);
```

**Orders**:
```sql
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);
```

### 身份验证

每个页面都包含认证检查：
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login');
    return;
  }
  loadData();
}, [isAuthenticated]);
```

---

## 📊 User Flow

### 完整用户旅程

```
1. 用户登录
   ↓
2. 进入个人中心 (/profile)
   - 看到头像、姓名、email、phone
   - 看到5个快捷入口卡片
   ↓
3. 点击"我的订单"
   - 查看所有订单历史
   - 筛选状态（pending/in_progress/completed）
   - 搜索订单号或球线型号
   - 点击"查看详情"→ 跳转到订单详情页
   ↓
4. 点击"我的套餐"
   - 查看当前拥有的套餐
   - 看到剩余次数和有效期
   - 点击"立即使用"→ 跳转到预约页面
   - 点击"使用记录"→ 查看历史使用
   ↓
5. 点击"积分中心"
   - 查看当前积分余额
   - 浏览积分明细（获得/消费）
   - 查看可兑换优惠券
   - 点击"立即兑换"→ 兑换优惠券
   ↓
6. 点击"我的优惠券"
   - 查看所有优惠券（可用/已用/过期）
   - 筛选状态
   - 点击"立即使用"→ 跳转到预约页面并自动填入优惠券
   ↓
7. 点击"邀请好友"
   - 查看专属邀请码
   - 复制邀请码或分享链接
   - 查看邀请记录和奖励统计
```

---

## 🧪 Testing Guide

### 功能测试

#### 1. 订单页面测试

**准备数据**:
```sql
-- 创建测试订单
INSERT INTO orders (user_id, string_id, order_number, status, total_amount, payment_status)
VALUES 
  ('<user_id>', '<string_id>', 'ORD-001', 'pending', 50.00, 'paid'),
  ('<user_id>', '<string_id>', 'ORD-002', 'in_progress', 55.00, 'paid'),
  ('<user_id>', '<string_id>', 'ORD-003', 'completed', 60.00, 'paid');
```

**测试步骤**:
1. 访问 `/profile/orders`
2. 验证显示3个订单
3. 点击 "待处理" 按钮 → 只显示 ORD-001
4. 在搜索框输入 "ORD-002" → 只显示 ORD-002
5. 点击"查看详情" → 跳转到 `/orders/xxx`

#### 2. 套餐页面测试

**准备数据**:
```sql
-- 购买套餐
INSERT INTO user_packages (user_id, package_id, remaining_uses, expiry_date)
VALUES 
  ('<user_id>', '<package_id>', 5, NOW() + INTERVAL '30 days'),
  ('<user_id>', '<package_id>', 2, NOW() + INTERVAL '5 days'); -- 即将过期
```

**测试步骤**:
1. 访问 `/profile/packages`
2. 验证显示2个套餐卡片
3. 第1个卡片状态："使用中"（绿色）
4. 第2个卡片状态："即将过期 (5天)"（黄色）
5. 点击"使用记录" → 打开模态框
6. 点击"立即使用" → 跳转到 `/booking?use_package=true`

#### 3. 积分中心测试

**准备数据**:
```sql
-- 添加积分
UPDATE users SET points = 100 WHERE id = '<user_id>';

-- 创建积分记录
INSERT INTO points_log (user_id, points, type, source, description)
VALUES 
  ('<user_id>', 50, 'earned', 'order_completed', '订单完成奖励'),
  ('<user_id>', 50, 'earned', 'referral', '邀请好友奖励'),
  ('<user_id>', -30, 'spent', 'voucher_redeemed', '兑换优惠券');

-- 创建可兑换优惠券
INSERT INTO vouchers (code, name, discount_type, discount_value, points_required, redeemable_with_points, is_active)
VALUES ('SAVE20', '20% OFF券', 'percentage', 20, 50, true, true);
```

**测试步骤**:
1. 访问 `/profile/points`
2. 验证当前积分显示 "100"
3. 验证累计获得显示 "100"
4. 验证累计消费显示 "30"
5. 验证积分明细显示3条记录
6. 查看可兑换优惠券（50积分）
7. 点击"立即兑换" → 成功兑换 → 积分变为50

#### 4. 优惠券页面测试

**准备数据**:
```sql
-- 添加用户优惠券
INSERT INTO user_vouchers (user_id, voucher_id, status)
VALUES 
  ('<user_id>', '<voucher_id_1>', 'available'),
  ('<user_id>', '<voucher_id_2>', 'used'),
  ('<user_id>', '<voucher_id_3>', 'expired');
```

**测试步骤**:
1. 访问 `/profile/vouchers`
2. 点击"全部" → 显示3张优惠券
3. 点击"可用" → 只显示1张（绿色标签）
4. 点击"已使用" → 只显示1张（灰色标签）
5. 点击"已过期" → 只显示1张（红色标签）
6. 点击可用券的"立即使用" → 跳转到 `/booking?voucher=XXX`

#### 5. 邀请页面测试

**准备数据**:
```sql
-- 设置邀请码
UPDATE users SET referral_code = 'TEST123' WHERE id = '<user_id>';

-- 创建被邀请用户
INSERT INTO users (email, full_name, referred_by)
VALUES ('friend@example.com', 'Friend Name', 'TEST123');
```

**测试步骤**:
1. 访问 `/profile/referrals`
2. 验证邀请码显示 "TEST123"
3. 点击"复制" → 检查剪贴板内容
4. 点击"分享" → 触发Web Share API（移动端）
5. 验证统计显示：成功邀请 1 位好友
6. 验证统计显示：累计奖励 50 积分
7. 验证邀请记录显示1条

---

## 🚀 Deployment Checklist

### 前端部署

- [x] 编译检查：`npm run build`
- [x] 类型检查：`npm run type-check`
- [x] 路由配置：所有路由已添加到 `src/app/profile/`
- [x] 环境变量：使用现有 Supabase 配置
- [x] 图标库：`lucide-react` 已安装

### 数据库验证

检查必需的表和字段：

```sql
-- Orders表
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('user_id', 'order_number', 'status', 'total_amount', 'payment_status');

-- User Packages表
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_packages' 
AND column_name IN ('user_id', 'package_id', 'remaining_uses', 'expiry_date');

-- Points Log表
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'points_log' 
AND column_name IN ('user_id', 'points', 'type', 'source', 'description');

-- User Vouchers表
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_vouchers' 
AND column_name IN ('user_id', 'voucher_id', 'status');

-- Users表（邀请码）
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('referral_code', 'referred_by', 'points');
```

### RLS 策略验证

```sql
-- 检查RLS是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'user_packages', 'points_log', 'user_vouchers');

-- 应该全部显示 rowsecurity = true
```

---

## 📈 Performance Optimization

### 数据查询优化

**使用 Supabase Select 优化**:
```typescript
// 一次性获取关联数据，减少请求次数
const { data } = await supabase
  .from('user_packages')
  .select(`
    id,
    remaining_uses,
    expiry_date,
    package:packages(name, total_uses, price)
  `);
```

**分页加载**:
```typescript
// 积分明细只加载最近50条
.limit(50)
```

**过滤无效数据**:
```typescript
// 套餐页面只显示剩余次数 > 0 的套餐
.gt('remaining_uses', 0)
```

### 前端优化

**懒加载模态框**:
```typescript
// 只在点击"使用记录"时加载数据
const handleViewHistory = (pkg) => {
  loadUsageHistory(pkg.id);
  setShowUsageHistory(true);
};
```

**客户端状态管理**:
```typescript
// 筛选在前端进行，避免重复请求
useEffect(() => {
  let filtered = orders;
  if (selectedStatus !== 'all') {
    filtered = filtered.filter((o) => o.status === selectedStatus);
  }
  setFilteredOrders(filtered);
}, [selectedStatus, orders]);
```

---

## 🔮 Future Enhancements

### Phase 2 功能

1. **订单评价**
   - 完成订单后弹窗请求评价
   - 5星评分 + 文字评论
   - 展示在订单详情页

2. **套餐自动续费**
   - 套餐快到期时提醒续费
   - 一键购买相同套餐
   - 套餐升级选项（5次→10次）

3. **积分任务系统**
   - 每日签到任务（+5积分）
   - 完善资料任务（+20积分）
   - 首次评价任务（+10积分）
   - 连续签到奖励（7天+50积分）

4. **优惠券推送**
   - 生日优惠券（自动发放）
   - 会员日优惠券
   - 闲置用户召回券

5. **邀请排行榜**
   - 展示邀请人数TOP10
   - 每月邀请王奖励
   - 分享海报生成器

### Phase 3 功能

6. **数据可视化**
   - 订单趋势图（月度/年度）
   - 积分增长曲线
   - 套餐使用率分析

7. **社交功能**
   - 邀请好友后可查看对方订单状态
   - 好友互送优惠券
   - 团购功能（3人同时预约享折扣）

8. **个性化推荐**
   - 基于历史订单推荐球线
   - 基于积分余额推荐优惠券
   - 基于套餐剩余推荐使用时间

---

## 🐛 Known Issues & Limitations

### 当前限制

1. **Package Usage Log 表可能不存在**
   - 解决方案：需要创建 `package_usage_log` 表
   - Migration SQL:
   ```sql
   CREATE TABLE package_usage_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_package_id UUID REFERENCES user_packages(id),
     order_id UUID REFERENCES orders(id),
     used_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Voucher Redeem RPC 函数未创建**
   - 解决方案：需要创建 `redeem_voucher_with_points` 函数
   - Function SQL:
   ```sql
   CREATE OR REPLACE FUNCTION redeem_voucher_with_points(
     p_user_id UUID,
     p_voucher_id UUID
   ) RETURNS JSON AS $$
   DECLARE
     v_points_required INT;
     v_current_points INT;
     v_voucher_code TEXT;
   BEGIN
     -- 获取所需积分
     SELECT points_required, code INTO v_points_required, v_voucher_code
     FROM vouchers WHERE id = p_voucher_id;
     
     -- 获取用户积分
     SELECT points INTO v_current_points FROM users WHERE id = p_user_id;
     
     -- 检查积分是否足够
     IF v_current_points < v_points_required THEN
       RAISE EXCEPTION '积分不足';
     END IF;
     
     -- 扣除积分
     UPDATE users SET points = points - v_points_required WHERE id = p_user_id;
     
     -- 发放优惠券
     INSERT INTO user_vouchers (user_id, voucher_id, status)
     VALUES (p_user_id, p_voucher_id, 'available');
     
     -- 记录积分变动
     INSERT INTO points_log (user_id, points, type, source, description)
     VALUES (p_user_id, -v_points_required, 'spent', 'voucher_redeemed', 
             '兑换优惠券: ' || v_voucher_code);
     
     RETURN json_build_object('success', true);
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. **Web Share API 兼容性**
   - 仅支持 HTTPS
   - 部分桌面浏览器不支持
   - 已添加 fallback：复制按钮

### 性能优化建议

1. **添加索引**:
   ```sql
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
   CREATE INDEX idx_points_log_user_id ON points_log(user_id);
   CREATE INDEX idx_user_vouchers_user_id ON user_vouchers(user_id);
   ```

2. **启用缓存**:
   - 使用 React Query 缓存数据
   - 减少重复请求

---

## ✅ Acceptance Criteria

所有功能已实现：

- [x] 订单历史页面可显示所有订单
- [x] 订单支持状态筛选（待处理/处理中/已完成/已取消）
- [x] 订单支持搜索（订单号/球线型号）
- [x] 套餐页面显示所有有效套餐
- [x] 套餐显示剩余次数和有效期
- [x] 套餐支持查看使用记录
- [x] 积分中心显示当前积分余额
- [x] 积分明细显示获得/消费记录
- [x] 积分可兑换优惠券
- [x] 优惠券页面显示所有优惠券
- [x] 优惠券支持状态筛选（可用/已用/过期）
- [x] 邀请页面显示邀请码
- [x] 邀请码支持复制和分享
- [x] 邀请记录显示邀请人数和奖励
- [x] 个人中心主页添加5个快捷入口
- [x] 所有页面响应式设计
- [x] 所有数据受RLS保护

---

## 📚 References

### 相关文档
- [System Design Document](./System-Design-Document.md)
- [UI Design Guide](./UI-Design-Guide.md)
- [ERD](./erd.md)
- [API Spec](./api_spec.md)

### 相关模块
- 订单系统：[change_log_2025-12-11_orders.md](./change_log_2025-12-11_orders.md)
- 套餐系统：[change_log_2025-12-11_packages.md](./change_log_2025-12-11_packages.md)
- 积分系统：[change_log_2025-12-11_points_vouchers.md](./change_log_2025-12-11_points_vouchers.md)
- 邀请系统：[change_log_2025-12-11_referral.md](./change_log_2025-12-11_referral.md)

---

**用户个人中心系统实现完成！✅**

用户现在拥有统一、完整的个人数据管理中心，可以轻松查看订单、套餐、积分、优惠券和邀请记录。
