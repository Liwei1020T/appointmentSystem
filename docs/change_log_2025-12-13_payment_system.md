# Change Log — 2025-12-13 (Part 3)

## Summary
实现完整的 TNG QR Code 手动支付流程，包括凭证上传、管理员审核、支付确认/拒绝功能。

## Changes

### 新增支付 API Routes（5个）

#### 1. 用户端 - 支付凭证管理
- **POST /api/payments/[id]/proof** - 上传支付凭证
  - 支持 JPG/PNG 格式，最大 5MB
  - 自动压缩图片（最大 1200x1200，质量 85%）
  - 保存到 `public/uploads/payment-proofs/`
  - 更新支付状态为 `pending_verification`
  - 更新订单状态为 `pending_payment_verification`
  - 自动通知管理员审核
  - 通知用户上传成功

- **GET /api/payments/[id]** - 获取支付详情
  - 用户只能查看自己的支付
  - 管理员可以查看所有支付
  - 包含订单和用户信息

#### 2. 管理员 - 支付审核
- **GET /api/admin/payments/pending** - 获取待审核支付列表
  - 仅显示状态为 `pending_verification` 的支付
  - 支持分页（page, limit）
  - 包含用户信息、订单详情、球线信息
  - 显示支付凭证 URL

- **POST /api/admin/payments/[id]/confirm** - 确认支付
  - 更新支付状态为 `completed`
  - 更新订单状态为 `confirmed`
  - 如果是套餐购买，自动激活套餐
  - 记录审核时间和审核人
  - 通知用户支付已确认
  - 使用事务确保数据一致性

- **POST /api/admin/payments/[id]/reject** - 拒绝支付
  - 更新支付状态为 `rejected`
  - 更新订单状态为 `payment_rejected`
  - 通知用户拒绝原因
  - 用户可重新上传凭证

### 新增 Service 文件（1个）

#### `src/services/payment.service.ts`
完整的支付服务层，包含：

**用户功能**
- `getPayment(paymentId)` - 获取支付详情
- `uploadPaymentProof(paymentId, proof)` - 上传支付凭证
- `getPaymentStatusText(status)` - 获取支付状态文本
- `getPaymentStatusColor(status)` - 获取支付状态颜色

**管理员功能**
- `getPendingPayments(page, limit)` - 获取待审核支付
- `confirmPayment(paymentId, transactionId, notes)` - 确认支付
- `rejectPayment(paymentId, reason)` - 拒绝支付

### 新增工具库（1个）

#### `src/lib/payment-helpers.ts`
支付相关工具函数：

**配置函数**
- `getTngQrCodeUrl()` - 获取 TNG QR Code URL（支持环境变量配置）
- `getPaymentAccountName()` - 获取收款账户名称
- `getPaymentAccountPhone()` - 获取收款电话号码
- `getPaymentTimeout()` - 获取支付超时时间

**业务函数**
- `formatAmount(amount)` - 格式化金额显示（RM 50.00）
- `generatePaymentReference(orderId, userId)` - 生成支付参考号
- `validateProofFile(file)` - 验证支付凭证文件
- `getPaymentInstructions()` - 获取支付说明步骤
- `isPaymentExpired(createdAt)` - 检查支付是否超时

### 更新环境变量

更新 `.env.example`，移除不需要的第三方支付网关配置：

```bash
# TNG QR Code 手动支付配置
NEXT_PUBLIC_TNG_QR_CODE_URL=/images/tng-qr-code.png
NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME=ArtSport String Service
NEXT_PUBLIC_PAYMENT_ACCOUNT_PHONE=+60123456789
NEXT_PUBLIC_PAYMENT_ACCOUNT_EMAIL=payment@artsport.com
PAYMENT_TIMEOUT_MINUTES=30
```

## 支付流程

### 完整的用户支付流程

1. **创建订单** → 订单状态：`pending`
2. **创建支付记录** → 支付状态：`pending`
3. **显示 TNG QR Code** → 用户扫码支付
4. **上传支付凭证** → 支付状态：`pending_verification`，订单状态：`pending_payment_verification`
5. **管理员审核**
   - **确认** → 支付状态：`completed`，订单状态：`confirmed`
   - **拒绝** → 支付状态：`rejected`，订单状态：`payment_rejected`（用户可重新上传）

### 套餐购买流程

1. **选择套餐** → 创建支付记录
2. **扫码支付** → 上传凭证
3. **管理员确认** → 自动创建 `UserPackage` 记录
   - 设置剩余次数 = 套餐次数
   - 设置过期时间 = 当前时间 + 有效期（天）
   - 状态：`active`

## 支付状态说明

| 状态 | 说明 | 操作 |
|------|------|------|
| `pending` | 待支付 | 用户需要扫码支付并上传凭证 |
| `pending_verification` | 待审核 | 管理员审核支付凭证 |
| `completed` | 已完成 | 支付成功，订单已确认 |
| `rejected` | 已拒绝 | 凭证不合格，用户可重新上传 |
| `cancelled` | 已取消 | 订单取消，支付失效 |

## 订单状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 待支付 |
| `pending_payment_verification` | 支付待审核 |
| `confirmed` | 已确认（支付成功） |
| `payment_rejected` | 支付被拒绝 |
| `processing` | 处理中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

