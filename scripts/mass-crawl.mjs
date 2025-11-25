/**
 * 대량 크롤링 스크립트
 * 여러 쇼핑몰에서 제품을 대량으로 수집합니다
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

// 크롤링할 쇼핑몰 및 카테고리 목록
const CRAWL_TARGETS = [
  {
    store: '프리버드뮤직',
    url: 'https://freebud.co.kr',
    categories: [
      { name: '일렉기타', url: 'https://freebud.co.kr/category/일렉기타', count: 50 },
      { name: '어쿠스틱기타', url: 'https://freebud.co.kr/category/어쿠스틱', count: 30 },
      { name: '베이스', url: 'https://freebud.co.kr/category/베이스', count: 30 },
      { name: '앰프', url: 'https://freebud.co.kr/category/앰프', count: 20 },
    ]
  },
  {
    store: '뮤지션마켓',
    url: 'https://www.musicianmarket.co.kr',
    categories: [
      { name: '일렉기타', url: 'https://www.musicianmarket.co.kr/goods/goods_list.php?cateCd=001', count: 40 },
      { name: '베이스', url: 'https://www.musicianmarket.co.kr/goods/goods_list.php?cateCd=002', count: 30 },
    ]
  },
  {
    store: '미스터기타',
    url: 'https://mrguitar.co.kr',
    categories: [
      { name: '일렉기타', url: 'https://mrguitar.co.kr/product/list.html?cate_no=43', count: 50 },
      { name: '어쿠스틱기타', url: 'https://mrguitar.co.kr/product/list.html?cate_no=44', count: 30 },
    ]
  }
];

async function massCrawl() {
  console.log('🚀 대량 크롤링 시작!\n');
  console.log('=' .repeat(60));

  let totalAdded = 0;
  const stats = {
    stores: {},
    categories: {},
    brands: new Set(),
  };

  for (const target of CRAWL_TARGETS) {
    console.log(`\n📦 쇼핑몰: ${target.store}`);
    console.log(`   URL: ${target.url}`);

    // 스토어 생성/확인
    let storeResult = await sql`
      SELECT id FROM stores WHERE name = ${target.store}
    `;

    let storeId;
    if (storeResult.rows.length === 0) {
      const insertResult = await sql`
        INSERT INTO stores (name, website_url)
        VALUES (${target.store}, ${target.url})
        RETURNING id
      `;
      storeId = insertResult.rows[0].id;
      console.log(`   ✓ 스토어 생성됨 (ID: ${storeId})`);
    } else {
      storeId = storeResult.rows[0].id;
      console.log(`   ✓ 스토어 확인됨 (ID: ${storeId})`);
    }

    stats.stores[target.store] = { id: storeId, products: 0 };

    // 각 카테고리 크롤링
    for (const category of target.categories) {
      console.log(`\n   📂 카테고리: ${category.name}`);
      console.log(`      목표: ${category.count}개 제품`);

      // 실제 크롤링 대신 데모 데이터 생성
      // (실제 크롤링은 HTML 구조 분석 후 구현)
      const products = await generateDemoProducts(
        target.store,
        category.name,
        category.count
      );

      let added = 0;
      for (const product of products) {
        try {
          await sql`
            INSERT INTO raw_products (
              store_id,
              original_name,
              original_price,
              original_url,
              original_category,
              original_specs,
              scraped_at
            )
            VALUES (
              ${storeId},
              ${product.name},
              ${product.price},
              ${product.url},
              ${category.name},
              ${JSON.stringify(product.specs || {})},
              NOW()
            )
          `;

          added++;
          totalAdded++;

          // 브랜드 추출 (간단한 로직)
          const brand = extractBrand(product.name);
          if (brand) {
            stats.brands.add(brand);
          }

        } catch (error) {
          // 중복 등 무시
        }
      }

      console.log(`      ✓ ${added}개 제품 추가됨`);
      stats.stores[target.store].products += added;

      if (!stats.categories[category.name]) {
        stats.categories[category.name] = 0;
      }
      stats.categories[category.name] += added;

      // 서버 부하 방지
      await delay(1000);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 크롤링 완료!\n');

  console.log('📊 통계:');
  console.log(`   총 제품 수: ${totalAdded}개`);
  console.log(`\n   쇼핑몰별:`);
  for (const [store, data] of Object.entries(stats.stores)) {
    console.log(`     - ${store}: ${data.products}개`);
  }

  console.log(`\n   카테고리별:`);
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`     - ${category}: ${count}개`);
  }

  console.log(`\n   발견된 브랜드: ${stats.brands.size}개`);
  console.log(`     ${Array.from(stats.brands).slice(0, 10).join(', ')}...`);

  console.log('\n💡 다음 단계:');
  console.log(`   1. 정규화: npm run crawl:normalize ${Math.min(totalAdded, 100)}`);
  console.log(`   2. 매칭: npm run crawl:match ${Math.min(totalAdded, 100)}`);
  console.log('   3. 브라우저에서 확인: http://localhost:8080/products');

  process.exit(0);
}

/**
 * 데모 제품 데이터 생성
 * (실제 크롤링 구현 시 이 부분을 실제 스크래핑 로직으로 교체)
 */
async function generateDemoProducts(store, category, count) {
  const brands = ['Fender', 'Gibson', 'Ibanez', 'PRS', 'ESP', 'Yamaha', 'Cort', 'Epiphone', 'Schecter', 'Jackson'];
  const models = {
    '일렉기타': ['Stratocaster', 'Telecaster', 'Les Paul', 'SG', 'RG', 'SE Custom', 'Eclipse', 'Dinky'],
    '어쿠스틱기타': ['Dreadnought', 'Folk', 'Jumbo', 'Concert', 'OM'],
    '베이스': ['Precision Bass', 'Jazz Bass', 'SR', 'Corvette', 'StingRay'],
    '앰프': ['Combo', 'Head', 'Stack'],
  };

  const colors = ['Sunburst', 'Black', 'White', 'Natural', 'Blue', 'Red', 'Green', 'Yellow'];

  const products = [];

  for (let i = 0; i < count; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const modelList = models[category] || ['Standard'];
    const model = modelList[Math.floor(Math.random() * modelList.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const basePrice = category === '앰프' ? 500000 : 800000;
    const price = basePrice + Math.floor(Math.random() * 2000000);

    products.push({
      name: `${brand} ${model} ${color}`,
      price,
      url: `https://${store}.com/product/${i}`,
      specs: {
        brand,
        model,
        color,
      }
    });
  }

  return products;
}

/**
 * 제품명에서 브랜드 추출
 */
function extractBrand(productName) {
  const knownBrands = ['Fender', 'Gibson', 'Ibanez', 'PRS', 'ESP', 'Yamaha', 'Cort', 'Epiphone', 'Schecter', 'Jackson', 'Marshall', 'Orange', 'Boss'];

  for (const brand of knownBrands) {
    if (productName.includes(brand)) {
      return brand;
    }
  }

  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

massCrawl();
