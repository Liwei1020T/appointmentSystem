/**
 * 验证密码和hash是否匹配
 * 使用方法: node scripts/verify-hash.js <password> <hash>
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];
const hash = process.argv[3];

if (!password || !hash) {
  console.log('\n❌ 请提供密码和hash\n');
  console.log('使用方法: node scripts/verify-hash.js <password> <hash>\n');
  console.log('例如: node scripts/verify-hash.js admin123 $2b$10$...\n');
  process.exit(1);
}

console.log('\n🔍 验证密码...\n');
console.log('密码:', password);
console.log('Hash:', hash.substring(0, 30) + '...\n');

bcrypt.compare(password, hash)
  .then(match => {
    if (match) {
      console.log('✅ 密码匹配！\n');
    } else {
      console.log('❌ 密码不匹配！\n');
    }
  })
  .catch(error => {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  });
