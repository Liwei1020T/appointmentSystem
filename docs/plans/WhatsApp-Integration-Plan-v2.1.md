# 📱 WhatsApp Integration Plan for String Service Platform (v2.1)

> 适用对象：LW String Studio / 穿线预约与服务管理系统  
> 技术栈假设：Next.js (Route Handlers) + Supabase(Postgres) + WhatsApp Cloud API

---

## 1. 目标 (Objective)

- **自动化通知**：预约成功、收拍确认、完成可取、取货提醒、付款确认
- **用户自助查询**：输入关键字/菜单查询订单状态、预约时间、积分等
- **降低门店沟通成本**：减少来回问答、减少漏发通知、减少错拿/纠纷
- **为后续 AI/运营数据打基础**：消息审计、用户偏好、触达成本、转化数据

---

## 2. 架构设计 (Architecture)

### 2.1 系统交互图（文字版）

1) 用户在 WhatsApp 发消息 → Meta Webhook 推送到你的 `/api/webhooks/whatsapp`  
2) Webhook 端点只做：**验签 + 去重入库 + 入队(Job)** → 立即返回 200  
3) Worker/Job Consumer 处理：
   - 解析消息（文字/按钮/列表）
   - 读取/更新会话状态 (Session State)
   - 调用业务服务（订单、库存、积分）
   - 发送 WhatsApp 回复（文本/模板/交互消息）
4) 发送消息后会收到 status 回调 → 写入审计表（sent/delivered/read/failed）

> 说明：Webhook 若未 200 或投递失败会重试，因此必须做**幂等去重**，并尽量在 Webhook 层“快进快出”。

### 2.2 文件结构（建议）

```
src/
  app/api/webhooks/whatsapp/route.ts          # Webhook handshake + POST 接收
  app/api/jobs/whatsapp/route.ts              # Job consumer (QStash/Queue 拉起)
  services/whatsapp/
    whatsapp.service.ts                       # 发消息（文本/模板/交互）
    whatsapp.router.ts                        # 路由（菜单/关键字/状态机）
    whatsapp.session.ts                       # 会话状态读写
    whatsapp.idempotency.ts                   # 去重/幂等
  lib/
    security/webhook-signature.ts             # 验签（raw bytes）
    utils/phone.ts                            # libphonenumber-js
```

### 2.3 核心组件

- **Webhook Receiver**：验签、解析、写入事件表、入队
- **Idempotency Layer**：以 `message.id`/`statuses.id` 去重
- **Session State Machine**：多轮对话状态管理（Phase 2 必备）
- **WhatsApp Service**：统一封装 Cloud API 调用、模板、重试、错误码映射
- **Audit & Observability**：inbound/outbound/status 统一落库，后台可查

---

## 3. 功能规划 (Feature Roadmap)

### Phase 1: 基础通知与查询 (MVP) — 2–3 天

✅ 业务触发通知（模板消息）
- Appointment Confirmed
- Dropped Off Confirmed
- Service Completed (Ready for Pickup)
- Pickup Reminder (可选)
- Payment Confirmed (可选)

✅ 用户自助查询（服务消息/交互消息）
- `STATUS`：订单状态
- `BOOKING`：下次预约
- `POINTS`：积分
- 简单菜单：按钮/列表（减少用户输入）

### Phase 2: 深度集成 (Conversational UI) — 3–5 天

- 多轮对话预约（选择线材 → 拉力 → 时间 → 确认）
- WhatsApp List/Buttons 做“选项型输入”
- 上传图片（球拍/断线情况）并关联订单（可选）
- Opt-out / Opt-in（STOP/START）与通知偏好设置

### Phase 3: 运营与智能化 (Optional)

- 触达成本与转化：通知→取拍→复购漏斗
- 用户标签：常用线、常用拉力、常去时段
- 智能建议：基于历史订单快速推荐（规则→ML 渐进）

---

## 4. 技术实现细节 (Technical Implementation)

### 4.1 环境变量配置

```bash
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=   # 用于验证 X-Hub-Signature-256

# 可选：Queue / QStash
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
JOBS_SHARED_SECRET=
```

