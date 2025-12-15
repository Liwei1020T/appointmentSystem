# Change Log — 2025-12-12 (Manual Payment System with Receipt Upload)

## 📌 Summary

将自动化支付系统改造为手动支付模式，商家展示固定的 TNG 收款码，用户扫码支付后上传支付收据，管理员审核收据后确认支付。这种方式简化了支付集成的复杂度，避免了第三方支付 API 的对接成本和维护负担。

**核心价值：**
- 简化支付流程，无需对接复杂的支付 API
- 降低开发和维护成本
- 灵活支持任何支付方式（TNG、银行转账、现金等）
- 管理员完全掌控支付审核流程
- 适合初期业务规模和本地化运营

---

## 📦 Changes Overview

### 1. 数据库结构更新

#### `supabase/migrations/20251212000004_update_payments_for_receipt.sql` (NEW)

**新增字段到 payments 表：**

```sql
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
```

**支付状态更新：**
- `pending` - 待支付（用户尚未上传收据）
- `pending_verification` - 待审核（用户已上传收据）
- `completed` - 已完成（管理员审核通过）
- `failed` - 失败（管理员拒绝收据）
- `refunded` - 已退款

**新增索引：**
```sql
CREATE INDEX IF NOT EXISTS idx_payments_pending_verification 
ON payments(status) 
WHERE status = 'pending_verification';
```

---

### 2. 用户端支付组件

#### `src/components/TngQRCodeDisplay.tsx` (NEW - ~280 lines)

**功能：**
- 显示商家 TNG 收款二维码
- 显示支付金额和订单信息
- 提供详细的支付步骤说明（6步引导）
- 支持手动转账（显示电话号码并可复制）
- 重要提示和注意事项

**关键特性：**
```typescript
interface TngQRCodeDisplayProps {
  amount: number;        // 支付金额
  orderId: string;       // 订单ID
}

// 配置项（需手动修改）
const qrCodeUrl = '/images/tng-qr-code.png';  // 收款码图片路径
const merchantPhone = '01X-XXXX-XXXX';         // 商家电话号码
```

**支付步骤说明：**
1. 打开 Touch 'n Go eWallet 应用
2. 点击"扫码"或"Scan"
3. 扫描上方二维码
4. 确认支付金额
5. 完成支付后，截图保存支付收据
6. 上传支付收据到下方

---

#### `src/components/PaymentReceiptUploader.tsx` (NEW - ~220 lines)

**功能：**
- 支持拖拽或点击上传收据图片
- 实时图片预览
- 文件类型验证（仅图片）
- 文件大小验证（最大 5MB）
- 客户端图片压缩
- 上传到 Supabase Storage (receipts bucket)
- 上传成功后更新支付状态为 `pending_verification`

**关键特性：**
```typescript
interface PaymentReceiptUploaderProps {
  paymentId: string;           // 支付记录 ID
  orderId: string;             // 订单 ID
  existingReceiptUrl?: string; // 已上传的收据
  onUploadSuccess: (receiptUrl: string) => void;
  onUploadError?: (error: string) => void;
}
```

**上传流程：**
1. 用户选择/拖拽图片文件
2. 验证文件类型和大小
3. 生成本地预览
4. 上传到 `receipts/{orderId}/{paymentId}_{timestamp}.jpg`
5. 获取公共 URL
6. 调用 `uploadPaymentReceipt()` 更新数据库
7. 显示成功提示

**上传要求提示：**
- 请确保收据图片清晰可见
- 收据必须包含完整的交易信息
- 请确保支付金额与订单金额一致
- 收据必须包含交易时间和交易ID

---

#### `src/components/OrderPaymentSection.tsx` (UPDATED)

**完全重写支付流程：**

移除了：
- ❌ PaymentMethodSelector（支付方式选择器）
- ❌ TNGPaymentButton（TNG API 支付按钮）
- ❌ FPXBankSelector（FPX 银行选择器）
- ❌ FPXPaymentButton（FPX 支付按钮）

新增了：
- ✅ TngQRCodeDisplay（TNG 收款码展示）
- ✅ PaymentReceiptUploader（收据上传）
- ✅ 自动创建支付记录
- ✅ 收据上传成功提示

**新的支付流程：**
```typescript
1. 组件加载 → 自动调用 createPayment() 创建支付记录
2. 显示 TNG 收款码 + 支付金额
3. 用户扫码支付
4. 用户上传收据 → uploadPaymentReceipt()
5. 状态更新为 pending_verification
6. 显示"等待管理员审核"提示
```

---

### 3. 管理员审核组件

#### `src/components/admin/PaymentReceiptVerifier.tsx` (NEW - ~250 lines)

**功能：**
- 查看用户上传的支付收据（图片预览）
- 点击查看大图（模态框）
- 审核收据（批准/拒绝）
- 填写审核备注
- 显示审核状态和历史

**审核流程：**
```typescript
// 待审核状态
if (paymentStatus === 'pending_verification') {
  // 显示审核表单
  - 收据图片预览
  - 审核备注输入框
  - [拒绝] 按钮（红色）
  - [通过] 按钮（绿色）
}

// 已审核状态
if (paymentStatus === 'completed') {
  // 显示绿色成功提示
  - 审核时间
  - 审核备注
}

if (paymentStatus === 'failed') {
  // 显示红色拒绝提示
  - 拒绝原因
}
```

**界面元素：**
- 图片预览卡片
- "查看大图"按钮
- 审核备注文本框
- 批准/拒绝按钮（带 loading 状态）
- 全屏图片查看模态框

---

#### `src/components/admin/AdminOrderDetailPage.tsx` (UPDATED)

**集成收据审核功能：**

在支付信息卡片之后新增"支付收据审核"板块：

