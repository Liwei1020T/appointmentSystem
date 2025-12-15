# String Service Platform - 一键启动脚本
# 运行方法: .\start.ps1

Write-Host "`n" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  String Service Platform - 自动启动脚本  " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

# 检查 Docker
Write-Host "→ 检查 Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "  ✓ Docker 已安装" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker 未安装或未运行" -ForegroundColor Red
    Write-Host "  请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# 检查环境变量文件
Write-Host "`n→ 检查环境变量..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Write-Host "  ! 未找到 .env.local 文件" -ForegroundColor Yellow
    Write-Host "  正在从 .env.example 复制..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env.local"
    
    Write-Host "`n  ⚠️  请编辑 .env.local 文件，设置 NEXTAUTH_SECRET" -ForegroundColor Yellow
    Write-Host "  可以使用以下命令生成：" -ForegroundColor Gray
    Write-Host "  [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))" -ForegroundColor Gray
    
    $continue = Read-Host "`n  是否现在打开 .env.local 文件进行编辑? (y/n)"
    if ($continue -eq "y") {
        notepad ".env.local"
        Read-Host "`n  编辑完成后按 Enter 继续"
    }
} else {
    Write-Host "  ✓ .env.local 已存在" -ForegroundColor Green
}

# 启动数据库
Write-Host "`n→ 启动 PostgreSQL 数据库..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 3

$dbStatus = docker-compose ps --services --filter "status=running"
if ($dbStatus -match "postgres") {
    Write-Host "  ✓ 数据库已启动" -ForegroundColor Green
} else {
    Write-Host "  ✗ 数据库启动失败" -ForegroundColor Red
    docker-compose logs
    exit 1
}

# 检查是否需要初始化数据库
Write-Host "`n→ 检查数据库状态..." -ForegroundColor Yellow
$needInit = $false

# 检查 Prisma Client 是否存在
if (!(Test-Path "node_modules\.prisma\client")) {
    Write-Host "  ! Prisma Client 未生成" -ForegroundColor Yellow
    $needInit = $true
}

if ($needInit) {
    Write-Host "`n→ 初始化数据库..." -ForegroundColor Yellow
    
    Write-Host "  1. 生成 Prisma Client..." -ForegroundColor Cyan
    npx prisma generate
    
    Write-Host "`n  2. 创建数据库表..." -ForegroundColor Cyan
    npx prisma db push
    
    Write-Host "`n  3. 导入初始数据..." -ForegroundColor Cyan
    npm run db:seed
    
    Write-Host "`n  ✓ 数据库初始化完成" -ForegroundColor Green
} else {
    Write-Host "  ✓ 数据库已初始化" -ForegroundColor Green
}

# 启动开发服务器
Write-Host "`n→ 启动开发服务器..." -ForegroundColor Yellow
Write-Host "  访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  管理后台: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "  管理员账号: admin@string.com / admin123" -ForegroundColor Cyan
Write-Host "`n  按 Ctrl+C 停止服务器`n" -ForegroundColor Gray

npm run dev
