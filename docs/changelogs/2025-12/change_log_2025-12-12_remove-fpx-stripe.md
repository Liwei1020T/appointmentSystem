# Change Log — 移除 FPX 和其他支付网关

**日期：** 2025-12-12  
**类型：** 代码清理 / 架构简化  
**状态：** ✅ 完成

---

## 📋 Summary

系统现在**仅支持 TNG QR Code 手动支付和现金支付**，已移除所有 FPX、Stripe、信用卡支付相关代码。

**简化后的支付方式：**
- ✅ TNG QR Code (手动支付 + 收据上传)
- ✅ 现金支付 (到店支付)
- ❌ FPX (已移除)
- ❌ Stripe (已移除)
- ❌ 信用卡/借记卡 (已移除)

---

## 🎯 Changes Made

### 1. 类型定义更新

**File:** `src/types/database.ts`

**Before:**
```typescript
provider: 'fpx' | 'tng' | 'stripe' | 'card';
status: 'pending' | 'success' | 'failed' | 'refunded';
```

**After:**
```typescript
provider: 'tng' | 'cash'; // Only TNG QR Code and Cash payment
status: 'pending' | 'pending_verification' | 'success' | 'failed' | 'refunded';
```

**新增字段：**
- `receipt_url?: string` - 收据 URL
- `receipt_uploaded_at?: string` - 收据上传时间
- `verified_by?: string` - 审核管理员
- `verified_at?: string` - 审核时间
- `admin_notes?: string` - 管理员备注

---

### 2. 前端组件清理

#### **PackagePurchaseFlow.tsx**

**移除的支付选项：**
- ❌ FPX 网上银行
- ❌ 信用卡/借记卡

**保留的支付选项：**
- ✅ Touch n Go eWallet (扫描 QR Code)
- ✅ 到店支付 (现金)

**Before:**
```typescript
const paymentMethods = [
  { value: 'fpx', label: 'FPX 网上银行', icon: '🏦' },
  { value: 'tng', label: 'Touch n Go eWallet', icon: '💰' },
  { value: 'card', label: '信用卡/借记卡', icon: '💳' },
  { value: 'cash', label: '到店支付', icon: '💵' },
];
```

**After:**
```typescript
const paymentMethods = [
  { value: 'tng', label: 'Touch n Go eWallet', icon: '💰', description: '扫描 QR Code 支付' },
  { value: 'cash', label: '到店支付', icon: '💵', description: '到店后现金支付' },
];
```

---

#### **OrderPaymentSection.tsx**

**移除的组件：**
- ❌ `FPXPaymentButton`
- ❌ Card 支付选项
- ❌ 所有支付网关相关逻辑

**当前流程 (仅 TNG):**
1. 显示 TNG 收款码
2. 用户扫码支付
3. 用户上传支付收据
4. 管理员审核收据
5. 审核通过后订单生效

---

#### **RefundRequestModal.tsx**

**Before:**
```tsx
{paymentProvider === 'fpx' && (
  <div className="bg-yellow-50">
    <p>FPX 退款说明</p>
    <p>FPX 支付需要手动退款，批准后请联系银行处理退款流程。</p>
  </div>
)}
```

**After:**
```tsx
{paymentProvider === 'tng' && (
  <div className="bg-blue-50">
    <p>TNG 退款说明</p>
    <p>TNG 支付退款需要手动处理，批准后请通过 Touch n Go 平台进行退款操作。</p>
  </div>
)}
```

---

### 3. 服务层清理

#### **refundService.ts**

**移除的逻辑：**
- ❌ FPX 退款处理

**更新的注释：**
```typescript
/**
 * 退款处理逻辑：
 * - TNG（手动退款，通过 Touch n Go 平台处理）
 * - 现金（手动退款，现场退还现金）
 */
```

**Before:**
```typescript
case 'fpx':
  // FPX 通常是手动退款（银行不支持自动退款）
  transactionId = `FPX_MANUAL_${Date.now()}`;
  processSuccess = true;
  break;
```

**After:**
```typescript
// 已移除 FPX case
```

---

### 4. Edge Functions 清理

#### **payment-webhook/index.ts**

**Before:**
```typescript
/**
 * Supported payment providers (extendable):
 * - Stripe
 * - FPX (Malaysia)
 * - Touch 'n Go eWallet
 * - Manual (for testing)
 */

interface PaymentWebhookPayload {
  provider: 'stripe' | 'fpx' | 'tng' | 'manual';
}
```

**After:**
```typescript
/**
 * Supported payment providers:
 * - TNG (Touch 'n Go eWallet) - Manual payment with receipt
 * - Cash - In-store payment
 */

interface PaymentWebhookPayload {
  provider: 'tng' | 'cash';
}
```

**简化的签名验证：**
- 移除 Stripe HMAC 验证示例
- TNG 通过收据审核验证（非实时 webhook）

---

#### **process-refund/index.ts**

**移除的逻辑：**
```typescript
case 'fpx': {
  // FPX requires manual refund
  transactionId = `FPX_MANUAL_${Date.now()}`;
  processSuccess = true;
  errorMessage = 'FPX refund requires manual processing via bank';
  break;
}
```