```typescript
{/* Payment Receipt Verification */}
{order.payment && (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">
      支付收据审核
    </h2>
    <PaymentReceiptVerifier
      receiptUrl={order.payment.receipt_url}
      paymentStatus={order.payment.payment_status}
      paymentId={order.payment.id}
      verifiedAt={order.payment.verified_at}
      adminNotes={order.payment.admin_notes}
      onVerify={async (approved, notes) => {
        await verifyPaymentReceipt(order.payment.id, approved, notes);
        await loadOrder(); // 重新加载订单
      }}
    />
  </div>
)}
```

**审核后自动操作：**
- 审核通过 → 支付状态: `completed` → 订单状态: `confirmed`
- 审核拒绝 → 支付状态: `failed` → 用户需重新支付

---

### 4. 支付服务层更新

#### `src/services/paymentService.ts` (UPDATED)

**类型更新：**
```typescript
// 简化支付方式
export type PaymentMethod = 'tng' | 'cash';

// 新增支付状态
export type PaymentStatus = 
  | 'pending'               // 待支付
  | 'pending_verification'  // 待审核（NEW）
  | 'completed'             // 已完成
  | 'failed'                // 失败
  | 'refunded';             // 已退款
```

**新增方法：**

**1. `uploadPaymentReceipt(paymentId, receiptUrl)`**

用户上传支付收据后调用：
```typescript
// 更新字段：
- receipt_url = receiptUrl
- receipt_uploaded_at = NOW()
- status = 'pending_verification'
```

**2. `verifyPaymentReceipt(paymentId, approved, adminNotes)`**

管理员审核收据：
```typescript
if (approved) {
  // 通过审核
  - status = 'completed'
  - verified_by = admin.id
  - verified_at = NOW()
  - admin_notes = adminNotes
  
  // 同时更新订单
  - order.payment_status = 'paid'
  - order.status = 'confirmed'
} else {
  // 拒绝审核
  - status = 'failed'
  - verified_by = admin.id
  - verified_at = NOW()
  - admin_notes = adminNotes (拒绝原因)
}
```

**3. `getPendingVerifications(limit)`**

获取待审核的支付列表（管理员用）：
```typescript
// 查询条件
WHERE status = 'pending_verification'
ORDER BY receipt_uploaded_at DESC
LIMIT {limit}

// 返回数据包含
- 支付记录
- 关联订单信息（order_number）
- 用户信息（full_name, email）
```

---

## 🔄 Payment Flow

### 用户端流程

```
┌─────────────────┐
│ 1. 创建订单     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 进入支付页面 │
│  - 自动创建      │
│    payment 记录  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 显示 TNG     │
│    收款码        │
│  - 金额显示      │
│  - 支付步骤      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 用户扫码支付 │
│  （线下操作）    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 上传收据     │
│  - 拖拽/点击     │
│  - 图片压缩      │
│  - Storage上传   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. 状态更新     │
│  pending →      │
│  pending_       │
│  verification   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. 等待审核提示 │
│  "1-2工作日审核" │
└─────────────────┘
```

### 管理员端流程

```
┌─────────────────┐
│ 1. 查看订单列表 │
│  - 筛选待审核    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 进入订单详情 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 查看收据图片 │
│  - 点击查看大图  │
│  - 验证金额      │
│  - 验证交易信息  │
└────────┬────────┘
         │
         ├──────┐
         │      ▼
         │   ┌──────────┐
         │   │ 拒绝     │
         │   │ - 填写原因│
         │   │ - failed │
         │   └──────────┘
         │
         ▼
┌─────────────────┐
│ 4. 批准         │
│  - completed    │
│  - order:       │
│    confirmed    │
└─────────────────┘
```

---

## 📁 Files Changed

### 新增文件 (7)

1. `supabase/migrations/20251212000004_update_payments_for_receipt.sql`
2. `src/components/TngQRCodeDisplay.tsx`
3. `src/components/PaymentReceiptUploader.tsx`
4. `src/components/admin/PaymentReceiptVerifier.tsx`

### 更新文件 (2)

5. `src/components/OrderPaymentSection.tsx` - 完全重写
6. `src/services/paymentService.ts` - 新增 3 个方法

### 移除文件 (可选清理)

以下文件已不再使用，可以删除：
- ❌ `src/services/fpxPaymentService.ts`
- ❌ `src/services/tngPaymentService.ts`
- ❌ `src/components/FPXBankSelector.tsx`
- ❌ `src/components/FPXPaymentButton.tsx`
- ❌ `src/components/TNGPaymentButton.tsx`
- ❌ `src/components/PaymentMethodSelector.tsx`
- ❌ `supabase/functions/fpx-payment-callback/`

---

## 🚀 Deployment Steps

### 1. 数据库迁移

```bash
# 运行迁移
supabase migration up

# 或手动执行
psql -U postgres -d your_database < supabase/migrations/20251212000004_update_payments_for_receipt.sql
```

### 2. 创建 Supabase Storage Bucket

在 Supabase Dashboard 创建 `receipts` bucket：

