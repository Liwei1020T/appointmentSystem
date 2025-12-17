# 修复 UUID 错误

## 问题原因
NextAuth session 中的 user.id 可能被错误地设置为字母 'u' 而不是完整的 UUID。

## 已修复
1. 在 `src/lib/auth.ts` 中加强了 session callback 的类型转换
2. 确保 `token.id` 被正确转换为字符串

## 解决步骤

### 1. 退出当前登录
点击右上角的用户名 → 退出登录

### 2. 清除浏览器缓存
按 `Ctrl + Shift + Delete` 清除浏览器缓存和 Cookie

### 3. 重新登录
使用你的账号重新登录系统

### 4. 如果问题仍然存在

检查数据库中用户的 ID 是否是有效的 UUID：

```sql
SELECT id, email, full_name FROM users;
```

确保 ID 格式类似：`676ffd1ca-686b-499a-b7de-5ec4dc8cbdbe`

如果 ID 不是 UUID 格式，需要重新创建用户账号。