### 4.2 手机号标准化（推荐 libphonenumber-js）

> 你的 v2.0 规则对部分号码可能误判（例如不同位数/前缀）。建议直接用库统一输出 E.164。

```ts
// src/lib/utils/phone.ts
import { parsePhoneNumberFromString } from "libphonenumber-js";

export function toE164MY(input: string) {
  const p = parsePhoneNumberFromString(input, "MY");
  if (!p) return null;
  return p.number; // e.g. +60123456789
}
```

### 4.3 Webhook 实现（验签 + 幂等 + 入队）

#### 4.3.1 验签：必须基于 raw bytes（避免编码差异）

```ts
// src/lib/security/webhook-signature.ts
import crypto from "crypto";

export function verifyXHubSignature256(args: {
  rawBody: Buffer;
  signatureHeader: string | null;
  appSecret: string;
}) {
  const { rawBody, signatureHeader, appSecret } = args;
  if (!signatureHeader) return false;

  // header format: "sha256=<hex>"
  const received = signatureHeader.trim();
  const hmac = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expected = `sha256=${hmac}`;

  // timingSafeEqual 需要长度相同
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
```

#### 4.3.2 幂等去重（P0）

> Webhook 可能重试，因此同一 `message.id` 可能重复到达。必须先写入事件表再处理。

```sql
-- supabase migration
create table if not exists whatsapp_inbound_events (
  id bigint generated by default as identity primary key,
  message_id text unique,
  from_phone text,
  received_at timestamptz default now(),
  payload jsonb
);

create table if not exists whatsapp_message_status (
  id bigint generated by default as identity primary key,
  status_id text unique,
  message_id text,
  status text,
  timestamp timestamptz,
  payload jsonb
);
```

```ts
// src/services/whatsapp/whatsapp.idempotency.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function markInboundSeen(messageId: string, fromPhone: string, payload: any) {
  const { error } = await supabaseAdmin
    .from("whatsapp_inbound_events")
    .insert({ message_id: messageId, from_phone: fromPhone, payload }, { returning: "minimal" });

  // 若唯一键冲突 → 代表已处理过
  if (error && String(error.code) === "23505") return false;
  if (error) throw error;
  return true;
}
```

#### 4.3.3 Webhook Route（快进快出 + 入队）

```ts
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyXHubSignature256 } from "@/lib/security/webhook-signature";
import { markInboundSeen } from "@/services/whatsapp/whatsapp.idempotency";
import { enqueueWhatsappJob } from "@/services/whatsapp/whatsapp.queue";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const ab = await req.arrayBuffer();
  const raw = Buffer.from(ab);

  const ok = verifyXHubSignature256({
    rawBody: raw,
    signatureHeader: req.headers.get("x-hub-signature-256"),
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
  });

  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const body = JSON.parse(raw.toString("utf8"));
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  const message = value?.messages?.[0];
  if (message) {
    const messageId = message.id;
    const fromPhone = message.from;

    const firstTime = await markInboundSeen(messageId, fromPhone, body);
    if (firstTime) {
      await enqueueWhatsappJob({ fromPhone, message, raw: body });
    }
  }

  // status callback（可选入库）
  const statuses = value?.statuses?.[0];
  if (statuses?.id) {
    // 写入 whatsapp_message_status（同样 unique 去重）
  }

  // 必须尽快返回 200
  return NextResponse.json({ ok: true }, { status: 200 });
}
```

### 4.4 Queue / Worker（推荐：Serverless 用队列）

**为什么要队列？**  
Webhook 端点在某些 serverless 环境可能不保证“请求结束后仍继续执行后台任务”。  
因此：Webhook 负责入队；Job endpoint/Worker 负责处理对话逻辑和发消息。

#### 方案 A（推荐）：Upstash QStash

- Webhook 入队：QStash `publishJSON`
- Job endpoint：`/api/jobs/whatsapp`，只接受 QStash 签名或 shared secret

#### 方案 B：自建 Worker（VPS/Node 常驻）

- BullMQ + Redis
- Worker 常驻监听队列，稳定性强

### 4.5 Session State Machine（Phase 2 必备）

