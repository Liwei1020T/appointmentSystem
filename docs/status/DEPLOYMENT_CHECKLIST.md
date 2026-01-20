# 部署检查清单 (Deployment Checklist)

> 上次更新: 2026-01-20

## ✅ 已完成

- [x] 代码审查通过
- [x] 全局错误边界
- [x] API Rate Limiting
- [x] 健康检查端点 `/api/health`
- [x] localStorage 隐私模式兼容
- [x] ESLint 错误修复
- [x] 图片域名配置
- [x] TypeScript 类型检查通过
- [x] 构建成功

---

## ⏳ 待完成

### 📸 图片资源

| 文件路径 | 用途 | 优先级 | 状态 |
|----------|------|--------|------|
| `public/images/tng-qr-code.png` | TNG 收款二维码 | **必须** | ❌ 缺失 |
| `public/images/logo.png` | SEO JSON-LD 品牌 Logo | 推荐 | ❌ 缺失 |

### 🔐 环境变量 (生产环境)

| 变量 | 说明 | 状态 |
|------|------|------|
| `DATABASE_URL` | 生产数据库连接 | ⚠️ 检查 |
| `NEXTAUTH_SECRET` | 随机密钥 (`openssl rand -base64 32`) | ⚠️ 检查 |
| `TWILIO_*` | SMS 发送配置 | ⚠️ 检查 |

### 🛡️ 可选优化

| 项目 | 说明 | 优先级 |
|------|------|--------|
| Sentry 集成 | 生产环境错误监控 | 中 |
| CSRF 保护 | 表单安全增强 | 中 |
| E2E 测试 | Playwright 自动化测试 | 低 |

---

## 📋 部署步骤

1. 上传图片资源到 `public/images/`
2. 确认生产环境变量配置
3. 运行 `npm run build` 确认构建成功
4. 部署到服务器
5. 访问 `/api/health` 确认服务健康

---

## 📞 上线后验证

- [ ] 首页正常加载
- [ ] 用户注册/登录正常
- [ ] TNG 二维码显示正常
- [ ] 预约流程完整
- [ ] 管理后台可访问
