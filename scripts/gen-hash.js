// 生成bcrypt hash
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => {
  console.log('\n密码: admin123');
  console.log('Hash:', hash);
  console.log('\nSQL命令:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@example.com';`);
  console.log('\n');
});
