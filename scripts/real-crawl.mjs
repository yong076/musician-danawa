import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 뮤지션마켓 실제 크롤링
 *
 * 모든 카테고리에서 제품을 가져와서 DB에 저장
 */

const STORE_NAME = '뮤지션마켓';
const BASE_URL = 'https://www.musicianmarket.co.kr';

// 크롤링할 카테고리 (실제 카테고리 코드 사용)
const CATEGORIES = [
  { name: '어쿠스틱기타', code: '002001', maxPages: 3 },
  { name: '클래식기타', code: '002002', maxPages: 2 },
  { name: '일렉기타', code: '005005', maxPages: 3 },
  { name: '베이스', code: '005006', maxPages: 2 },
  { name: '앰프', code: '007', maxPages: 2 },
  { name: '이펙터', code: '006', maxPages: 2 },
  { name: '드럼', code: '004', maxPages: 2 },
  { name: '키보드', code: '003', maxPages: 2 },
  { name: '악세서리', code: '008', maxPages: 1 },
];

/**
 * 페이지 HTML을 가져오는 함수
 */
async function fetchPage(url) {
  try {
    console.log(`   🌐 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error(`   ❌ Fetch failed:`, error.message);
    return null;
  }
}

/**
 * 제품 목록 파싱 (실제 HTML 구조에 맞춤)
 */
function parseProductList(html, categoryName) {
  const $ = cheerio.load(html);
  const products = [];

  // 다양한 셀렉터 시도 (실제 사이트 구조에 따라 다름)
  const selectors = [
    '.item-display',
    '.goods-item',
    '.product-item',
    '.list_item',
    'li.item',
    '.goods_list li',
    'div[id*="goods"]',
  ];

  let found = false;
  for (const selector of selectors) {
    const items = $(selector);
    if (items.length > 0) {
      console.log(`   ✓ Found ${items.length} items with selector: ${selector}`);
      found = true;

      items.each((_, element) => {
        try {
          const $el = $(element);

          // 제품명 (다양한 패턴 시도)
          const name = $el.find('.item-name, .goods-name, .prod_name, a[title], strong, .tit')
            .first()
            .text()
            .trim()
            .replace(/\s+/g, ' ');

          if (!name || name.length < 3) return;

          // 가격 추출
          const priceEl = $el.find('.price, .sale-price, .item-price, .price_sale, strong.txt_price');
          let priceText = priceEl.text().replace(/[^0-9]/g, '');
          const price = priceText ? parseInt(priceText) : null;

          if (!price || price < 1000) return; // 최소 가격 검증

          // 원가 (할인 전 가격)
          const originalPriceEl = $el.find('.consumer-price, .original-price, .price_consumer, .price_origin');
          const originalPriceText = originalPriceEl.text().replace(/[^0-9]/g, '');
          const originalPrice = originalPriceText ? parseInt(originalPriceText) : null;

          // 할인율 계산
          let discountRate = null;
          if (originalPrice && originalPrice > price) {
            discountRate = Math.round(((originalPrice - price) / originalPrice) * 100);
          }

          // 할인율 텍스트에서 추출 시도
          const discountEl = $el.find('.discount-rate, .sale-rate, .ico_sale');
          const discountText = discountEl.text().replace(/[^0-9]/g, '');
          if (discountText) {
            discountRate = parseInt(discountText);
          }

          // URL
          let productUrl = $el.find('a').first().attr('href');
          if (productUrl) {
            productUrl = productUrl.startsWith('http') ? productUrl :
                        productUrl.startsWith('/') ? `${BASE_URL}${productUrl}` :
                        `${BASE_URL}/${productUrl}`;
          }

          // 이미지
          let imageUrl = $el.find('img').first().attr('src') ||
                        $el.find('img').first().attr('data-src');
          if (imageUrl) {
            imageUrl = imageUrl.startsWith('http') ? imageUrl :
                      imageUrl.startsWith('//') ? `https:${imageUrl}` :
                      imageUrl.startsWith('/') ? `${BASE_URL}${imageUrl}` :
                      `${BASE_URL}/${imageUrl}`;
          }

          // 재고 확인
          const inStock = !$el.find('.sold-out, .out-of-stock, .품절').length &&
                         !$el.text().includes('품절');

          products.push({
            name,
            price,
            originalPrice,
            discountRate,
            productUrl,
            imageUrl,
            category: categoryName,
            inStock,
          });
        } catch (error) {
          // 개별 제품 파싱 오류는 무시
        }
      });

      break;
    }
  }

  if (!found) {
    console.log(`   ⚠️  No items found with any selector`);
  }

  return products;
}

/**
 * 상점 ID 가져오기/생성
 */
async function ensureStore() {
  const existing = await sql`
    SELECT id FROM stores WHERE name = ${STORE_NAME}
  `;

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await sql`
    INSERT INTO stores (name, website_url)
    VALUES (${STORE_NAME}, ${BASE_URL})
    RETURNING id
  `;

  return result.rows[0].id;
}

/**
 * 제품을 DB에 저장
 */
async function saveProduct(storeId, product) {
  try {
    const discountInfo = {
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      inStock: product.inStock,
    };

    await sql`
      INSERT INTO raw_products (
        store_id,
        original_name,
        original_price,
        original_url,
        original_image_url,
        original_category,
        discount_info,
        scraped_at
      )
      VALUES (
        ${storeId},
        ${product.name},
        ${product.price},
        ${product.productUrl || ''},
        ${product.imageUrl || null},
        ${product.category},
        ${JSON.stringify(discountInfo)},
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;

    return true;
  } catch (error) {
    console.error(`   ❌ Save failed for "${product.name}":`, error.message);
    return false;
  }
}

/**
 * 지연 함수
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 메인 크롤링 함수
 */
async function main() {
  console.log('🎸 뮤지션마켓 실제 크롤링 시작!\n');

  const storeId = await ensureStore();
  console.log(`✓ Store ID: ${storeId}\n`);

  let totalProducts = 0;
  let totalSaved = 0;

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name} (코드: ${category.code})`);

    for (let page = 1; page <= category.maxPages; page++) {
      console.log(`\n   📄 페이지 ${page}/${category.maxPages}`);

      const url = `${BASE_URL}/goods/goods_list.php?cateCd=${category.code}&page=${page}`;
      const html = await fetchPage(url);

      if (!html) {
        console.log(`   ⚠️  페이지 로드 실패, 다음으로 이동`);
        continue;
      }

      const products = parseProductList(html, category.name);
      totalProducts += products.length;

      console.log(`   ✓ ${products.length}개 제품 파싱 완료`);

      // DB에 저장
      for (const product of products) {
        const saved = await saveProduct(storeId, product);
        if (saved) {
          totalSaved++;
          const namePreview = product.name.substring(0, 50);
          const priceStr = product.price.toLocaleString();
          const discountStr = product.discountRate ? ` (-${product.discountRate}%)` : '';
          console.log(`   ✓ ${namePreview}... ${priceStr}원${discountStr}`);
        }
      }

      // 서버 부하 방지 딜레이
      await delay(2000);
    }
  }

  console.log('\n\n🎉 크롤링 완료!');
  console.log(`   총 ${totalProducts}개 제품 발견`);
  console.log(`   ${totalSaved}개 제품 DB에 저장`);

  // 통계 확인
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN (discount_info->>'discountRate')::int > 0 THEN 1 END) as on_sale
    FROM raw_products
    WHERE store_id = ${storeId}
  `;

  console.log(`\n📊 DB 통계:`);
  console.log(`   총 raw_products: ${stats.rows[0].total}개`);
  console.log(`   할인 제품: ${stats.rows[0].on_sale}개`);

  process.exit(0);
}

main().catch(error => {
  console.error('❌ 크롤링 오류:', error);
  process.exit(1);
});
