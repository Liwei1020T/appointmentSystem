# 🏸 String Service Platform

**羽毛球穿线服务管理平台** | Badminton String Service Management System

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1.0-green)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)

---

## 📖 项目简介 (Overview)

String Service Platform 是一个完整的羽毛球穿线服务数字化管理系统，涵盖：

- ✅ **在线预约** - 用户选择球线、时间，在线预约穿线服务
- ✅ **支付系统** - TNG QR Code 支付，管理员审核确认
- ✅ **套餐销售** - 购买套餐，享受优惠价格
- ✅ **积分系统** - 注册、消费、推荐获得积分
- ✅ **推荐裂变** - 推荐码机制，双向奖励
- ✅ **优惠券** - 积分兑换优惠券，提升复购
- ✅ **评价系统** - 订单完成后评价，提升服务质量
- ✅ **管理后台** - 订单、支付、库存、用户、套餐、优惠券全方位管理
- ✅ **数据统计** - 营收、订单、用户统计，助力业务决策

---

## 🚀 快速开始 (Quick Start)

### 前置要求

- Node.js 18+
- Docker & Docker Compose
- npm 或 pnpm

### 安装与运行

```bash
# 1. 克隆项目
git clone <repository-url>
cd string

# 2. 安装依赖
npm install

# 3. 复制环境变量
cp .env.example .env
# 编辑 .env，设置以下变量：
# - DATABASE_URL
# - NEXTAUTH_SECRET (使用: openssl rand -base64 32)
# - NEXTAUTH_URL

# 4. 启动 PostgreSQL
docker-compose up -d

# 5. 初始化数据库
npm run db:push
npm run db:seed

# 6. 启动开发服务器
npm run dev

# 7. 打开浏览器访问
# http://localhost:3000
```

### 首次使用

1. 访问 `/signup` 注册账户
2. 登录后体验用户功能
3. 在数据库中手动设置管理员权限：
   ```sql
   UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
   ```
4. 访问 `/admin` 体验管理后台

---

## 🏗️ 技术栈 (Tech Stack)

### 前端 (Frontend)
- **Next.js 14** - React 框架（App Router）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **NextAuth.js v5** - 认证系统

### 后端 (Backend)
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - 数据库 ORM
- **PostgreSQL 15** - 关系型数据库
- **bcrypt** - 密码加密
- **Sharp** - 图片处理

### 基础设施 (Infrastructure)
- **Docker** - 容器化
- **Local Storage** - 文件存储
- **JWT Sessions** - 会话管理

---

## 📁 项目结构 (Project Structure)

```
string/
├── src/
│   ├── app/                    # Next.js 页面路由
│   │   ├── (user pages)        # 用户端页面
│   │   │   ├── page.tsx        # 首页/落地页
│   │   │   ├── login/          # 登录
│   │   │   ├── signup/         # 注册
│   │   │   ├── profile/        # 个人中心
│   │   │   ├── booking/        # 预约
│   │   │   ├── orders/         # 订单
│   │   │   ├── packages/       # 套餐
│   │   │   ├── payment/        # 支付
│   │   │   ├── referrals/      # 推荐
│   │   │   ├── reviews/        # 评价
│   │   │   └── vouchers/       # 优惠券
│   │   └── admin/              # 管理后台
│   │       ├── page.tsx        # 后台首页
│   │       ├── orders/         # 订单管理
│   │       ├── payments/       # 支付审核
│   │       ├── inventory/      # 库存管理
│   │       ├── users/          # 用户管理
│   │       ├── packages/       # 套餐管理
│   │       ├── vouchers/       # 优惠券管理
│   │       └── reviews/        # 评价管理
│   ├── components/             # 可复用组件
│   ├── features/               # 功能模块组件
│   ├── lib/                    # 工具函数
│   ├── services/               # API 服务层
│   └── types/                  # TypeScript 类型
├── prisma/
│   ├── schema.prisma           # 数据库 Schema (13 tables)
│   └── seed.ts                 # 数据库种子
├── docs/                       # 项目文档 (40+ files)
├── public/                     # 静态资源
└── docker-compose.yml          # Docker 配置
```

---

## 📊 核心功能 (Core Features)

### 用户功能 (User Features)

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户注册/登录 | ✅ | 手机号/邮箱 + 密码 |
| 在线预约 | ✅ | 选择球线、时间预约 |
| TNG 支付 | ✅ | QR Code 支付 + 上传凭证 |
| 套餐购买 | ✅ | 购买多次套餐享优惠 |
| 积分系统 | ✅ | 注册、消费、推荐获积分 |
| 推荐系统 | ✅ | 推荐码 + 排行榜 |
| 优惠券 | ✅ | 积分兑换 + 使用 |
| 订单管理 | ✅ | 查看、追踪、取消订单 |
| 评价系统 | ✅ | 订单完成后评价 |
| 个人中心 | ✅ | 资料、订单、套餐、积分 |

### 管理功能 (Admin Features)

| 功能 | 状态 | 说明 |
|------|------|------|
| 数据仪表板 | ✅ | 营收、订单、用户统计 |
| 订单管理 | ✅ | 查看、更新、取消订单 |
| 支付审核 | ✅ | 审核用户上传的支付凭证 |
| 库存管理 | ✅ | 球线增删改查 + 库存调整 |
| 用户管理 | ✅ | 用户列表 + 角色/积分管理 |
| 套餐管理 | ✅ | 套餐增删改查 |
| 优惠券管理 | ✅ | 优惠券增删改查 |
| 评价管理 | ✅ | 评价审核 + 删除 |