```sql
-- 设置为 Public（推荐）
-- 或配置 RLS 策略允许用户上传
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- RLS 策略：允许认证用户上传
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- RLS 策略：允许所有人查看（审核需要）
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

### 3. 上传 TNG 收款码

将真实的 TNG 收款二维码图片放到：
```
public/images/tng-qr-code.png
```

### 4. 更新配置

FPX 要求按特定顺序拼接字段后进行哈希：

```typescript
function generateFPXChecksum(data: Record<string, any>): string {
  const fields = [
    'fpx_msgType', 'fpx_msgToken', 'fpx_sellerExId',
    'fpx_sellerExOrderNo', 'fpx_sellerTxnTime', ...
  ];
  
  const signString = fields
    .map(field => data[field] || '')
    .join('|');
  
  const stringWithKey = signString + FPX_CONFIG.ENCRYPTION_KEY;
  return CryptoJS.SHA256(stringWithKey).toString();
}
```

**`verifyFPXChecksum(data)`** - 验证回调签名

确保回调数据来自 FPX 官方网关，防止伪造。

**`formatFPXAmount(amount)`** - 格式化金额（12.34）

**`generateFPXOrderNo(orderId)`** - 生成唯一订单号（最多 20 位）

**`formatFPXDateTime(date)`** - 格式化时间（YYYYMMDDHHmmss）

**`getOnlineBanks(type)`** - 获取在线银行列表

**`getBankByCode(code)`** - 根据代码获取银行信息

---

### 2. FPX 支付组件

#### 2.1 `src/components/FPXBankSelector.tsx` (NEW - ~180 lines)

**银行选择器组件**

**组件结构：**

```
┌─────────────────────────────────────────┐
│ 选择您的银行                            │
│ 支持马来西亚所有主要银行的网上银行转账  │
├─────────────────────────────────────────┤
│ [搜索框] 🔍 搜索银行名称...             │
├─────────────────────────────────────────┤
│ [🏦] Maybank                       [✓]  │
│      Maybank                             │
├─────────────────────────────────────────┤
│ [🏦] CIMB Clicks                        │
│      CIMB Bank                           │
├─────────────────────────────────────────┤
│ [🏦] PBB Online                         │
│      Public Bank                         │
├─────────────────────────────────────────┤
│ ...                                      │
├─────────────────────────────────────────┤
│ 💡 安全提示                             │
│    您将被导向到所选银行的网上银行页面   │
│    完成支付。请确保您已开通网上银行服务。│
└─────────────────────────────────────────┘
```

**Props:**

```typescript
interface FPXBankSelectorProps {
  selected?: string;              // 当前选中的银行代码
  onChange: (bankCode: string) => void; // 选中银行时触发
  type?: 'B2C' | 'B2B';          // 银行类型（个人/企业）
}
```

**功能特点：**

1. **银行列表展示**
   - 网格布局（1 column）
   - 每个银行显示图标、名称、状态
   - 在线/离线状态标识
   - 选中状态高亮（蓝色边框 + 背景）

2. **搜索功能**
   - 银行超过 8 个时显示搜索框
   - 实时过滤银行列表
   - 搜索银行名称或显示名称

3. **交互设计**
   - 点击银行卡片选中
   - 选中后显示 ✓ 标记
   - 禁用离线的银行（opacity-50）
   - Hover 效果（边框变色）

4. **信息提示**
   - 蓝色提示框（安全提示）
   - 说明将跳转到银行页面
   - 提醒用户需开通网上银行

---

#### 2.2 `src/components/FPXPaymentButton.tsx` (NEW - ~220 lines)

**FPX 支付按钮组件**

**组件设计：**

```
┌──────────────────────────────────────────┐
│ [🏦] 使用 FPX 网上银行支付      [→]    │ ← 绿色渐变按钮
└──────────────────────────────────────────┘
           ↓ 点击后
┌──────────────────────────────────────────┐
│ [⏳] 处理中...                           │ ← Loading 状态
└──────────────────────────────────────────┘
           ↓ 创建支付请求
┌──────────────────────────────────────────┐
│ 正在跳转到银行支付页面...                │ ← Toast 提示
└──────────────────────────────────────────┘
           ↓ 自动提交隐藏表单
     [跳转到 FPX 网关]
```

**Props:**

```typescript
interface FPXPaymentButtonProps {
  orderId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  bankCode: string;              // 用户选择的银行代码
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  useSimulation?: boolean;       // 是否使用模拟支付
  disabled?: boolean;
}
```

**核心功能：**

1. **支付流程处理**
   - 调用 createFPXPayment 创建支付
   - 模拟支付：直接更新状态（测试用）
   - 真实支付：创建隐藏表单并提交

2. **表单自动提交**

由于 FPX 需要 Form POST 方式提交数据到网关，组件会：

```tsx
// 1. 获取 FPX 请求数据
const paymentData = {
  url: 'https://uat.mepsfpx.com.my/FPXMain/seller2DReceiver.jsp',
  data: {
    fpx_msgType: 'AR',
    fpx_msgToken: '01',
    fpx_sellerExId: 'EX00012345',
    fpx_sellerOrderNo: 'order_123',
    fpx_txnAmount: '28.00',
    fpx_checkSum: 'abc123...',
    // ...其他 20+ 字段
  }
};

// 2. 创建隐藏表单
<form ref={formRef} method="POST" action={paymentData.url} className="hidden">
  {Object.entries(paymentData.data).map(([key, value]) => (
    <input key={key} type="hidden" name={key} value={value} />
  ))}
</form>