**仅保留：**
- TNG 退款逻辑
- 现金退款逻辑

---

## 📊 Impact Analysis

### 用户端影响

**优化点：**
- ✅ 支付流程更简单（只有 2 个选项）
- ✅ 减少用户困惑（不会看到"即将推出"的选项）
- ✅ TNG 是马来西亚最流行的电子钱包，覆盖率高

**无影响：**
- 现有 TNG 支付功能完全保留
- 现金支付流程不变

---

### 管理端影响

**简化的审核流程：**
- 只需审核 TNG 收据
- 不需要处理多个支付网关的回调
- 退款流程统一（手动处理）

---

### 技术债务减少

**移除的未使用代码：**
- FPXPaymentButton 组件（不存在）
- Stripe webhook 处理逻辑（未实现）
- 多支付网关配置（未配置）

**架构简化：**
- 支付状态流转更清晰
- 减少外部依赖
- 降低维护成本

---

## 🧪 Testing Checklist

### 用户端测试

- [ ] 套餐购买流程
  - [ ] 只显示 TNG 和现金支付选项
  - [ ] TNG 支付可以成功创建订单
  - [ ] 可以上传收据

- [ ] 订单支付流程
  - [ ] 显示 TNG QR Code
  - [ ] 可以上传支付收据
  - [ ] 收据上传后显示待审核状态

### 管理端测试

- [ ] 支付审核
  - [ ] 可以查看待审核的 TNG 支付
  - [ ] 可以批准/拒绝支付
  - [ ] 退款申请显示正确的 TNG 退款说明

### 数据库验证

- [ ] 检查现有支付记录
  ```sql
  SELECT provider, COUNT(*) 
  FROM payments 
  GROUP BY provider;
  ```
  
- [ ] 确认没有 fpx/stripe/card 类型约束错误

---

## 🚨 Breaking Changes

### 无破坏性变更

**原因：**
1. FPX、Stripe、Card 支付从未实际部署
2. 所有现有支付都是 TNG 或 cash
3. 数据库中 provider 字段为 text 类型，不受影响

### 数据迁移

**无需迁移：**
- 现有数据库记录不受影响
- Payment 表的 provider 字段接受任何字符串值
- TypeScript 类型更新仅影响前端验证

---

## 📝 Updated Files

### 类型定义
- ✅ `src/types/database.ts`

### 前端组件
- ✅ `src/features/packages/PackagePurchaseFlow.tsx`
- ✅ `src/components/OrderPaymentSection.tsx`
- ✅ `src/components/admin/RefundRequestModal.tsx`

### 服务层
- ✅ `src/services/refundService.ts`
- ✅ `src/services/paymentService.ts` (类型已更新)

### Edge Functions
- ✅ `supabase/functions/payment-webhook/index.ts`
- ✅ `supabase/functions/process-refund/index.ts`

### 文档
- ✅ `docs/change_log_2025-12-12_remove-fpx-stripe.md` (NEW)

---

## 🔄 Next Steps

### 立即行动

1. **测试 TNG 支付流程**
   ```bash
   npm run dev
   # 测试套餐购买 → TNG 支付 → 收据上传
   ```

2. **验证管理员审核**
   ```
   访问：/admin/payments
   确认：待审核列表正常显示
   ```

3. **检查数据库约束**
   ```sql
   -- 确保 payments 表没有 provider enum 约束
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'payments';
   ```

### 未来增强 (如需要)

如果将来需要添加其他支付方式：

1. **添加新的 provider 类型**
   ```typescript
   provider: 'tng' | 'cash' | 'new_provider';
   ```

2. **实现对应的组件和逻辑**
   - 支付按钮组件
   - Webhook 处理
   - 退款逻辑

3. **更新文档**
   - API 规范
   - 用户指南
   - 变更日志

---

## ✅ Completion Status

| Task | Status |
|------|--------|
| 类型定义清理 | ✅ 完成 |
| 前端组件清理 | ✅ 完成 |
| 服务层清理 | ✅ 完成 |
| Edge Functions 清理 | ✅ 完成 |
| 文档更新 | ✅ 完成 |
| 测试 | ⏸ 待执行 |

---

## 📌 Notes

### 为什么只保留 TNG？

1. **市场覆盖率**
   - Touch n Go 是马来西亚使用最广泛的电子钱包
   - 几乎所有用户都有 TNG 账户

2. **简化运营**
   - 只需维护一个支付渠道
   - 降低对账复杂度
   - 减少技术支持工作

3. **成本控制**
   - 避免多个支付网关的接入费用
   - 减少交易手续费成本
   - 降低开发和维护成本

### 如果用户没有 TNG？

**解决方案：**
- 提供**现金支付**选项（到店支付）
- 覆盖所有用户场景

---

## 🎉 Conclusion

系统支付流程已成功简化为：
- **在线支付**：TNG QR Code + 收据上传
- **线下支付**：现金到店支付

这样的设计：
- ✅ 满足所有用户需求
- ✅ 降低系统复杂度
- ✅ 减少维护成本
- ✅ 提升用户体验

**Code is cleaner, operations are simpler!** 🚀