---

## 🗄️ 数据库模型 (Database Models)

- **User** - 用户表
- **Order** - 订单表
- **Payment** - 支付表
- **StringInventory** - 球线库存
- **Package** - 套餐表
- **UserPackage** - 用户套餐
- **Voucher** - 优惠券
- **UserVoucher** - 用户优惠券
- **PointsLog** - 积分日志
- **ReferralLog** - 推荐记录
- **StockLog** - 库存日志
- **Notification** - 通知表
- **SystemSetting** - 系统设置

完整 ERD 参见：[docs/erd.md](docs/erd.md)

---

## 🔌 API 端点 (API Endpoints)

### 用户 API (16)
- `/api/auth/*` - 认证相关
- `/api/orders` - 订单管理
- `/api/packages` - 套餐查询
- `/api/inventory` - 库存查询
- `/api/points` - 积分查询
- `/api/vouchers` - 优惠券查询
- `/api/profile` - 个人资料
- `/api/referrals` - 推荐相关
- `/api/notifications` - 通知
- `/api/upload` - 文件上传

### 管理 API (10)
- `/api/admin/orders` - 订单管理
- `/api/admin/users` - 用户管理
- `/api/admin/inventory` - 库存管理
- `/api/admin/packages` - 套餐管理
- `/api/admin/vouchers` - 优惠券管理
- `/api/admin/stats` - 统计数据
- `/api/admin/user-points` - 积分管理
- `/api/admin/user-role` - 角色管理

### 支付 API (5)
- `/api/payments/[id]` - 支付详情
- `/api/payments/[id]/proof` - 上传凭证
- `/api/admin/payments/pending` - 待审核支付
- `/api/admin/payments/[id]/confirm` - 确认支付
- `/api/admin/payments/[id]/reject` - 拒绝支付

完整 API 文档：[docs/api_spec.md](docs/api_spec.md)

---

## 📚 文档 (Documentation)

| 文档 | 说明 |
|------|------|
| [AGENTS.md](AGENTS.md) | AI 开发规范 |
| [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | 项目完成状态 |
| [System-Design-Document.md](docs/System-Design-Document.md) | 系统设计文档 |
| [UI-Design-Guide.md](docs/UI-Design-Guide.md) | UI 设计指南 |
| [erd.md](docs/erd.md) | 数据库 ERD |
| [api_spec.md](docs/api_spec.md) | API 规范 |
| [components.md](docs/components.md) | 组件文档 |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | 迁移指南 |
| [change_log_*.md](docs/) | 30+ 变更日志 |

---

## 🧪 测试 (Testing)

### 用户流程测试

```bash
# 1. 注册账户
访问 /signup → 填写信息 → 注册成功

# 2. 预约服务
登录 → /booking → 选择球线和时间 → 提交订单

# 3. 支付流程
上传支付凭证 → 等待管理员审核 → 支付确认

# 4. 购买套餐
/packages → 选择套餐 → 购买 → 使用套餐预约

# 5. 推荐朋友
/referrals → 复制推荐码 → 分享给朋友
```

### 管理员流程测试

```bash
# 1. 设置管理员权限
在数据库执行：UPDATE "User" SET role = 'admin' WHERE email = '...'

# 2. 访问后台
登录 → /admin → 查看统计数据

# 3. 审核支付
/admin/payments → 查看待审核支付 → 确认/拒绝

# 4. 管理订单
/admin/orders → 查看订单 → 更新状态

# 5. 管理库存
/admin/inventory → 添加球线 → 调整库存
```

---

## 🚀 部署 (Deployment)

### 环境准备

1. **设置环境变量**
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="使用 openssl rand -base64 32 生成"
   NEXTAUTH_URL="https://yourdomain.com"
   ```

2. **上传 TNG QR Code**
   - 将真实的 TNG QR Code 图片放到 `/public/images/tng-qr-code.png`

3. **数据库初始化**
   ```bash
   npm run db:push
   npm run db:seed
   ```

### 生产部署

```bash
# 1. 构建应用
npm run build

# 2. 启动应用
npm start

# 3. 使用 PM2（推荐）
pm2 start npm --name "string-platform" -- start

# 4. 配置 Nginx 反向代理
# 5. 配置 SSL 证书
```

详细部署指南：[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

## 📊 项目状态 (Project Status)

**完成度**: 95% ✅

| 模块 | 进度 |
|------|------|
| 后端基础设施 | 100% ✅ |
| 数据库设计 | 100% ✅ |
| API 开发 | 100% ✅ |
| 认证系统 | 100% ✅ |
| 用户界面 | 100% ✅ |
| 管理后台 | 100% ✅ |
| 支付系统 | 100% ✅ |
| 文档 | 100% ✅ |
| 测试 | 20% ⚠️ |
| 部署准备 | 50% ⚠️ |

详细状态：[docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)

---

## 🤝 贡献 (Contributing)

本项目遵循 [AGENTS.md](AGENTS.md) 开发规范。

所有开发必须：
- 遵守系统架构设计
- 更新相关文档
- 编写变更日志
- 保持代码风格一致

---

## 📄 许可证 (License)

MIT License

---

## 📞 联系 (Contact)

如有问题，请查看文档或提交 Issue。

---

**🎯 下一步行动**:

1. ✅ 运行 `npm run dev` 启动开发服务器
2. ⚠️ 完成全流程测试
3. ⚠️ 准备生产部署

**项目状态**: 🟢 核心功能完成，生产就绪（待测试）
