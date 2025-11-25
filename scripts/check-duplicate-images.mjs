import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  console.log('🔍 이미지 중복 분석\n');

  // 가장 많이 중복된 이미지 URL
  const duplicates = await client.query(`
    SELECT image_url, COUNT(*) as count
    FROM product_images
    GROUP BY image_url
    HAVING COUNT(*) > 20
    ORDER BY count DESC
    LIMIT 30
  `);

  console.log('📊 중복이 심한 이미지 (20회 이상):');
  console.log('='.repeat(90));
  duplicates.rows.forEach((row, idx) => {
    const url = row.image_url.substring(0, 70);
    console.log(`${(idx+1).toString().padStart(2)}. [${String(row.count).padStart(4)}회] ${url}`);
  });

  // 전체 통계
  const stats = await client.query(`
    SELECT
      COUNT(DISTINCT image_url) as unique_images,
      COUNT(*) as total_images,
      (COUNT(*) - COUNT(DISTINCT image_url)) as duplicate_count
    FROM product_images
  `);

  const dupePercent = ((stats.rows[0].duplicate_count / stats.rows[0].total_images) * 100).toFixed(1);

  console.log('\n📈 전체 이미지 통계:');
  console.log(`   총 이미지 레코드:  ${stats.rows[0].total_images}개`);
  console.log(`   고유한 URL:        ${stats.rows[0].unique_images}개`);
  console.log(`   중복된 레코드:     ${stats.rows[0].duplicate_count}개 (${dupePercent}%)`);

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
