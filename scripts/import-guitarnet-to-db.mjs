/**
 * 기타네트 JSON 데이터를 데이터베이스에 import
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
config({ path: join(__dirname, '..', '.env.local') });

async function importToDatabase(jsonFile) {
  console.log(`\n📥 데이터베이스 import 시작: ${jsonFile}\n`);

  // JSON 파일 읽기
  const data = JSON.parse(readFileSync(jsonFile, 'utf-8'));
  console.log(`📦 ${data.length}개 제품 로드됨`);

  if (data.length === 0) {
    console.log('⚠️  제품 데이터가 없습니다.');
    return;
  }

  // 스토어 확인/생성
  const storeName = '기타네트';
  const storeUrl = 'https://guitarnet.co.kr';

  let storeId;
  try {
    const existingStore = await sql`
      SELECT id FROM stores WHERE name = ${storeName}
    `;

    if (existingStore.rows.length > 0) {
      storeId = existingStore.rows[0].id;
      console.log(`✓ 기존 스토어 사용: ${storeName} (ID: ${storeId})`);
    } else {
      const newStore = await sql`
        INSERT INTO stores (name, website_url)
        VALUES (${storeName}, ${storeUrl})
        RETURNING id
      `;
      storeId = newStore.rows[0].id;
      console.log(`✓ 새 스토어 생성: ${storeName} (ID: ${storeId})`);
    }
  } catch (error) {
    console.error('❌ 스토어 생성 실패:', error.message);
    return;
  }

  console.log(`\n📊 제품 import 시작...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const product of data) {
    try {
      // 중복 체크 (동일한 store_id와 original_url)
      const existing = await sql`
        SELECT id FROM raw_products
        WHERE store_id = ${storeId}
          AND original_url = ${product.productUrl}
        LIMIT 1
      `;

      if (existing.rows.length > 0) {
        skipCount++;
        if (skipCount <= 5) {
          console.log(`⚠️  [${skipCount}] 이미 존재: ${product.name.substring(0, 50)}...`);
        }
        continue;
      }

      // 할인 정보
      const discountInfo = {
        originalPrice: product.originalPrice,
        discountRate: product.discountRate,
        inStock: product.inStock,
      };

      // raw_products에 저장
      const result = await sql`
        INSERT INTO raw_products (
          store_id,
          original_name,
          original_price,
          original_url,
          original_image_url,
          original_category,
          original_specs,
          discount_info,
          scraped_at
        )
        VALUES (
          ${storeId},
          ${product.name},
          ${product.price},
          ${product.productUrl},
          ${product.imageUrl},
          ${product.category},
          ${JSON.stringify({})},
          ${JSON.stringify(discountInfo)},
          NOW()
        )
        RETURNING id
      `;

      const rawProductId = result.rows[0].id;
      successCount++;

      if (successCount <= 10 || successCount % 20 === 0) {
        console.log(`✅ [${successCount}/${data.length}] ${product.name.substring(0, 50)}... (ID: ${rawProductId})`);
      }

    } catch (error) {
      errorCount++;
      console.error(`❌ [ERROR ${errorCount}] ${product.name}: ${error.message}`);
    }
  }

  console.log(`\n\n🎉 Import 완료!`);
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ⚠️  스킵 (중복): ${skipCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개`);
  console.log(`   📦 전체: ${data.length}개`);

  console.log(`\n💡 다음 단계:`);
  console.log(`   1. npm run crawl:normalize  - LLM으로 정규화`);
  console.log(`   2. npm run crawl:match      - 제품 매칭`);
  console.log(`   3. 웹사이트에서 확인: http://localhost:8080/products`);
}

// CLI 인자로 JSON 파일명 받기
const jsonFile = process.argv[2];

if (!jsonFile) {
  console.error('❌ 사용법: node scripts/import-guitarnet-to-db.mjs <json-file>');
  console.error('   예시: node scripts/import-guitarnet-to-db.mjs guitarnet-products-1234567890.json');
  process.exit(1);
}

importToDatabase(jsonFile).catch(error => {
  console.error('❌ Import 실패:', error);
  process.exit(1);
});