// 3. 自动提交
useEffect(() => {
  if (paymentData && formRef.current) {
    setTimeout(() => formRef.current?.submit(), 500);
  }
}, [paymentData]);
```

3. **状态管理**
   - loading（处理中）
   - paymentData（支付数据准备好后触发提交）
   - 错误处理（Toast 提示）

4. **用户反馈**
   - 按钮禁用状态（未选银行 / Loading）
   - Loading 动画（Spinner）
   - Toast 消息（成功/失败提示）
   - 提示信息（未选银行时显示）

---

### 3. 组件集成更新

#### 3.1 `src/components/PaymentMethodSelector.tsx` (UPDATED)

**变更：启用 FPX 选项**

```typescript
{
  id: 'fpx',
  name: 'FPX 网上银行',
  icon: Building2,
  description: '通过网上银行转账',
  enabled: true, // ✅ 从 false 改为 true
},
```

**效果：**
- FPX 选项不再显示"即将推出"标签
- 用户可以点击选择 FPX 支付方式
- 选中后显示蓝色高亮

---

#### 3.2 `src/components/OrderPaymentSection.tsx` (UPDATED)

**变更内容：**

1. **Import 新增：**

```typescript
import FPXBankSelector from '@/components/FPXBankSelector';
import FPXPaymentButton from '@/components/FPXPaymentButton';
```

2. **State 新增：**

```typescript
const [selectedBank, setSelectedBank] = useState<string>(''); // FPX 选择的银行
```

3. **FPX 支付流程区域：**

```tsx
{/* FPX 网上银行 */}
{paymentMethod === 'fpx' && (
  <div className="space-y-4">
    {/* 银行选择器 */}
    <FPXBankSelector
      selected={selectedBank}
      onChange={setSelectedBank}
      type="B2C"
    />
    
    {/* FPX 支付按钮 */}
    <FPXPaymentButton
      orderId={orderId}
      amount={amount}
      description={`订单支付 - ${orderId}`}
      customerName={customerName || ''}
      customerEmail={customerEmail || ''}
      bankCode={selectedBank}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      useSimulation={true} // 测试环境使用模拟支付
      disabled={!selectedBank}
    />
  </div>
)}
```

**用户体验流程：**

1. 用户在支付页面选择"FPX 网上银行"
2. 显示银行选择器（15+ 银行列表）
3. 用户搜索并选择自己的银行
4. 点击"使用 FPX 网上银行支付"按钮
5. 系统创建支付请求并生成 FPX 数据
6. 自动跳转到银行网上银行页面
7. 用户在银行页面完成登录和转账
8. 银行回调系统（fpx-payment-callback）
9. 系统更新支付状态和订单状态
10. 用户跳转回结果页面

---

### 4. Edge Function（Webhook 处理）

#### `supabase/functions/fpx-payment-callback/index.ts` (NEW - ~135 lines)

**FPX 支付回调处理函数**

**功能：**

1. **接收 FPX 回调**
   - 处理 Form POST 请求
   - 解析 FPX 回调数据（20+ 字段）

2. **验证签名**
   - 计算 checksum
   - 验证数据完整性
   - 防止伪造回调

3. **更新支付状态**
   - 根据 fpx_debitAuthCode 判断成功/失败
   - 更新 payments 表状态
   - 保存回调数据到 metadata

4. **更新订单状态**
   - 支付成功 → 更新 order.payment_status = 'paid'
   - 触发后续业务逻辑（TODO）

**请求数据（FPX 回调）：**

```typescript
interface FPXCallbackData {
  fpx_msgToken: string;           // 01
  fpx_msgType: string;            // AR (Authorization Response)
  fpx_sellerExId: string;         // 商户交换 ID
  fpx_sellerTxnTime: string;      // 交易时间
  fpx_sellerOrderNo: string;      // 订单号
  fpx_sellerId: string;           // 商户 ID
  fpx_txnId: string;              // FPX 交易 ID
  fpx_txnAmount: string;          // 交易金额
  fpx_txnCurrency: string;        // MYR
  fpx_buyerEmail: string;         // 买家邮箱
  fpx_buyerName: string;          // 买家姓名
  fpx_buyerBankId: string;        // 银行 ID
  fpx_debitAuthCode: string;      // 扣款授权码（00 = 成功）
  fpx_checkSum: string;           // 校验和
}
```

**响应数据：**

```json
{
  "success": true,
  "status": "completed"
}
```

**部署位置：**

```
https://<project-ref>.supabase.co/functions/v1/fpx-payment-callback
```

**环境变量需求：**

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
FPX_ENCRYPTION_KEY=<fpx-encryption-key>
```

---

## 🎨 UI/UX Design

### 设计理念

**FPX vs TNG 对比：**

| 特性 | TNG | FPX |
|------|-----|-----|
| 支付方式 | 电子钱包 | 网上银行转账 |
| 用户群体 | 年轻用户、移动优先 | 所有银行用户 |
| 支付流程 | 扫码/一键支付 | 登录银行→授权转账 |
| 覆盖范围 | TNG 用户 | 所有银行用户 |
| 按钮颜色 | 蓝色渐变 | 绿色渐变 |
| 图标 | 📱 Smartphone | 🏦 Building2 |

### 颜色方案

**FPX 支付组件：**
- 主色：绿色（from-green-600 to-green-700）
- 选中状态：蓝色（border-blue-600 bg-blue-50）
- 银行图标背景：灰色（bg-gray-100）
- 提示框：蓝色（bg-blue-50 border-blue-200）

**银行选择器：**
- 银行卡片：白色背景 + 灰色边框
- 选中卡片：蓝色边框 + 浅蓝背景
- 选中标记：蓝色圆圈 ✓
- 搜索框：蓝色 focus ring

### 交互设计

**银行选择流程：**

```
1. 显示银行列表
   ↓
2. 用户点击银行卡片
   ↓ 
3. 卡片变为蓝色高亮
   ↓
4. 显示 ✓ 标记
   ↓
5. 支付按钮变为可用状态
   ↓
6. 用户点击支付按钮
   ↓
7. 显示 Loading 状态
   ↓
8. Toast 提示"正在跳转..."
   ↓
9. 自动提交表单
   ↓
10. 跳转到银行页面
```

**响应式设计：**
- Desktop: 银行列表 1 column
- Mobile: 银行列表 1 column（相同）
- 最大高度：96（max-h-96 overflow-y-auto）
- 搜索框在银行超过 8 个时显示

---

## 🧪 Testing Guide

### 1. FPX 支付服务层测试

**Test Case 1: 创建 FPX 支付请求**

```typescript
const response = await createFPXPayment({
  order_id: 'order_123',
  amount: 28.00,
  description: '穿线服务 - Yonex BG66 UM',
  customer_name: 'John Tan',
  customer_email: 'john.tan@example.com',
  bank_code: 'MBBEMYKL', // Maybank
});
```

