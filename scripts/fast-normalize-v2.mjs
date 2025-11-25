/**
 * 빠른 정규화 v2 (할인 정보 포함)
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const BRAND_MAP = {
  'Fender': '펜더',
  'Squier': '스콰이어',
  'Gibson': '깁슨',
  'Epiphone': '에피폰',
  'Ibanez': '아이바네즈',
  'PRS': 'PRS',
  'ESP': 'ESP',
  'LTD': 'LTD',
  'Yamaha': '야마하',
  'Cort': '콜트',
  'Schecter': '셰터',
  'Jackson': '잭슨',
  'Marshall': '마샬',
  'Vox': 'Vox',
  'Orange': '오렌지',
  'Boss': '보스',
  'Roland': '롤랜드',
  'MXR': 'MXR',
  'Electro-Harmonix': 'EHX',
  'Pearl': 'Pearl',
  'Tama': 'Tama',
  'Seymour Duncan': 'Seymour Duncan',
  'DiMarzio': 'DiMarzio',
  'Gotoh': 'Gotoh',
  'Hipshot': 'Hipshot',
  'Elixir': 'Elixir',
  'D\'Addario': 'D\'Addario',
  'Ernie Ball': 'Ernie Ball',
  'Mogami': 'Mogami',
  'Planet Waves': 'Planet Waves',
  'Music Man': 'Music Man',
  'Sterling': 'Sterling',
};

async function main() {
  console.log('🚀 빠른 정규화 v2 시작 (할인 정보 포함)...\n');

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  // 미처리 raw_products 가져오기
  const rawResult = await client.query(`
    SELECT rp.id, rp.original_name, rp.original_price, rp.original_category,
           rp.discount_info, rp.store_id, rp.original_url, rp.original_image_url
    FROM raw_products rp
    WHERE rp.processed = false
    ORDER BY rp.scraped_at DESC
    LIMIT 1000
  `);

  console.log(`📦 처리할 제품: ${rawResult.rows.length}개\n`);

  let processed = 0;
  let failed = 0;

  for (const raw of rawResult.rows) {
    try {
      // 브랜드 추출
      let brand = 'Unknown';
      for (const [brandName] of Object.entries(BRAND_MAP)) {
        if (raw.original_name.includes(brandName)) {
          brand = brandName;
          break;
        }
      }

      // 모델 추출
      let model = raw.original_name;
      if (brand !== 'Unknown') {
        model = raw.original_name.replace(brand, '').trim();
      }

      // 카테고리 ID 찾기
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1 LIMIT 1',
        [raw.original_category]
      );

      let categoryId = 11; // 기타용품 기본값
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      }

      // products 테이블에 저장
      const productResult = await client.query(
        `INSERT INTO products (name, brand, model, category_id, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [raw.original_name, brand, model, categoryId, raw.original_image_url || null]
      );

      const productId = productResult.rows[0].id;

      // discount_info 파싱
      const discountInfo = raw.discount_info || {};
      const originalPrice = discountInfo.originalPrice || raw.original_price;
      const discountRate = discountInfo.discountRate || 0;
      const isOnSale = discountRate > 0;
      const saleEventName = discountInfo.saleEventName || null;
      const inStock = discountInfo.inStock !== false;
      const freeShipping = discountInfo.freeShipping || false;

      // prices 테이블에 저장 (할인 정보 포함)
      await client.query(
        `INSERT INTO prices (
          product_id,
          store_id,
          price,
          original_price,
          discount_rate,
          is_on_sale,
          sale_event_name,
          product_url,
          in_stock,
          free_shipping,
          scraped_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (product_id, store_id) DO UPDATE SET
          price = $3,
          original_price = $4,
          discount_rate = $5,
          is_on_sale = $6,
          sale_event_name = $7,
          in_stock = $9,
          free_shipping = $10,
          scraped_at = NOW()`,
        [
          productId,
          raw.store_id,
          raw.original_price,
          originalPrice,
          discountRate,
          isOnSale,
          saleEventName,
          raw.original_url || '',
          inStock,
          freeShipping,
        ]
      );

      // raw_products 업데이트
      await client.query(
        'UPDATE raw_products SET processed = true, product_id = $1 WHERE id = $2',
        [productId, raw.id]
      );

      processed++;

      const namePreview = raw.original_name.substring(0, 50);
      const priceStr = raw.original_price.toLocaleString();
      const discountStr = isOnSale ? ` (-${discountRate}%)` : '';
      const saleStr = saleEventName ? ` [${saleEventName}]` : '';

      if (processed % 20 === 0) {
        console.log(`✓ ${processed}/${rawResult.rows.length} 처리됨...`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ 실패 (ID: ${raw.id}):`, error.message);
    }
  }

  console.log(`\n\n✅ 정규화 완료!`);
  console.log(`   성공: ${processed}개`);
  console.log(`   실패: ${failed}개`);

  // 통계
  const stats = await client.query(`
    SELECT
      c.name as category,
      COUNT(DISTINCT p.id) as products,
      COUNT(DISTINCT pr.id) as prices,
      COUNT(CASE WHEN pr.is_on_sale = true THEN 1 END) as on_sale,
      AVG(pr.price)::int as avg_price,
      AVG(pr.discount_rate)::int as avg_discount
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN prices pr ON p.id = pr.product_id
    WHERE p.created_at > NOW() - INTERVAL '5 minutes'
    GROUP BY c.name
    ORDER BY products DESC
  `);

  console.log('\n📊 카테고리별 통계:');
  console.log('='.repeat(100));
  stats.rows.forEach(row => {
    const salePercent = row.prices > 0 ? ((row.on_sale / row.prices) * 100).toFixed(1) : '0.0';
    console.log(
      `${row.category.padEnd(15)} | ` +
      `제품: ${String(row.products).padStart(4)} | ` +
      `가격정보: ${String(row.prices).padStart(4)} | ` +
      `할인중: ${String(row.on_sale).padStart(3)} (${salePercent}%) | ` +
      `평균가: ${row.avg_price.toLocaleString().padStart(10)}원 | ` +
      `평균할인: ${row.avg_discount}%`
    );
  });

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