```sql
create table if not exists whatsapp_sessions (
  phone text primary key,
  state text not null default 'IDLE',
  context jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  expires_at timestamptz
);
```

状态建议：
- `IDLE`
- `BOOKING_SELECT_STRING`
- `BOOKING_SELECT_TENSION`
- `BOOKING_SELECT_TIME`
- `BOOKING_CONFIRM`

---

## 5. 消息模板 (Message Templates)

### 5.1 需要申请的模板（Utility）

- `appointment_confirmed`
- `dropoff_confirmed`
- `service_completed_ready_pickup`
- `pickup_reminder`（可选）
- `payment_confirmed`（可选）

### 5.2 服务消息（Service Message）
- 24 小时窗口内用户发起会话 → 你回复的服务消息用于客服/查询/对话流程

---

## 6. 安全与错误处理 (Security & Error Handling)

### 6.1 安全措施（P0）

- 验签：`X-Hub-Signature-256` + App Secret
- 幂等：入库 unique key 去重（message.id/status.id）
- 速率限制：按 `fromPhone` / IP 做简单限流（防刷）
- Job endpoint 保护：只允许队列来源调用（签名/secret）

### 6.2 Opt-out / 合规（P1）

- 用户发送 `STOP/UNSUBSCRIBE`：`whatsapp_opt_in=false`
- 用户发送 `START`：恢复订阅
- 模板消息发送前检查 opt-in

### 6.3 错误处理策略

- 发消息失败：记录 error_code + 可重试标记
- Graph API 200 代表“接收”，交付用 status webhook 为准
- 对用户输出：统一友好文案（避免暴露系统信息）

---

## 7. 费用估算 (Cost Estimation) —— v2.1 更新

> **关键变化**：WhatsApp Business Platform 在 2025-07-01 起引入 **per-message pricing**（按“投递成功的消息”计费），并区分 marketing / utility / authentication / service 四类。官方也明确：**service messages 不收费**，以及 **business 回复用户的 utility messages 不收费**。  
> 参考：WhatsApp Business Platform pricing page.

### 7.1 正确的估算方式（不要写死 RM/条）

- 先确定你发送的消息类别：
  - 查询/客服回复 → **Service**（一般不收费）
  - 订单进度通知（模板）→ 多为 **Utility**
  - 促销/拉新 → **Marketing**
  - OTP → **Authentication**
- 再用官方 rate card（按市场/币种/类别）做公式估算：

```
MonthlyCost = Σ(DeliveredCount(category) × Rate(market, category))
```

### 7.2 你业务的“低成本打法”

- 用户先发起查询（Service）→ 多数回复成本可控
- 只在必要节点发模板（Utility）：
  - 完成可取（必发）
  - 预约确认（建议发）
  - 收拍确认（建议发）
  - 取货提醒（可选）

---

## 8. 部署前准备 (Prerequisites Checklist)

### ✅ 已完成
- Meta App + WhatsApp Business Account
- Phone Number verified
- Webhook URL 可公网访问
- Token / Phone Number ID 获取

### 📋 待完成（P0）
- 建表：inbound events / status / sessions / opt-in
- 模板申请与审核通过
- Job queue 方案选定（QStash 或 Worker）
- 后台页面：消息审计/失败重试/会话查看（最小版）

---

## 9. 实施计划 (Implementation Timeline)

### Day 1（P0）
- Webhook + 验签（raw bytes）
- 幂等去重表 + 入库逻辑
- Queue 入队 + Job endpoint 骨架

### Day 2（P0）
- Phase 1 模板通知（订单状态触发）
- `STATUS/POINTS/BOOKING` 查询
- Audit：outbound & status 入库

### Day 3（P1）
- Session state（Phase 2 基础）
- STOP/START opt-out
- 管理端：消息日志列表 + 失败重试按钮（最小版）

---

## 10. 附录：最小可用“菜单路由”建议

用户输入/按钮 → 行为：
- `1` / “查询订单状态” → 要求输入订单号或自动匹配最新订单
- `2` / “查看积分” → 返回积分与可兑换 voucher
- `3` / “预约穿线” → 进入 Phase 2 状态机（后续扩展）

---
