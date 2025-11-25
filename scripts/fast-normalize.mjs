/**
 * 빠른 정규화 스크립트 (LLM 없이 규칙 기반)
 * 대량 데이터 처리용
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const BRAND_MAP = {
  'Fender': '펜더',
  'Gibson': '깁슨',
  'Ibanez': '아이바네즈',
  'PRS': 'PRS',
  'ESP': 'ESP',
  'Yamaha': '야마하',
  'Cort': '콜트',
  'Epiphone': '에피폰',
  'Schecter': '셰터',
  'Jackson': '잭슨',
  'Marshall': '마샬',
  'Orange': '오렌지',
  'Boss': '보스',
};

async function fastNormalize(limit = 50) {
  console.log(`🚀 빠른 정규화 시작 (최대 ${limit}개)...\n`);

  const rawProducts = await sql`
    SELECT rp.id, rp.original_name, rp.original_price, rp.original_category,
           rp.original_specs, rp.store_id, rp.original_url
    FROM raw_products rp
    WHERE rp.processed = false
    ORDER BY rp.created_at DESC
    LIMIT ${limit}
  `;

  console.log(`📦 처리할 제품: ${rawProducts.rows.length}개\n`);

  let processed = 0;
  let failed = 0;

  for (const raw of rawProducts.rows) {
    try {
      // 브랜드 추출
      let brand = 'Unknown';
      for (const [brandName] of Object.entries(BRAND_MAP)) {
        if (raw.original_name.includes(brandName)) {
          brand = brandName;
          break;
        }
      }

      // 모델 추출 (브랜드 제거)
      let model = raw.original_name;
      if (brand !== 'Unknown') {
        model = raw.original_name.replace(brand, '').trim();
      }

      // 카테고리 ID 찾기
      const categoryResult = await sql`
        SELECT id FROM categories
        WHERE name = ${raw.original_category}
        LIMIT 1
      `;

      let categoryId = 11; // 기타용품 기본값
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      }

      // products 테이블에 저장
      const productResult = await sql`
        INSERT INTO products (name, brand, model, category_id, description)
        VALUES (
          ${raw.original_name},
          ${brand},
          ${model},
          ${categoryId},
          ${JSON.stringify(raw.original_specs || {})}
        )
        RETURNING id
      `;

      const productId = productResult.rows[0].id;

      // raw_products 업데이트
      await sql`
        UPDATE raw_products
        SET processed = true, product_id = ${productId}
        WHERE id = ${raw.id}
      `;

      // 가격 정보 추가
      await sql`
        INSERT INTO prices (product_id, store_id, price, product_url, in_stock)
        VALUES (
          ${productId},
          ${raw.store_id},
          ${raw.original_price},
          ${raw.original_url},
          true
        )
        ON CONFLICT (product_id, store_id) DO UPDATE
        SET price = ${raw.original_price},
            product_url = ${raw.original_url},
            scraped_at = NOW()
      `;

      processed++;
      if (processed % 10 === 0) {
        console.log(`   ✓ [${processed}/${rawProducts.rows.length}] 처리 중...`);
      }

    } catch (error) {
      failed++;
      console.error(`   ✗ 실패: ${raw.original_name}`, error.message);
    }
  }

  console.log(`\n✅ 완료: ${processed}개 처리, ${failed}개 실패`);

  // 통계
  const stats = await sql`
    SELECT
      COUNT(*) as total_products,
      COUNT(DISTINCT brand) as total_brands,
      COUNT(DISTINCT category_id) as total_categories
    FROM products
  `;

  console.log('\n📊 현재 통계:');
  console.log(`   전체 제품: ${stats.rows[0].total_products}개`);
  console.log(`   브랜드: ${stats.rows[0].total_brands}개`);
  console.log(`   카테고리: ${stats.rows[0].total_categories}개`);

  // 가격 통계
  const priceStats = await sql`
    SELECT COUNT(*) as count FROM prices
  `;
  console.log(`   가격 정보: ${priceStats.rows[0].count}개`);

  process.exit(0);
}

const limit = parseInt(process.argv[2]) || 50;
fastNormalize(limit);
