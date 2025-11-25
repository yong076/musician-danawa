import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 뮤지션마켓 실제 크롤링 (Puppeteer 사용)
 *
 * 실제 브라우저를 사용해서 JavaScript로 렌더링된 콘텐츠도 가져옴
 */

const STORE_NAME = '뮤지션마켓';
const BASE_URL = 'https://www.musicianmarket.co.kr';

// 크롤링할 카테고리
const CATEGORIES = [
  { name: '어쿠스틱기타', code: '002001', maxPages: 2 },
  { name: '일렉기타', code: '005005', maxPages: 2 },
  { name: '베이스', code: '005006', maxPages: 2 },
  { name: '앰프', code: '007', maxPages: 1 },
  { name: '이펙터', code: '006', maxPages: 1 },
  { name: '드럼', code: '004', maxPages: 1 },
  { name: '키보드', code: '003', maxPages: 1 },
];

/**
 * PostgreSQL 클라이언트 생성
 */
function createDbClient() {
  return new Client({
    connectionString: process.env.POSTGRES_URL,
  });
}

/**
 * 상점 ID 가져오기/생성
 */
async function ensureStore(client) {
  const existingResult = await client.query(
    'SELECT id FROM stores WHERE name = $1',
    [STORE_NAME]
  );

  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }

  const insertResult = await client.query(
    'INSERT INTO stores (name, website_url) VALUES ($1, $2) RETURNING id',
    [STORE_NAME, BASE_URL]
  );

  return insertResult.rows[0].id;
}

/**
 * 제품을 DB에 저장
 */
async function saveProduct(client, storeId, product) {
  try {
    const discountInfo = {
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      inStock: product.inStock,
    };

    await client.query(
      `INSERT INTO raw_products (
        store_id,
        original_name,
        original_price,
        original_url,
        original_image_url,
        original_category,
        discount_info,
        scraped_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT DO NOTHING`,
      [
        storeId,
        product.name,
        product.price,
        product.productUrl || '',
        product.imageUrl || null,
        product.category,
        JSON.stringify(discountInfo),
      ]
    );

    return true;
  } catch (error) {
    console.error(`   ❌ Save failed for "${product.name}":`, error.message);
    return false;
  }
}

/**
 * Puppeteer로 페이지 크롤링
 */
async function scrapeCategoryWithPuppeteer(browser, categoryName, categoryCode, page) {
  const url = `${BASE_URL}/goods/goods_list.php?cateCd=${categoryCode}&page=${page}`;

  console.log(`   🌐 Loading: ${url}`);

  try {
    const browserPage = await browser.newPage();

    // 요청 차단 (성능 향상)
    await browserPage.setRequestInterception(true);
    browserPage.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await browserPage.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 제품 정보 추출
    const products = await browserPage.evaluate((cat) => {
      const results = [];

      // 다양한 셀렉터 시도
      const selectors = [
        '.item-display',
        '.goods-item',
        '.list_item',
        'li.item',
        '.goods_list li',
      ];

      let items = [];
      for (const selector of selectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 0) break;
      }

      items.forEach((el) => {
        try {
          // 제품명
          const nameEl = el.querySelector('.item-name, .goods-name, .prod_name, strong, .tit');
          const name = nameEl ? nameEl.textContent.trim().replace(/\\s+/g, ' ') : '';

          if (!name || name.length < 3) return;

          // 가격
          const priceEl = el.querySelector('.price, .sale-price, .item-price, .price_sale, strong.txt_price');
          const priceText = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '';
          const price = priceText ? parseInt(priceText) : null;

          if (!price || price < 1000) return;

          // 원가
          const originalPriceEl = el.querySelector('.consumer-price, .original-price, .price_consumer, .price_origin');
          const originalPriceText = originalPriceEl ? originalPriceEl.textContent.replace(/[^0-9]/g, '') : '';
          const originalPrice = originalPriceText ? parseInt(originalPriceText) : null;

          // 할인율
          let discountRate = null;
          if (originalPrice && originalPrice > price) {
            discountRate = Math.round(((originalPrice - price) / originalPrice) * 100);
          }

          const discountEl = el.querySelector('.discount-rate, .sale-rate, .ico_sale');
          if (discountEl) {
            const discountText = discountEl.textContent.replace(/[^0-9]/g, '');
            if (discountText) discountRate = parseInt(discountText);
          }

          // URL
          const linkEl = el.querySelector('a');
          const productUrl = linkEl ? linkEl.href : '';

          // 이미지
          const imgEl = el.querySelector('img');
          const imageUrl = imgEl ? (imgEl.src || imgEl.dataset.src || '') : '';

          // 재고
          const soldOutEl = el.querySelector('.sold-out, .out-of-stock');
          const inStock = !soldOutEl && !el.textContent.includes('품절');

          results.push({
            name,
            price,
            originalPrice,
            discountRate,
            productUrl,
            imageUrl,
            category: cat,
            inStock,
          });
        } catch (error) {
          // 개별 제품 오류 무시
        }
      });

      return results;
    }, categoryName);

    await browserPage.close();

    return products;
  } catch (error) {
    console.error(`   ❌ Puppeteer scraping failed:`, error.message);
    return [];
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🎸 뮤지션마켓 실제 크롤링 시작 (Puppeteer)!\n');

  const dbClient = createDbClient();
  await dbClient.connect();
  console.log('✓ Database connected\n');

  const storeId = await ensureStore(dbClient);
  console.log(`✓ Store ID: ${storeId}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('✓ Browser launched\n');

  let totalProducts = 0;
  let totalSaved = 0;

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name} (코드: ${category.code})`);

    for (let page = 1; page <= category.maxPages; page++) {
      console.log(`\n   📄 페이지 ${page}/${category.maxPages}`);

      const products = await scrapeCategoryWithPuppeteer(
        browser,
        category.name,
        category.code,
        page
      );

      totalProducts += products.length;
      console.log(`   ✓ ${products.length}개 제품 파싱 완료`);

      // DB에 저장
      for (const product of products) {
        const saved = await saveProduct(dbClient, storeId, product);
        if (saved) {
          totalSaved++;
          const namePreview = product.name.substring(0, 50);
          const priceStr = product.price.toLocaleString();
          const discountStr = product.discountRate ? ` (-${product.discountRate}%)` : '';
          console.log(`   ✓ ${namePreview}... ${priceStr}원${discountStr}`);
        }
      }

      // 서버 부하 방지 딜레이
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await browser.close();
  console.log('\n✓ Browser closed');

  console.log('\n\n🎉 크롤링 완료!');
  console.log(`   총 ${totalProducts}개 제품 발견`);
  console.log(`   ${totalSaved}개 제품 DB에 저장`);

  // 통계 확인
  const stats = await dbClient.query(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN (discount_info->>'discountRate')::int > 0 THEN 1 END) as on_sale
    FROM raw_products
    WHERE store_id = $1`,
    [storeId]
  );

  console.log(`\n📊 DB 통계:`);
  console.log(`   총 raw_products: ${stats.rows[0].total}개`);
  console.log(`   할인 제품: ${stats.rows[0].on_sale}개`);

  await dbClient.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 크롤링 오류:', error);
  process.exit(1);
});