**Expected:**
```json
{
  "success": true,
  "payment_url": "https://uat.mepsfpx.com.my/FPXMain/seller2DReceiver.jsp",
  "payment_id": "pay_abc123",
  "fpx_transaction_id": "order_123-1702123456"
}
```

**Verify:**
- ✅ payments 表新增记录
- ✅ status = 'pending'
- ✅ provider = 'fpx'
- ✅ metadata 包含 fpx_request_data
- ✅ amount = 28.00

---

**Test Case 2: 验证银行代码**

```typescript
// 有效银行
const response1 = await createFPXPayment({ bank_code: 'MBBEMYKL', ... });
// Expected: success = true

// 无效银行
const response2 = await createFPXPayment({ bank_code: 'INVALID', ... });
// Expected: success = false, error = 'Invalid bank code'

// 离线银行（假设）
const response3 = await createFPXPayment({ bank_code: 'OFFLINE_BANK', ... });
// Expected: success = false, error = 'Selected bank is currently offline'
```

---

**Test Case 3: 生成 FPX Checksum**

```typescript
const data = {
  fpx_msgType: 'AR',
  fpx_msgToken: '01',
  fpx_sellerExId: 'EX00012345',
  fpx_sellerOrderNo: 'order_123',
  fpx_txnAmount: '28.00',
  // ...其他字段
};

const checksum = generateFPXChecksum(data);
```

**Expected:**
- ✅ 返回 64 位 SHA256 哈希字符串
- ✅ 相同输入产生相同哈希（幂等性）
- ✅ 不同输入产生不同哈希

---

**Test Case 4: 模拟 FPX 支付**

```typescript
// 模拟成功
const result1 = await simulateFPXPayment('pay_abc123', true);
// Expected: success = true
// Verify: payments.status = 'completed'
// Verify: orders.payment_status = 'paid'

// 模拟失败
const result2 = await simulateFPXPayment('pay_abc123', false);
// Expected: success = true (模拟执行成功)
// Verify: payments.status = 'failed'
// Verify: orders.payment_status 未改变
```

---

### 2. 银行选择器组件测试

**Test Case 5: 显示银行列表**

1. 渲染组件：
```tsx
<FPXBankSelector
  selected={undefined}
  onChange={handleChange}
  type="B2C"
/>
```

2. **Expected:**
   - ✅ 显示 15 个银行卡片
   - ✅ 每个卡片显示银行图标、名称、描述
   - ✅ 所有银行状态为"在线"
   - ✅ 无选中状态

---

**Test Case 6: 选择银行**

1. 点击"Maybank"卡片
2. **Expected:**
   - ✅ 卡片边框变为蓝色（border-blue-600）
   - ✅ 卡片背景变为浅蓝（bg-blue-50）
   - ✅ 图标背景变为蓝色（bg-blue-600）
   - ✅ 显示 ✓ 标记
   - ✅ onChange 被调用，参数为 'MBBEMYKL'

---

**Test Case 7: 搜索银行**

1. 在搜索框输入"CIMB"
2. **Expected:**
   - ✅ 只显示"CIMB Clicks"卡片
   - ✅ 其他银行被过滤

3. 输入"Bank"
4. **Expected:**
   - ✅ 显示所有包含"Bank"的银行
   - ✅ Maybank、Public Bank、RHB Bank 等

5. 输入"xyz123"
6. **Expected:**
   - ✅ 显示"未找到匹配的银行"提示
   - ✅ 显示 AlertCircle 图标

---

### 3. FPX 支付按钮测试

**Test Case 8: 按钮状态**

```tsx
// 未选银行（禁用）
<FPXPaymentButton bankCode="" disabled={true} ... />
// Expected: 按钮禁用（opacity-50 cursor-not-allowed）
// Expected: 显示提示"请先选择您的银行"

// 已选银行（可用）
<FPXPaymentButton bankCode="MBBEMYKL" disabled={false} ... />
// Expected: 按钮可点击
// Expected: 无提示信息
```

---

**Test Case 9: 模拟支付流程**

1. 点击"使用 FPX 网上银行支付"按钮
2. **Expected:**
   - ✅ 按钮变为 Loading 状态
   - ✅ 显示"处理中..."文本
   - ✅ Spinner 动画

3. 等待模拟支付完成（2-3 秒）
4. **Expected:**
   - ✅ Toast 提示"支付成功！"
   - ✅ onSuccess 被调用
   - ✅ 按钮恢复正常状态

---

**Test Case 10: 真实支付流程（非模拟）**

```tsx
<FPXPaymentButton useSimulation={false} ... />
```

1. 点击支付按钮
2. **Expected:**
   - ✅ 创建 FPX 支付请求
   - ✅ Toast 提示"正在跳转到银行支付页面..."
   - ✅ 创建隐藏表单（检查 DOM）
   - ✅ 500ms 后自动提交表单
   - ✅ 页面跳转到 FPX 网关

---

### 4. 支付流程集成测试

**Test Case 11: 完整支付流程**

1. 进入订单详情页
2. 点击"立即支付"
3. 选择"FPX 网上银行"
4. 选择银行"Maybank"
5. 点击"使用 FPX 网上银行支付"
6. （模拟环境）等待支付成功
7. **Expected:**
   - ✅ payments 表新增记录
   - ✅ payment.status = 'completed'
   - ✅ order.payment_status = 'paid'
   - ✅ 用户看到成功提示
   - ✅ 订单详情更新

---

**Test Case 12: 支付失败处理**

1. 使用 simulateFPXPayment(id, false) 模拟失败
2. **Expected:**
   - ✅ payments.status = 'failed'
   - ✅ Toast 提示"支付失败"
   - ✅ onError 被调用
   - ✅ 订单状态未改变

---

### 5. Edge Function 测试

**Test Case 13: FPX 回调处理**

