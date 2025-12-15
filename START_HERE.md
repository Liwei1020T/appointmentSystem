# 🚀 立即开始使用指南

## 第一次运行？跟着这个清单走！

### ☑️ 第 1 步：启动数据库（2分钟）

```powershell
# 确保 Docker Desktop 正在运行
docker-compose up -d

# 验证数据库已启动
docker-compose ps
# 应该看到 postgres 容器状态为 "Up"
```

---

### ☑️ 第 2 步：配置环境变量（1分钟）

```powershell
# 复制环境变量模板
copy .env.example .env.local
```

打开 `.env.local` 文件，**只需修改这一行**：

```env
NEXTAUTH_SECRET="请生成一个随机字符串"
```

**生成 SECRET 的方法（PowerShell）：**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

复制输出的字符串，粘贴到 `.env.local` 的 `NEXTAUTH_SECRET=` 后面。

---

### ☑️ 第 3 步：初始化数据库（2分钟）

```powershell
# 1. 生成 Prisma Client
npx prisma generate

# 2. 创建数据库表
npx prisma db push

# 3. 导入初始数据（管理员账号、示例套餐等）
npm run db:seed
```

你应该看到类似这样的输出：
```
✓ 创建管理员账号: admin@string.com
✓ 创建系统设置
✓ 创建 4 个套餐
✓ 创建 5 个球线库存
✓ 创建 3 个优惠券

✅ 数据库初始化完成！

默认管理员账号:
  邮箱: admin@string.com
  密码: admin123
```

---

### ☑️ 第 4 步：启动项目（30秒）

```powershell
npm run dev
```

等待编译完成，你会看到：
```
ready - started server on 0.0.0.0:3000
```

---

### ☑️ 第 5 步：访问系统

打开浏览器访问: **http://localhost:3000**

#### 测试用户登录
- 前往: http://localhost:3000/login
- 邮箱: `admin@string.com`
- 密码: `admin123`

#### 测试注册新用户
- 前往: http://localhost:3000/signup
- 填写信息注册

#### 访问管理后台
- 使用管理员账号登录后
- 访问: http://localhost:3000/admin

---

## 🎉 完成！

你现在有一个完全运行的系统，包括：
- ✅ PostgreSQL 数据库（带示例数据）
- ✅ NextAuth.js 认证系统
- ✅ 管理员账号
- ✅ 示例套餐和球线库存
- ✅ 示例优惠券

---

## 🔍 可选：查看数据库

想直观查看数据库内容？

```powershell
npm run db:studio
```

会自动打开浏览器到 Prisma Studio，你可以：
- 查看所有表
- 编辑数据
- 添加测试数据

---

## ❓ 遇到问题？

### 数据库连接失败
```powershell
# 检查 Docker
docker-compose ps

# 如果没有运行，重新启动
docker-compose up -d
```

### Prisma Client 错误
```powershell
# 重新生成
npx prisma generate
```

### 端口被占用
```powershell
# 查看哪个程序占用了 3000 端口
netstat -ano | findstr :3000

# 杀掉进程（替换 PID）
taskkill /PID <进程ID> /F

# 或者修改端口
# 在 package.json 中改 dev 命令为: next dev -p 3001
```

---

## 📚 下一步学习

- **查看所有 API**: `docs/api_spec.md`
- **理解数据库结构**: `docs/erd.md`
- **了解迁移细节**: `docs/MIGRATION_COMPLETE.md`

---

## ⚡ 日常开发命令

```powershell
# 启动开发服务器
npm run dev

# 查看数据库
npm run db:studio

# 查看 Docker 日志
docker-compose logs -f

# 重置数据库（谨慎！）
npx prisma db push --force-reset
npm run db:seed
```

---

**开始开发吧！🎨**
