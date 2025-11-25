/**
 * 기타네트 크롤링 (Puppeteer) → JSON 파일 저장
 * JavaScript로 렌더링되는 제품들을 제대로 수집
 */

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://guitarnet.co.kr';

// 크롤링할 카테고리
const CATEGORIES = [
  { name: '일렉기타', cate_no: 45, pages: 2 },
  { name: '어쿠스틱기타', cate_no: 43, pages: 2 },
  { name: '베이스', cate_no: 46, pages: 2 },
  { name: '앰프', cate_no: 47, pages: 1 },
  { name: '이펙터', cate_no: 51, pages: 1 },
];

function parsePrice(text) {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned) : 0;
}

async function scrapeCategoryPage(page, categoryName, cateNo, pageNum) {
  const url = `${BASE_URL}/product/list.html?cate_no=${cateNo}&page=${pageNum}`;
  console.log(`\n   📄 ${categoryName} - 페이지 ${pageNum}`);
  console.log(`   🔗 ${url}`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 페이지가 로드될 때까지 조금 더 기다림
    await page.waitForTimeout(3000);

    // 페이지에서 제품 정보 추출
    const products = await page.evaluate((categoryName) => {
      const results = [];

      // 여러 가능한 셀렉터 시도
      const selectors = [
        '.prdList > ul > li',
        '.goods_list > ul > li',
        '#productListArea li',
        '.xans-product-list ul li',
        '.xans-product-normallist ul li',
        '.prdList li.item',
        '.product-list li',
        '.productList li',
      ];

      let items = [];
      for (const selector of selectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 3) {
          console.log(`Found ${items.length} items with selector: ${selector}`);
          break;
        }
      }

      items.forEach((item) => {
        try {
          // 제품명
          const nameEl = item.querySelector('.name a, .prdName a, strong a, .item_name a, .description strong, .description .name');
          const name = nameEl ? nameEl.textContent.trim() : '';

          if (!name || name.length < 2) return;

          // 제품 URL
          const linkEl = item.querySelector('a');
          const productUrl = linkEl ? linkEl.href : '';

          // 이미지 URL (여러 소스 시도)
          const imgEl = item.querySelector('img');
          let imageUrl = '';
          if (imgEl) {
            imageUrl = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || '';
          }

          // 가격 (현재가)
          const priceEl = item.querySelector('.price, .prdPrice, .sale_price, .selling-price, .retail');
          const priceText = priceEl ? priceEl.textContent.trim() : '';
          const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

          // 원가
          const originalPriceEl = item.querySelector('del, .consumer_price, .price_consumer, .strike, .cost-price');
          const originalPriceText = originalPriceEl ? originalPriceEl.textContent.trim() : '';
          const originalPrice = parseInt(originalPriceText.replace(/[^0-9]/g, '')) || price;

          // 할인율
          const discountEl = item.querySelector('.discount, .rate, .sale_rate, .discount-rate');
          const discountText = discountEl ? discountEl.textContent.trim() : '';
          const discountMatch = discountText.match(/(\d+)%/);
          const discountRate = discountMatch ? parseInt(discountMatch[1]) : 0;

          // 품절 여부
          const soldOut = item.textContent.includes('품절') ||
                         item.textContent.includes('SOLD OUT') ||
                         item.querySelector('.soldout, .out_of_stock') !== null;

          if (name && price > 0 && imageUrl) {
            results.push({
              name: name.substring(0, 200),
              price,
              originalPrice,
              discountRate,
              productUrl,
              imageUrl,
              category: categoryName,
              inStock: !soldOut,
              store: '기타네트',
              crawledAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Item parsing error:', err.message);
        }
      });

      return results;
    }, categoryName);

    if (products.length === 0) {
      console.log(`   ⚠️  제품을 찾을 수 없습니다`);

      // HTML 구조 확인을 위해 스크린샷 저장
      await page.screenshot({
        path: `debug-${categoryName}-page${pageNum}.png`,
        fullPage: false
      });
      console.log(`   📸 디버그 스크린샷 저장: debug-${categoryName}-page${pageNum}.png`);
    } else {
      console.log(`   ✅ ${products.length}개 제품 파싱 완료`);
    }

    return products;
  } catch (error) {
    console.error(`   ❌ 페이지 로드 실패: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🎸 기타네트 크롤링 시작 (Puppeteer)\n');
  console.log('✨ 실제 제품 이미지를 수집합니다!\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  const page = await browser.newPage();

  // User agent 설정
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // 뷰포트 설정
  await page.setViewport({ width: 1920, height: 1080 });

  // 콘솔 로그 캡처 (디버깅용)
  page.on('console', msg => {
    if (msg.text().includes('Found')) {
      console.log('   🔍', msg.text());
    }
  });

  const allProducts = [];

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name}`);

    for (let pageNum = 1; pageNum <= category.pages; pageNum++) {
      const products = await scrapeCategoryPage(page, category.name, category.cate_no, pageNum);
      allProducts.push(...products);

      // 서버 부하 방지
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  // JSON 파일로 저장
  const filename = `guitarnet-products-${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(allProducts, null, 2));

  console.log(`\n\n🎉 크롤링 완료!`);
  console.log(`   총 ${allProducts.length}개 제품 수집`);
  console.log(`   💾 저장: ${filename}`);

  // 샘플 출력
  if (allProducts.length > 0) {
    console.log(`\n📦 샘플 제품 (처음 5개):`);
    allProducts.slice(0, 5).forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.name}`);
      console.log(`   가격: ${p.price.toLocaleString()}원${p.discountRate > 0 ? ` (-${p.discountRate}%)` : ''}`);
      console.log(`   이미지: ${p.imageUrl.substring(0, 70)}...`);
      console.log(`   링크: ${p.productUrl.substring(0, 70)}...`);
    });

    console.log(`\n\n💡 다음 단계:`);
    console.log(`   이 JSON 파일을 데이터베이스에 import 하는 스크립트를 실행하세요`);
  } else {
    console.log(`\n⚠️  제품을 찾지 못했습니다. 디버그 스크린샷을 확인하세요.`);
  }
}

main().catch(console.error);