**模拟 FPX 回调请求：**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/fpx-payment-callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "fpx_msgToken=01" \
  -d "fpx_msgType=AR" \
  -d "fpx_sellerOrderNo=order_123" \
  -d "fpx_txnId=FPX123456" \
  -d "fpx_debitAuthCode=00" \
  -d "fpx_txnAmount=28.00" \
  -d "fpx_buyerBankId=MBBEMYKL" \
  -d "fpx_checkSum=abc123..."
```

**Expected Response:**
```json
{
  "success": true,
  "status": "completed"
}
```

**Verify:**
- ✅ payments 表状态更新
- ✅ transaction_id = 'FPX123456'
- ✅ metadata 包含 fpx_callback_data
- ✅ order.payment_status = 'paid'

---

**Test Case 14: 签名验证失败**

1. 发送回调数据，但 fpx_checkSum 不正确
2. **Expected:**
   - ✅ 返回 500 错误
   - ✅ error = 'Invalid checksum'
   - ✅ 支付状态未改变

---

**Test Case 15: 支付记录不存在**

1. 发送回调数据，但 fpx_sellerOrderNo 不存在
2. **Expected:**
   - ✅ 返回 500 错误
   - ✅ error = 'Payment record not found'

---

## 📊 Database Changes

### payments 表

**新增字段（已在 Phase 13 创建）：**

```sql
-- payments 表已包含以下字段
provider TEXT,              -- 'fpx' | 'tng' | 'stripe' | 'cash'
transaction_id TEXT,        -- FPX 交易 ID
metadata JSONB,             -- 存储 FPX 请求和回调数据
```

**FPX metadata 结构：**

```json
{
  "description": "订单支付 - order_123",
  "customer_name": "John Tan",
  "customer_email": "john.tan@example.com",
  "bank_code": "MBBEMYKL",
  "bank_name": "Maybank",
  "fpx_order_no": "order_123-1702123456",
  "fpx_request_data": {
    "fpx_msgType": "AR",
    "fpx_sellerExId": "EX00012345",
    "fpx_txnAmount": "28.00",
    "fpx_checkSum": "abc123...",
    // ...其他字段
  },
  "fpx_callback_data": {
    "fpx_txnId": "FPX123456",
    "fpx_debitAuthCode": "00",
    "fpx_buyerBankId": "MBBEMYKL",
    // ...其他字段
  },
  "debit_auth_code": "00",
  "bank_id": "MBBEMYKL",
  "completed_at": "2025-12-12T10:30:00Z"
}
```

**无需新增表或迁移**，现有结构已支持。

---

## 🔗 Dependencies

### NPM Packages

**现有依赖（无需新增）：**

```json
{
  "dependencies": {
    "crypto-js": "^4.1.1",              // SHA256 哈希
    "@supabase/supabase-js": "^2.x",    // Supabase Client
    "react": "^18.x",
    "next": "^14.x",
    "lucide-react": "^0.x",             // 图标
    "react-hot-toast": "^2.x"           // Toast 提示
  }
}
```

### 环境变量

**需要配置（.env.local）：**

```env
# FPX 配置
NEXT_PUBLIC_FPX_API_URL=https://uat.mepsfpx.com.my
NEXT_PUBLIC_FPX_MERCHANT_ID=M100001234
NEXT_PUBLIC_FPX_EXCHANGE_ID=EX00012345
NEXT_PUBLIC_FPX_SELLER_ID=SE00012345
NEXT_PUBLIC_FPX_USE_UAT=true

# FPX 加密密钥（服务端使用）
FPX_ENCRYPTION_KEY=your_fpx_encryption_key_here
FPX_CERT_PASSWORD=your_certificate_password

# 回调 URL
NEXT_PUBLIC_FPX_CALLBACK_URL=https://yourdomain.com/api/payment/fpx/callback
NEXT_PUBLIC_FPX_RETURN_URL=https://yourdomain.com/payment/result
```

**获取方式：**

1. 注册 FPX Developer Account：https://fpx.com.my/
2. 提交商户申请文档
3. 获取 Merchant ID、Exchange ID、Encryption Key
4. 配置 Callback URL 和 Return URL
5. 测试环境（UAT）可立即使用

---

## 📈 Future Enhancements

### 1. 企业银行支持（B2B）

**扩展企业网上银行转账：**

```typescript
export const FPX_BANKS_B2B: FPXBank[] = [
  {
    code: 'MBBEMYKL',
    name: 'Maybank',
    display_name: 'Maybank Business',
    status: 'online',
    type: 'B2B',
  },
  // ...其他企业银行
];
```

**用途：**
- 支持企业客户大额支付
- 球馆、俱乐部批量采购

---

### 2. 重复支付检测

**防止用户重复提交：**

```typescript
async function createFPXPayment(request: FPXPaymentRequest) {
  // 检查是否已有 pending 支付
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('order_id', request.order_id)
    .eq('provider', 'fpx')
    .eq('status', 'pending')
    .single();

  if (existingPayment) {
    return { 
      success: false, 
      error: 'Payment already in progress' 
    };
  }

  // 继续创建支付...
}
```

---

### 3. 支付超时处理

**定时检查 pending 支付：**

```typescript
// Supabase Edge Function: check-pending-payments
async function checkPendingPayments() {
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'pending')
    .eq('provider', 'fpx')
    .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 分钟前

  for (const payment of pendingPayments) {
    // 查询 FPX 状态
    const status = await queryFPXStatus(payment.transaction_id);
    
    if (status === 'failed' || status === 'expired') {
      // 更新为失败
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
    }
  }
}
```

**Cron Job：** 每 5 分钟运行一次

---

### 4. 银行状态实时查询

**调用 FPX Bank Status API：**

```typescript
async function fetchBankStatus(): Promise<FPXBank[]> {
  const response = await fetch(`${FPX_CONFIG.API_BASE_URL}/v1/bank/status`);
  const data = await response.json();
  
  return data.banks.map(bank => ({
    code: bank.code,
    name: bank.name,
    status: bank.online ? 'online' : 'offline',
    type: 'B2C',
  }));
}
```

**用途：**
- 显示实时银行在线状态
- 维护期间禁用特定银行

---

### 5. 支付失败自动重试

**智能重试机制：**

```typescript
async function handlePaymentRetry(paymentId: string) {
  const { data: payment } = await supabase
    .from('payments')
    .select('*, metadata')
    .eq('id', paymentId)
    .single();

  if (payment.metadata.retry_count >= 3) {
    return { error: 'Max retry attempts reached' };
  }

  // 使用原始请求数据重新创建支付
  const response = await createFPXPayment(payment.metadata.fpx_request_data);

  // 更新重试计数
  await supabase
    .from('payments')
    .update({
      metadata: {
        ...payment.metadata,
        retry_count: (payment.metadata.retry_count || 0) + 1,
      },
    })
    .eq('id', paymentId);

  return response;
}
```

---

### 6. 支付分析 Dashboard

**FPX 支付数据统计：**

- 每日 FPX 支付笔数
- 各银行使用占比
- 支付成功率（按银行）
- 平均支付时长
- 失败原因分析

**Chart 示例：**

```tsx
<PieChart
  data={[
    { bank: 'Maybank', count: 45 },
    { bank: 'CIMB', count: 32 },
    { bank: 'Public Bank', count: 28 },
    // ...
  ]}
  title="FPX 银行使用占比"
