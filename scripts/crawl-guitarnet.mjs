import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import axios from 'axios';
import { load } from 'cheerio';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 기타네트 실제 크롤링 (제품 이미지 포함!)
 */

const BASE_URL = 'https://guitarnet.co.kr';
const STORE_NAME = '기타네트';

// 크롤링할 카테고리
const CATEGORIES = [
  { name: '일렉기타', code: '44', maxPages: 3 },
  { name: '어쿠스틱기타', code: '43', maxPages: 3 },
  { name: '베이스', code: '45', maxPages: 2 },
  { name: '앰프', code: '46', maxPages: 2 },
  { name: '이펙터', code: '47', maxPages: 2 },
];

async function fetchPage(url) {
  try {
    console.log(`   🌐 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`   ❌ Fetch failed:`, error.message);
    return null;
  }
}

function parsePrice(text) {
  const cleaned = text.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned) : null;
}

async function scrapeProductList(categoryName, categoryCode, page) {
  const url = `${BASE_URL}/product/list.html?cate_no=${categoryCode}&page=${page}`;
  const html = await fetchPage(url);

  if (!html) return [];

  const $ = load(html);
  const products = [];

  // 제품 리스트 찾기 (다양한 셀렉터 시도)
  const possibleSelectors = [
    '#contents ul li',
    '.prdList ul li',
    '.product_list li',
    '.xans-product-normalpackage li',
    '.item_goods_list li',
  ];

  let items = $();
  for (const selector of possibleSelectors) {
    items = $(selector);
    if (items.length > 5) { // 최소 5개 이상 있어야 제품 리스트로 판단
      console.log(`   ✓ ${items.length}개 제품 발견 (${selector})`);
      break;
    }
  }

  items.each((_, element) => {
    try {
      const $el = $(element);

      // 제품명
      let name = $el.find('.name a').text().trim() ||
                 $el.find('.prdName').text().trim() ||
                 $el.find('strong').text().trim();

      // 제품 URL
      let productUrl = $el.find('a').first().attr('href') || '';
      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = BASE_URL + productUrl;
      }

      // 이미지 URL (실제 제품 이미지!)
      let imageUrl = $el.find('img').first().attr('src') || '';
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = BASE_URL + imageUrl;
      }

      // 가격
      const priceText = $el.find('.price').text() ||
                       $el.find('.prdPrice').text() ||
                       $el.find('li:contains("원")').text();
      const price = parsePrice(priceText);

      // 원가 (할인 전)
      const originalPriceText = $el.find('del').text() ||
                               $el.find('.consumer_price').text();
      const originalPrice = parsePrice(originalPriceText);

      // 할인율
      const discountText = $el.find('.discount').text() ||
                          $el.find('.rate').text();
      const discountMatch = discountText.match(/(\d+)%/);
      const discountRate = discountMatch ? parseInt(discountMatch[1]) : null;

      if (name && price && imageUrl) {
        products.push({
          name: name.substring(0, 200),
          price,
          originalPrice: originalPrice || price,
          discountRate,
          productUrl,
          imageUrl,
          category: categoryName,
          inStock: !$el.text().includes('품절') && !$el.find('.soldout').length,
        });
      }
    } catch (error) {
      // 개별 제품 파싱 오류 무시
    }
  });

  return products;
}

async function getStoreId(client) {
  const existing = await client.query(
    'SELECT id FROM stores WHERE name = $1',
    [STORE_NAME]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await client.query(
    'INSERT INTO stores (name, website_url) VALUES ($1, $2) RETURNING id',
    [STORE_NAME, BASE_URL]
  );

  return result.rows[0].id;
}

async function saveProduct(client, storeId, product) {
  try {
    const discountInfo = {
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      inStock: product.inStock,
    };

    await client.query(
      `INSERT INTO raw_products (
        store_id, original_name, original_price, original_url,
        original_image_url, original_category, discount_info, scraped_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        storeId,
        product.name,
        product.price,
        product.productUrl,
        product.imageUrl,
        product.category,
        JSON.stringify(discountInfo),
      ]
    );

    return true;
  } catch (error) {
    console.error(`   ❌ 저장 실패:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎸 기타네트 실제 크롤링 시작!\n');
  console.log('✨ 실제 제품 이미지를 가져옵니다!\n');

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  const storeId = await getStoreId(client);
  console.log(`✓ Store ID: ${storeId}\n`);

  let totalProducts = 0;
  let totalSaved = 0;

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name} (코드: ${category.code})`);

    for (let page = 1; page <= category.maxPages; page++) {
      console.log(`\n   📄 페이지 ${page}/${category.maxPages}`);

      const products = await scrapeProductList(category.name, category.code, page);
      totalProducts += products.length;

      console.log(`   ✓ ${products.length}개 제품 파싱 완료`);

      for (const product of products) {
        const saved = await saveProduct(client, storeId, product);
        if (saved) {
          totalSaved++;
          const namePreview = product.name.substring(0, 50);
          const priceStr = product.price.toLocaleString();
          const discountStr = product.discountRate ? ` (-${product.discountRate}%)` : '';
          console.log(`   ✓ ${namePreview}... ${priceStr}원${discountStr}`);
        }
      }

      // 서버 부하 방지
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n\n🎉 크롤링 완료!');
  console.log(`   총 ${totalProducts}개 제품 발견`);
  console.log(`   ${totalSaved}개 제품 DB에 저장`);

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 크롤링 오류:', error);
  process.exit(1);
});
