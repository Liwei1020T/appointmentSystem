/**
 * 批量生成多个密码的 hash
 * 使用方法: node scripts/batch-hash.js
 */

const bcrypt = require('bcrypt');

// 要生成hash的密码列表
const passwords = [
  { label: '管理员默认密码', password: 'admin123' },
  { label: '测试密码1', password: 'password123' },
  { label: '测试密码2', password: 'test123' },
];

const saltRounds = 10;

console.log('\n🔐 批量生成 bcrypt hash...\n');

async function generateHashes() {
  for (const item of passwords) {
    try {
      const hash = await bcrypt.hash(item.password, saltRounds);
      console.log(`✅ ${item.label}`);
      console.log(`   密码: ${item.password}`);
      console.log(`   Hash: ${hash}\n`);
    } catch (error) {
      console.error(`❌ ${item.label} 失败:`, error.message);
    }
  }
}

generateHashes()
  .then(() => console.log('✅ 全部完成！\n'))
  .catch(error => console.error('❌ 错误:', error.message));
