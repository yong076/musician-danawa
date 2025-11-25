/**
 * 테스트 크롤링 스크립트
 * 한 개 쇼핑몰의 한 개 카테고리만 크롤링하여 테스트
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sql } from '@vercel/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 간단한 테스트 스크래퍼 (프리버드뮤직)
 */
async function testScrape() {
  try {
    console.log('🧪 Test Scraping - Freebudmusic\n');

    // 스토어 생성/확인
    let storeResult = await sql`
      SELECT id FROM stores WHERE name = '프리버드뮤직'
    `;

    let storeId;
    if (storeResult.rows.length === 0) {
      const insertResult = await sql`
        INSERT INTO stores (name, website_url)
        VALUES ('프리버드뮤직', 'https://freebud.co.kr')
        RETURNING id
      `;
      storeId = insertResult.rows[0].id;
      console.log(`✓ Created store: 프리버드뮤직 (ID: ${storeId})`);
    } else {
      storeId = storeResult.rows[0].id;
      console.log(`✓ Found existing store: 프리버드뮤직 (ID: ${storeId})`);
    }

    // 테스트 데이터 삽입
    console.log('\n📝 Inserting test products...\n');

    const testProducts = [
      {
        name: 'Fender Player Stratocaster HSS MN 3-Color Sunburst',
        price: 998000,
        url: 'https://freebud.co.kr/product/fender-player-strat',
        category: '일렉기타',
      },
      {
        name: '[펜더] 플레이어 스트라토캐스터 HSS 메이플 3컬러 선버스트',
        price: 995000,
        url: 'https://freebud.co.kr/product/fender-player-strat-2',
        category: '일렉기타',
      },
      {
        name: 'Gibson Les Paul Standard 50s Gold Top',
        price: 3280000,
        url: 'https://freebud.co.kr/product/gibson-les-paul',
        category: '일렉기타',
      },
      {
        name: 'Ibanez RG550 Genesis Collection Desert Sun Yellow',
        price: 1590000,
        url: 'https://freebud.co.kr/product/ibanez-rg550',
        category: '일렉기타',
      },
      {
        name: 'PRS SE Custom 24 Whale Blue',
        price: 1290000,
        url: 'https://freebud.co.kr/product/prs-se-custom-24',
        category: '일렉기타',
      },
    ];

    let inserted = 0;
    for (const product of testProducts) {
      try {
        await sql`
          INSERT INTO raw_products (
            store_id,
            original_name,
            original_price,
            original_url,
            original_category,
            scraped_at
          )
          VALUES (
            ${storeId},
            ${product.name},
            ${product.price},
            ${product.url},
            ${product.category},
            NOW()
          )
        `;
        inserted++;
        console.log(`   ✓ ${product.name}`);
      } catch (error) {
        console.error(`   ✗ Failed: ${product.name}`, error.message);
      }
    }

    console.log(`\n✅ Test scraping completed: ${inserted}/${testProducts.length} products inserted`);

    // 통계 출력
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE processed = true) as processed,
        COUNT(*) FILTER (WHERE processed = false) as unprocessed
      FROM raw_products
      WHERE store_id = ${storeId}
    `;

    console.log('\n📊 Statistics:');
    console.log(`   Total raw products: ${stats.rows[0].total}`);
    console.log(`   Processed: ${stats.rows[0].processed}`);
    console.log(`   Unprocessed: ${stats.rows[0].unprocessed}`);

    console.log('\n💡 Next steps:');
    console.log('   1. Run normalization: npm run crawl:normalize');
    console.log('   2. Run matching: npm run crawl:match');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test scraping failed:', error);
    process.exit(1);
  }
}

testScrape();
