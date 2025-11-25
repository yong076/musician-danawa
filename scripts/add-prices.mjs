import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function addPrices() {
  console.log('💰 가격 정보 추가 중...\n');

  try {
    // 1. 상점 ID 가져오기
    const storeResult = await sql`SELECT id FROM stores WHERE name = '프리버드뮤직' LIMIT 1`;
    const storeId = storeResult.rows[0].id;
    console.log(`✓ 상점 ID: ${storeId}\n`);

    // 2. raw_products와 products 매핑해서 prices 생성
    const rawProducts = await sql`
      SELECT rp.id, rp.original_price, rp.original_url, rp.product_id
      FROM raw_products rp
      WHERE rp.product_id IS NOT NULL
        AND rp.original_price IS NOT NULL
    `;

    console.log(`📦 처리할 제품: ${rawProducts.rows.length}개\n`);

    let added = 0;
    for (const raw of rawProducts.rows) {
      try {
        await sql`
          INSERT INTO prices (product_id, store_id, price, product_url, in_stock)
          VALUES (
            ${raw.product_id},
            ${storeId},
            ${raw.original_price},
            ${raw.original_url},
            true
          )
          ON CONFLICT (product_id, store_id) DO UPDATE
          SET price = ${raw.original_price},
              product_url = ${raw.original_url},
              scraped_at = NOW()
        `;

        added++;
        console.log(`   ✓ [${added}/${rawProducts.rows.length}] 가격 추가 (제품 ID: ${raw.product_id}, ₩${Number(raw.original_price).toLocaleString()})`);
      } catch (error) {
        console.error(`   ✗ 실패 (제품 ID: ${raw.product_id}):`, error.message);
      }
    }

    console.log(`\n✅ 완료: ${added}개 가격 정보 추가됨`);

    // 3. 확인
    const priceCount = await sql`SELECT COUNT(*) as count FROM prices`;
    console.log(`\n📊 전체 가격 정보: ${priceCount.rows[0].count}개`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

addPrices();
