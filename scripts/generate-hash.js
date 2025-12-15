/**
 * 生成 bcrypt 密码 hash
 * 使用方法: node scripts/generate-hash.js <password>
 * 例如: node scripts/generate-hash.js admin123
 */

const bcrypt = require('bcrypt');

// 从命令行获取密码，如果没有提供则使用默认值
const password = process.argv[2] || 'admin123';
const saltRounds = 10;

console.log('\n🔐 生成 bcrypt hash...\n');
console.log('密码:', password);
console.log('Salt rounds:', saltRounds);
console.log('\n请稍候...\n');

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('✅ Hash 生成成功！\n');
    console.log('Hash:', hash);
    console.log('\n📋 使用方法:\n');
    console.log('1. 在 PostgreSQL 中执行:');
    console.log(`   UPDATE users SET password = '${hash}' WHERE email = 'your-email@example.com';\n`);
    console.log('2. 或在代码中使用:');
    console.log(`   password: '${hash}'\n`);
  })
  .catch(error => {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  });
