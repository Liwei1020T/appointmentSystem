# Edge Function 规范 — create-order

**功能：** 创建订单并处理相关业务逻辑  
**路径：** `supabase/functions/create-order/index.ts`  
**方法：** POST  
**认证：** Required (Bearer Token)

---

## 📋 功能描述

此 Edge Function 负责处理订单创建的完整业务逻辑，包括：
1. 验证库存是否充足
2. 应用优惠券折扣（如有）
3. 使用套餐抵扣（如有）
4. 创建订单记录
5. 创建支付记录（如需支付）
6. 扣减套餐次数（如使用套餐）
7. 标记优惠券为已使用（如使用优惠券）

---

## 📥 Request Body

```typescript
interface CreateOrderRequest {
  string_id: string;          // 球线 ID
  tension: number;            // 拉力（18-30）
  use_package: boolean;       // 是否使用套餐
  voucher_id?: string;        // 优惠券 ID（可选）
  notes?: string;             // 备注（可选）
}
```

**示例：**
```json
{
  "string_id": "uuid-123",
  "tension": 24,
  "use_package": false,
  "voucher_id": "uuid-456",
  "notes": "请提前通知我取拍"
}
```

---

## 📤 Response

### 成功响应 (200 OK)

```typescript
interface CreateOrderResponse {
  success: true;
  data: {
    order_id: string;
    payment_id?: string;      // 如需支付则返回
    amount: number;           // 应付金额
    status: string;           // 订单状态
  };
  message: string;
}
```

**示例：**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid-789",
    "payment_id": "uuid-101",
    "amount": 45.00,
    "status": "pending"
  },
  "message": "Order created successfully"
}
```

### 错误响应 (400/500)

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "库存不足"
  }
}
```

---

## 🔄 业务逻辑流程

```
1. 验证用户身份
   ↓
2. 验证请求参数
   - string_id 是否存在
   - tension 范围 (18-30)
   ↓
3. 检查球线库存
   - 如果库存 < 1，返回错误
   ↓
4. 获取球线价格信息
   ↓
5. 计算订单金额
   - 如果 use_package = true:
     - 验证用户有可用套餐
     - final_price = 0
   - 如果有 voucher_id:
     - 验证优惠券有效性
     - 计算折扣金额
     - final_price = price - discount
   - 否则:
     - final_price = price
   ↓
6. 创建订单记录
   - INSERT INTO orders
   ↓
7. 如果 final_price > 0:
   - 创建支付记录
   - INSERT INTO payments
   ↓
8. 如果 use_package = true:
   - 扣减套餐次数
   - UPDATE user_packages SET remaining = remaining - 1
   ↓
9. 如果使用优惠券:
   - 标记优惠券为已使用
   - UPDATE user_vouchers SET used = true
   ↓
10. 返回成功响应
```

---

## 🔒 安全验证

### 1. 库存验证
```sql
SELECT stock FROM string_inventory WHERE id = {string_id} AND active = true;
```
- 如果 stock < 1，返回错误

### 2. 套餐验证（如使用套餐）
```sql
SELECT * FROM user_packages 
WHERE user_id = {user_id} 
  AND remaining > 0 
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY remaining ASC 
LIMIT 1;
```
- 如果无可用套餐，返回错误

### 3. 优惠券验证（如使用优惠券）
```sql
SELECT uv.*, v.* 
FROM user_vouchers uv
JOIN vouchers v ON uv.voucher_id = v.id
WHERE uv.id = {voucher_id}
  AND uv.user_id = {user_id}
  AND uv.used = false
  AND (uv.expires_at IS NULL OR uv.expires_at > NOW());
```
- 验证最低消费要求
- 如果不满足条件，返回错误

---

## 💾 数据库操作

### 1. 创建订单
```sql
INSERT INTO orders (
  user_id,
  string_id,
  tension,
  price,
  cost_price,
  discount_amount,
  final_price,
  use_package,
  voucher_id,
  status,
  notes
) VALUES (
  {user_id},
  {string_id},
  {tension},
  {price},
  {cost_price},
  {discount_amount},
  {final_price},
  {use_package},
  {voucher_id},
  'pending',
  {notes}
) RETURNING *;
```