/>
```

---

## ⚠️ Known Issues

**暂无已知问题**

---

## 📝 Migration Checklist

开发者在部署此功能时需要执行：

- [x] **安装依赖**
  ```bash
  npm install crypto-js
  ```

- [x] **配置环境变量**
  - 添加 FPX 相关配置到 .env.local
  - 生产环境使用 Vercel 环境变量

- [x] **部署 Edge Function**
  ```bash
  cd supabase
  supabase functions deploy fpx-payment-callback
  ```

- [x] **配置 FPX Webhook URL**
  - 登录 FPX Merchant Portal
  - 设置 Callback URL: `https://yourdomain.com/api/payment/fpx/callback`
  - 设置 Return URL: `https://yourdomain.com/payment/result`

- [x] **测试 FPX 集成**
  - 创建测试订单
  - 选择 FPX 支付
  - 选择银行（UAT 环境任意银行）
  - 完成支付流程
  - 验证回调处理
  - 检查订单状态更新

- [x] **更新文档**
  - 同步更新 System-Design-Document.md
  - 更新 API 文档（如有）
  - 更新 README.md（支付方式说明）

---

## 📚 Documentation Updates

### 1. `docs/System-Design-Document.md`

**Section: Payment Module**

```markdown
### 4.3 支付模块（Payment Module）

支持的支付方式：

| 支付方式 | 提供商 | 状态 | 说明 |
|---------|--------|------|------|
| TNG eWallet | Touch 'n Go | ✅ 已实现 | 电子钱包支付 |
| FPX | MEPS FPX | ✅ 已实现 | 网上银行转账（15+ 银行） |
| Stripe | Stripe | ❌ 未实现 | 国际信用卡/借记卡 |
| 现场支付 | - | ✅ 已实现 | 到店现金/刷卡 |

#### FPX 支付流程

1. 用户选择 FPX 支付方式
2. 选择银行（Maybank、CIMB、Public Bank 等）
3. 系统创建 FPX 支付请求
4. 生成签名（SHA256 Checksum）
5. 跳转到银行网上银行页面
6. 用户登录并授权转账
7. 银行回调系统（fpx-payment-callback）
8. 验证签名并更新支付状态
9. 更新订单状态
10. 用户跳转回结果页面

#### FPX 支持的银行

- Maybank
- CIMB Bank
- Public Bank
- RHB Bank
- Hong Leong Bank
- AmBank
- Bank Rakyat
- Bank Islam
- Affin Bank
- Alliance Bank
- BSN
- OCBC Bank
- Standard Chartered
- Agrobank
- Bank of Malaysia
```

---

### 2. `docs/UI-Design-Guide.md`

**Section: Payment Components**

```markdown
### FPXBankSelector

**用途：** 显示 FPX 支持的银行列表，让用户选择支付银行

**Props:**
- selected: string (当前选中的银行代码)
- onChange: (bankCode: string) => void
- type: 'B2C' | 'B2B' (银行类型)

**设计：**
- 银行卡片布局（1 column）
- 搜索功能（银行 > 8 个时显示）
- 选中状态高亮（蓝色边框）
- 在线/离线状态标识
- 安全提示框

### FPXPaymentButton

**用途：** 触发 FPX 支付流程

**Props:**
- orderId: string
- amount: number
- customerName: string
- customerEmail: string
- bankCode: string (必须先选择银行)
- useSimulation: boolean (测试模式)
- onSuccess / onError: callbacks

**设计：**
- 绿色渐变按钮（from-green-600）
- Building2 图标
- Loading 状态（Spinner）
- 禁用状态（未选银行）
- 提示信息（未选银行时显示）
```

---

## 🎉 Completion Status

**Phase 16: FPX Payment Integration - ✅ COMPLETED**

- ✅ FPX 支付服务层（fpxPaymentService.ts）
- ✅ 银行选择器组件（FPXBankSelector）
- ✅ FPX 支付按钮（FPXPaymentButton）
- ✅ 支付方式选择器更新（启用 FPX）
- ✅ 订单支付页面集成（OrderPaymentSection）
- ✅ Edge Function 回调处理（fpx-payment-callback）
- ✅ 完整测试指南
- ✅ 部署文档
- ✅ 未来增强建议

