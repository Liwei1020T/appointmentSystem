# 快速开始

## 步骤 1: 启动数据库

```powershell
# 启动 PostgreSQL (Docker)
docker-compose up -d

# 确认运行
docker-compose ps
```

## 步骤 2: 配置环境变量

```powershell
# 复制环境变量模板
copy .env.example .env

# 编辑 .env，最少配置：
# DATABASE_URL="postgresql://postgres:password@localhost:5432/string_service?schema=public"
# NEXTAUTH_SECRET="<生成一个32位随机字符串>"
```

生成 NEXTAUTH_SECRET:
```powershell
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 步骤 3: 初始化数据库

```powershell
# 生成 Prisma Client
npx prisma generate

# 创建数据库表结构
npx prisma db push

# (可选) 打开 Prisma Studio 查看数据库
npx prisma studio
```

## 步骤 4: 创建管理员账号

创建初始管理员（可选，通过 Prisma Studio 或运行迁移脚本）:

```sql
-- 在 Prisma Studio 或 PostgreSQL 客户端执行
INSERT INTO users (id, email, password, full_name, role, points)
VALUES (
  gen_random_uuid(),
  'admin@string.com',
  '$2b$10$...',  -- 使用 bcrypt 生成的密码哈希
  '系统管理员',
  'admin',
  0
);
```

或使用注册 API 后手动更新:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## 步骤 5: 运行项目

```powershell
# 开发模式
npm run dev

# 生产构建
npm run build
npm run start
```

访问: http://localhost:3000

## 步骤 6: 测试功能

1. 注册新用户: http://localhost:3000/signup
2. 登录: http://localhost:3000/login
3. 管理后台: http://localhost:3000/admin (需要 admin 角色)

## 常用命令

```powershell
# 数据库操作
npx prisma studio          # 可视化数据库管理
npx prisma db push         # 同步 schema 到数据库
npx prisma generate        # 生成 Prisma Client
npx prisma migrate dev     # 创建迁移(生产推荐)

# Docker 操作
docker-compose up -d       # 启动数据库
docker-compose down        # 停止数据库
docker-compose logs -f     # 查看日志

# 项目操作
npm run dev                # 开发模式
npm run build              # 构建生产版本
npm run start              # 运行生产版本
npm run lint               # 代码检查
```

## 故障排查

### 数据库连接失败
```powershell
# 检查 Docker 是否运行
docker-compose ps

# 检查数据库日志
docker-compose logs postgres

# 重启数据库
docker-compose restart
```

### Prisma Client 未找到
```powershell
npx prisma generate
```

### 端口被占用
```powershell
# 查看端口占用
netstat -ano | findstr :5432
netstat -ano | findstr :3000

# 修改端口 (docker-compose.yml 或 package.json)
```

### NextAuth 错误
- 确保 `NEXTAUTH_SECRET` 已在 `.env` 中设置
- 确保 `NEXTAUTH_URL` 正确 (开发环境 `http://localhost:3000`)

## 下一步

- 阅读 [迁移指南](./MIGRATION_GUIDE.md) 了解迁移详情
- 查看 [API 文档](../core/api_spec.md) 了解接口
- 查看 [ERD 文档](../core/erd.md) 了解数据库结构
