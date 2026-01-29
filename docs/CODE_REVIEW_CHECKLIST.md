# Code Review Checklist

**String Service Platform — 代码审查清单**
**版本：1.0**
**最后更新：2026-01-27**

---

## 使用说明

在每次开发完成后，逐项检查以下清单。所有项目必须通过才能视为开发完成。

---

## 🔴 必须通过（Blockers）

### 构建验证

```bash
npm run type-check  # TypeScript 类型检查
npm run lint        # ESLint 检查
npm run test:run    # 测试
npm run build       # 构建
```

- [ ] `npm run type-check` 通过，无类型错误
- [ ] `npm run lint` 通过，无 lint 错误
- [ ] `npm run test:run` 通过，所有测试绿色
- [ ] `npm run build` 成功，无构建错误

---

## 🟡 代码质量

### 命名规范

- [ ] 组件文件使用 PascalCase（如 `OrderCard.tsx`）
- [ ] 工具文件使用 camelCase（如 `formatDate.ts`）
- [ ] 变量使用 camelCase（如 `orderTotal`）
- [ ] 常量使用 UPPER_SNAKE_CASE（如 `MAX_FILE_SIZE`）
- [ ] 类型/接口使用 PascalCase（如 `OrderStatus`）

### 类型安全

- [ ] 无 `any` 类型（除非绝对必要并有注释说明）
- [ ] 函数有明确的参数类型和返回类型
- [ ] 使用 Prisma 生成的类型
- [ ] Props 接口正确定义

### 错误处理

- [ ] 使用 `AppError` 抛出业务错误
- [ ] 错误码在 `ERROR_CODES.md` 中定义
- [ ] API 路由有 try-catch 包裹
- [ ] 错误响应使用 `errorResponse()` 函数

### 日志规范

- [ ] 使用 `console.info` 而非 `console.log`
- [ ] 日志包含上下文信息（如 `[ServiceName]`）
- [ ] 无调试代码遗留

### 注释规范

- [ ] 使用 `NOTE:` 代替 `TODO:`/`FIXME:`
- [ ] 复杂业务逻辑有注释说明
- [ ] 公共函数有 JSDoc 注释

---

## 🟢 架构规范

### 代码组织

- [ ] 新组件放在正确的目录（`components/` 或 `features/`）
- [ ] 新服务放在 `services/` 目录
- [ ] 新工具放在 `lib/` 目录
- [ ] API 路由遵循 RESTful 规范

### 组件复用

- [ ] 复用现有组件（Button, Card, Badge 等）
- [ ] 不创建重复功能的组件
- [ ] 遵循 Paper Court 设计系统

### 服务层

- [ ] 业务逻辑在 Service 层，不在 API 路由中
- [ ] 使用事务处理多表操作
- [ ] 正确使用 Prisma 查询

---

## 🔵 安全规范

### 认证授权

- [ ] 需要认证的 API 调用 `requireAuth()`
- [ ] 管理员 API 调用 `requireAdmin()`
- [ ] 资源访问有权限检查（如订单只能被创建者访问）

### 输入验证

- [ ] 使用 Zod schema 验证输入
- [ ] 验证文件上传类型和大小
- [ ] 防止 SQL 注入（使用 Prisma）

### 敏感信息

- [ ] 无硬编码密钥或密码
- [ ] 响应不包含敏感信息（密码哈希等）
- [ ] 环境变量用于配置

---

## 📝 文档规范

### 变更日志

- [ ] 创建 `docs/changelogs/YYYY-MM/change_log_YYYY-MM-DD_<feature>.md`
- [ ] 记录所有新增、修改、修复的内容
- [ ] 列出所有变更的文件

### 文档更新

- [ ] 新增 API → 更新 `api_spec.md`
- [ ] 新增模型 → 更新 `erd.md`
- [ ] 新增服务 → 更新 `SERVICE_ARCHITECTURE.md`
- [ ] 新增组件 → 更新 `components.md`
- [ ] 新增工具 → 更新 `LIB_UTILITIES.md`
- [ ] 业务逻辑 → 更新 `BUSINESS_LOGIC.md`
- [ ] 新增环境变量 → 更新 `ENVIRONMENT_SETUP.md`

---

## 🧪 测试规范

### 测试覆盖

- [ ] 新业务逻辑有单元测试
- [ ] 测试覆盖正常路径
- [ ] 测试覆盖边界情况
- [ ] 测试覆盖错误情况

### 测试质量

- [ ] 测试名称清晰描述测试内容
- [ ] 使用 Arrange-Act-Assert 模式
- [ ] Mock 正确设置
- [ ] 测试相互独立

---

## 🎨 UI/UX 规范

### 设计一致性

- [ ] 遵循 Paper Court 设计系统
- [ ] 使用正确的颜色（`bg-gray-50`, `bg-white`, `accent`）
- [ ] 使用正确的间距（`space-y-6`, `p-4`, `px-5`）
- [ ] 使用正确的圆角（`rounded-xl`）

### 响应式设计

- [ ] 移动端显示正常
- [ ] 使用 Tailwind 响应式类

### 用户体验

- [ ] 有加载状态
- [ ] 有错误提示
- [ ] 有成功反馈
- [ ] 表单有验证提示

---

## ⚡ 性能规范

### 查询优化

- [ ] 使用 `select` 限制返回字段
- [ ] 使用 `include` 避免 N+1 查询
- [ ] 分页查询使用 `take` 和 `skip`
- [ ] 避免在循环中查询数据库

### 前端优化

- [ ] 使用 Next.js Image 组件
- [ ] 大列表使用虚拟滚动或分页
- [ ] 避免不必要的重渲染

---

## 📋 快速检查命令

```bash
# 一键运行所有检查
npm run type-check && npm run lint && npm run test:run && npm run build

# 检查是否有 console.log
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"

# 检查是否有 TODO/FIXME
grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx"

# 检查是否有 any 类型
grep -r ": any" src/ --include="*.ts" --include="*.tsx"
```

---

## ✅ 最终确认

在提交前，确认以下事项：

- [ ] 所有构建检查通过
- [ ] 代码符合项目规范
- [ ] 文档已更新
- [ ] 测试已添加
- [ ] 无遗留调试代码

---

**完成以上所有检查后，开发任务才算完成。**