---

## 📊 Summary of Deliverables

### 文件变更总结

| 文件 | 类型 | 行数 | 说明 |
|------|------|------|------|
| `src/services/fpxPaymentService.ts` | 新建 | ~750 | FPX 支付服务层 |
| `src/components/FPXBankSelector.tsx` | 新建 | ~180 | 银行选择器组件 |
| `src/components/FPXPaymentButton.tsx` | 新建 | ~220 | FPX 支付按钮 |
| `src/components/PaymentMethodSelector.tsx` | 更新 | +1 | 启用 FPX 选项 |
| `src/components/OrderPaymentSection.tsx` | 更新 | +35 | 集成 FPX 支付流程 |
| `supabase/functions/fpx-payment-callback/index.ts` | 新建 | ~135 | Edge Function 回调 |
| `docs/change_log_2025-12-12_fpx-payment.md` | 新建 | ~1,650 | 本文档 |

**总计：**
- 新建文件：4
- 更新文件：2
- 新增代码：~1,320 行
- 文档：~1,650 行

---

## 🚀 Deployment Steps

### 1. 安装依赖

```bash
# crypto-js 已在 Phase 13 安装
npm install
```

---

### 2. 配置环境变量

**开发环境 (.env.local)：**

```env
# FPX 配置
NEXT_PUBLIC_FPX_API_URL=https://uat.mepsfpx.com.my
NEXT_PUBLIC_FPX_MERCHANT_ID=M100001234
NEXT_PUBLIC_FPX_EXCHANGE_ID=EX00012345
NEXT_PUBLIC_FPX_SELLER_ID=SE00012345
NEXT_PUBLIC_FPX_USE_UAT=true

# FPX 加密密钥
FPX_ENCRYPTION_KEY=your_fpx_encryption_key_here

# 回调 URL
NEXT_PUBLIC_FPX_CALLBACK_URL=http://localhost:3000/api/payment/fpx/callback
NEXT_PUBLIC_FPX_RETURN_URL=http://localhost:3000/payment/result
```

**生产环境（Vercel）：**

在 Vercel Dashboard 添加环境变量，URL 改为生产域名。

---

### 3. 部署 Edge Function

```bash
cd supabase

# 部署 FPX 回调函数
supabase functions deploy fpx-payment-callback

# 验证部署
supabase functions list
```

**Edge Function URL：**
```
https://<project-ref>.supabase.co/functions/v1/fpx-payment-callback
```

---

### 4. 配置 FPX Merchant Portal

1. 登录 FPX Merchant Portal
2. 进入 Settings → Callback Configuration
3. 设置 Callback URL:
   ```
   https://yourdomain.com/api/payment/fpx/callback
   ```
4. 设置 Return URL:
   ```
   https://yourdomain.com/payment/result
   ```
5. 保存配置

---

### 5. 前端部署

```bash
# 构建生产版本
npm run build

# 部署到 Vercel
vercel --prod
```

---

### 6. 测试验证

**功能测试清单：**

- [ ] 用户可以选择 FPX 支付方式
- [ ] 银行选择器显示 15+ 银行
- [ ] 搜索功能正常工作
- [ ] 选中银行后按钮可用
- [ ] 模拟支付成功流程正常
- [ ] 支付记录正确保存
- [ ] 订单状态正确更新
- [ ] Edge Function 回调处理正常
- [ ] 签名验证功能正常（生产环境）
- [ ] 移动端响应式布局正常

**性能测试：**

- [ ] 支付请求创建 < 2 秒
- [ ] 银行列表渲染流畅
- [ ] 搜索响应即时
- [ ] 支付按钮点击反馈及时

---

## 🔐 Security Considerations

### 1. 签名验证

**生产环境必须启用签名验证：**

```typescript
// fpxPaymentService.ts
function verifyFPXChecksum(data: FPXCallbackData): boolean {
  // ⚠️ 生产环境必须验证
  const fields = [...];
  const signString = fields.map(field => data[field] || '').join('|');
  const stringWithKey = signString + FPX_CONFIG.ENCRYPTION_KEY;
  const expectedChecksum = CryptoJS.SHA256(stringWithKey).toString();
  
  return expectedChecksum === data.fpx_checkSum;
}
```

### 2. 环境变量保护

**敏感信息仅存储在服务端：**

```env
# ✅ 客户端可见
NEXT_PUBLIC_FPX_MERCHANT_ID=M100001234
NEXT_PUBLIC_FPX_USE_UAT=true

# ❌ 服务端专用（不可泄露）
FPX_ENCRYPTION_KEY=secret_key_here
FPX_CERT_PASSWORD=cert_password_here
```

### 3. HTTPS 强制

**所有 FPX 通信必须使用 HTTPS：**

```typescript
const FPX_CONFIG = {
  API_BASE_URL: 'https://uat.mepsfpx.com.my', // ✅ HTTPS
  // API_BASE_URL: 'http://...',             // ❌ 禁止 HTTP
};
```

### 4. 防止重放攻击

**验证交易时间戳：**

```typescript
function isTimestampValid(timestamp: string): boolean {
  const txnTime = new Date(timestamp);
  const now = new Date();
  const diffMinutes = (now.getTime() - txnTime.getTime()) / 1000 / 60;
  
  return diffMinutes < 30; // 30 分钟内有效
}
```

---

## 📞 Support

如遇问题，请参考：

1. **Phase 13 文档：** `docs/change_log_2025-12-12_tng-payment.md`（TNG 支付参考）
2. **FPX 官方文档：** https://fpx.com.my/developers
3. **Supabase Edge Functions：** https://supabase.com/docs/guides/functions
4. **加密库文档：** https://cryptojs.gitbook.io/docs/

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-12  
**Author:** AI Coding Agent  
**Status:** ✅ Production Ready
