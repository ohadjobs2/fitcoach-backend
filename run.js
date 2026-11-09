const path = require('path');
const { execSync } = require('child_process');

try {
  // קורא את ההגדרות המקוריות של החבילה המקומית
  const pkg = require('./node_modules/prisma/package.json');
  
  // שולף את הנתיב המדויק לקובץ ההפעלה האמיתי, לא משנה איזו גרסה מותקנת
  const binFile = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.prisma;
  const fullPath = path.join(__dirname, 'node_modules', 'prisma', binFile);
  
  console.log('✅ Found the REAL Prisma ORM at:', fullPath);
  console.log('🚀 Pushing database tables to the cloud...');
  
  // מריץ את פקודת הסנכרון ישירות ללא תיווך הטרמינל
  execSync(`node "${fullPath}" db push`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Failed:', error.message);
}