### 2. 创建支付记录（如 final_price > 0）
```sql
INSERT INTO payments (
  order_id,
  user_id,
  amount,
  status,
  payment_method
) VALUES (
  {order_id},
  {user_id},
  {final_price},
  'pending',
  'pending'
) RETURNING *;
```

### 3. 扣减套餐次数（如使用套餐）
```sql
UPDATE user_packages
SET remaining = remaining - 1
WHERE id = {package_id};
```

### 4. 标记优惠券已使用（如使用优惠券）
```sql
UPDATE user_vouchers
SET used = true,
    used_at = NOW()
WHERE id = {voucher_id};
```

---

## 🚨 错误代码

| 错误码 | HTTP状态 | 描述 |
|--------|---------|------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `INVALID_PARAMS` | 400 | 参数错误 |
| `STRING_NOT_FOUND` | 404 | 球线不存在 |
| `INSUFFICIENT_STOCK` | 400 | 库存不足 |
| `NO_PACKAGE_AVAILABLE` | 400 | 无可用套餐 |
| `INVALID_VOUCHER` | 400 | 优惠券无效或已使用 |
| `MIN_PURCHASE_NOT_MET` | 400 | 不满足最低消费 |
| `DATABASE_ERROR` | 500 | 数据库错误 |

---

## 📝 实现示例（伪代码）

```typescript
// supabase/functions/create-order/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. 验证用户身份
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })
    }

    // 2. 解析请求参数
    const body = await req.json()
    const { string_id, tension, use_package, voucher_id, notes } = body

    // 3. 验证参数
    if (!string_id || !tension || tension < 18 || tension > 30) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid params' }), { status: 400 })
    }

    // 4. 检查库存
    const { data: string, error: stringError } = await supabase
      .from('string_inventory')
      .select('*')
      .eq('id', string_id)
      .single()

    if (stringError || !string || string.stock < 1) {
      return new Response(JSON.stringify({ success: false, error: 'Insufficient stock' }), { status: 400 })
    }

    // 5. 计算价格
    let final_price = string.price
    let discount_amount = 0
    
    if (use_package) {
      // 验证并使用套餐
      final_price = 0
    } else if (voucher_id) {
      // 应用优惠券
      // discount_amount = calculate_discount()
      // final_price -= discount_amount
    }

    // 6. 创建订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        string_id,
        tension,
        price: string.price,
        cost_price: string.cost_price,
        discount_amount,
        final_price,
        use_package,
        voucher_id,
        status: 'pending',
        notes
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // 7. 创建支付记录（如需）
    // ...

    // 8. 返回成功
    return new Response(JSON.stringify({
      success: true,
      data: { order_id: order.id, amount: final_price, status: 'pending' }
    }), { status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 })
  }
})
```

---

## 🧪 测试用例

### 测试 1: 正常创建订单（无优惠）
```bash
curl -X POST https://<project>.supabase.co/functions/v1/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "string_id": "uuid-123",
    "tension": 24
  }'
```

### 测试 2: 使用套餐抵扣
```bash
curl -X POST https://<project>.supabase.co/functions/v1/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "string_id": "uuid-123",
    "tension": 24,
    "use_package": true
  }'
```

### 测试 3: 使用优惠券
```bash
curl -X POST https://<project>.supabase.co/functions/v1/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "string_id": "uuid-123",
    "tension": 24,
    "voucher_id": "uuid-456"
  }'
```

---

## 📌 注意事项

1. **事务处理**: 所有数据库操作应在事务中执行，确保数据一致性
2. **并发控制**: 使用数据库锁防止库存超卖
3. **幂等性**: 使用唯一标识符防止重复提交
4. **日志记录**: 记录所有操作日志便于追踪
5. **性能优化**: 使用索引优化查询性能

---

## 🔄 后续优化

- 添加库存预留机制（减少超卖风险）
- 实现订单超时自动取消
- 添加订单创建通知（SMS/Push）
- 集成支付网关（FPX/TNG/Stripe）
- 实现订单重试机制