## 数据库字段使用

### Payment 表新增字段使用

```typescript
{
  proofUrl: string | null,        // 支付凭证图片路径
  verifiedAt: Date | null,         // 审核时间
  verifiedBy: string | null,       // 审核人ID（管理员）
  transactionId: string | null,    // TNG 交易号（可选）
}
```

## 安全考虑

### 文件上传安全
- ✅ 文件类型验证（仅 JPG/PNG）
- ✅ 文件大小限制（5MB）
- ✅ 自动图片压缩和优化
- ✅ UUID 文件名（防止路径遍历）
- ✅ 独立文件夹（payment-proofs）

### 权限控制
- ✅ 用户只能上传自己订单的凭证
- ✅ 用户只能查看自己的支付记录
- ✅ 仅管理员可以审核支付
- ✅ 使用 `requireAuth()` 和 `requireAdmin()` 验证

### 数据一致性
- ✅ 使用事务处理支付确认
- ✅ 同步更新订单状态
- ✅ 套餐购买自动激活
- ✅ 通知系统自动触发

## 使用示例

### 用户上传支付凭证

```typescript
import { uploadPaymentProof } from '@/services/payment.service';

const handleUploadProof = async (paymentId: string, file: File) => {
  try {
    const proofUrl = await uploadPaymentProof(paymentId, file);
    console.log('凭证已上传:', proofUrl);
    alert('支付凭证上传成功，等待审核');
  } catch (error) {
    alert(error.message);
  }
};
```

### 管理员审核支付

```typescript
import { 
  getPendingPayments, 
  confirmPayment, 
  rejectPayment 
} from '@/services/payment.service';

// 获取待审核列表
const payments = await getPendingPayments(1, 20);

// 确认支付
await confirmPayment(paymentId, 'TNG123456789', '支付凭证已核实');

// 拒绝支付
await rejectPayment(paymentId, '支付金额不符，请重新上传');
```

### 显示 TNG QR Code

```typescript
import { 
  getTngQrCodeUrl, 
  getPaymentAccountName,
  formatAmount,
  getPaymentInstructions 
} from '@/lib/payment-helpers';

export default function PaymentPage({ amount, orderId, userId }) {
  const qrCodeUrl = getTngQrCodeUrl();
  const accountName = getPaymentAccountName();
  const reference = generatePaymentReference(orderId, userId);
  const instructions = getPaymentInstructions();

  return (
    <div>
      <h1>扫码支付</h1>
      <img src={qrCodeUrl} alt="TNG QR Code" />
      <p>金额: {formatAmount(amount)}</p>
      <p>收款账户: {accountName}</p>
      <p>请在备注中填写: {reference}</p>
      
      <div>
        <h2>支付步骤</h2>
        {instructions.map((step, i) => (
          <p key={i}>{step}</p>
        ))}
      </div>
    </div>
  );
}
```

## 迁移进度更新

### 已完成（~85%）
- ✅ 核心 API Routes（16个）
- ✅ 管理员 API Routes（10个）
- ✅ 支付 API Routes（5个）
- ✅ Service 层（9个服务文件）
- ✅ 认证系统（NextAuth 集成）
- ✅ 文件上传（本地存储）
- ✅ TNG QR Code 支付流程
- ✅ 支付审核系统
- ✅ 迁移指南文档

### 待完成（~15%）
- ⏳ UI 组件更新（使用新的 service 层）
- ⏳ 支付页面组件
- ⏳ 管理员审核界面
- ⏳ 通知系统 UI
- ⏳ 测试和优化

## 测试端点

启动开发服务器后可测试：

```bash
# 获取支付详情
GET http://localhost:3000/api/payments/{paymentId}

# 上传支付凭证（需要 FormData）
POST http://localhost:3000/api/payments/{paymentId}/proof
Body: FormData { proof: File }

# 管理员 - 获取待审核支付
GET http://localhost:3000/api/admin/payments/pending?page=1&limit=20

# 管理员 - 确认支付
POST http://localhost:3000/api/admin/payments/{paymentId}/confirm
Body: { transactionId: "TNG123", notes: "已核实" }

# 管理员 - 拒绝支付
POST http://localhost:3000/api/admin/payments/{paymentId}/reject
Body: { reason: "金额不符" }
```

## Next Steps

1. **测试支付流程**
   - 创建订单 → 上传凭证 → 管理员审核
   - 测试套餐购买 → 自动激活
   - 测试通知系统

2. **创建 UI 组件**
   - 支付页面（显示 QR Code、上传凭证）
   - 管理员审核页面（列表、预览、确认/拒绝）
   - 支付状态组件

3. **完善功能**
   - 支付超时提醒
   - 凭证预览功能
   - 批量审核功能

4. **部署准备**
   - 配置真实的 TNG QR Code
   - 设置收款账户信息
   - 测试生产环境

## Notes

- ✅ 不需要任何第三方支付 API/Gateway
- ✅ 完全基于 TNG QR Code 扫码支付
- ✅ 管理员手动审核确认
- ✅ 支付凭证自动保存和管理
- ✅ 完整的通知系统
- ✅ 套餐购买自动激活
- ✅ 事务确保数据一致性

---

**迁移进度：约 85% 完成**  
**下一步：UI 组件开发 + 测试**
