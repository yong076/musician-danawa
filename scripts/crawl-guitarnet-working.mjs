/**
 * 기타네트 실제 크롤링 (작동 버전)
 * Puppeteer로 JavaScript 렌더링된 제품들을 수집
 */

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://guitarnet.co.kr';

// 크롤링할 카테고리 (사용자가 요청한 URL 포함)
const CATEGORIES = [
  { name: '일렉기타', cate_no: 45, pages: 3 },  // 사용자 요청 URL
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
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // JavaScript 렌더링 기다림
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 제품 정보 추출
    const products = await page.evaluate((categoryName) => {
      const results = [];
      const items = document.querySelectorAll('li.item[id^="anchorBoxId_"]');

      items.forEach((item) => {
        try {
          // 제품명 - .title 클래스가 없는 span 선택
          const nameSpans = item.querySelectorAll('.proName a span');
          let name = '';
          nameSpans.forEach(span => {
            if (!span.classList.contains('title') && span.textContent.trim().length > 2) {
              name = span.textContent.trim();
            }
          });

          if (!name || name.length < 2) return;

          // 제품 URL
          const linkEl = item.querySelector('.proName a');
          const productUrl = linkEl ? linkEl.href : '';

          // 이미지 URL
          const imgEl = item.querySelector('.add_thumb img');
          let imageUrl = imgEl ? imgEl.src : '';

          // 플레이스홀더 이미지는 제외
          if (imageUrl && imageUrl.includes('img_product_medium.gif')) {
            imageUrl = '';
          }

          if (!imageUrl) return;  // 이미지 없으면 스킵

          // 원가 (소비자가)
          const originalPriceSpans = item.querySelectorAll('.spec li[rel="소비자가"] span');
          let originalPriceText = '';
          originalPriceSpans.forEach(span => {
            if (!span.classList.contains('title')) {
              originalPriceText = span.textContent.trim();
            }
          });

          // 판매가
          const priceSpans = item.querySelectorAll('.spec li[rel="판매가"] span, .spec li[rel="할인판매가"] span');
          let priceText = '';
          priceSpans.forEach(span => {
            if (!span.classList.contains('title') &&
                !span.classList.contains('wg_dRate') &&
                span.textContent.includes('원')) {
              priceText = span.textContent.trim();
            }
          });

          // 할인율
          const discountEl = item.querySelector('.spec .wg_dRate');
          const discountText = discountEl ? discountEl.textContent.trim() : '';
          const discountMatch = discountText.match(/(\d+)%/);
          const discountRate = discountMatch ? parseInt(discountMatch[1]) : 0;

          // 가격 파싱
          const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
          const originalPrice = parseInt(originalPriceText.replace(/[^0-9]/g, '')) || price;

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

    console.log(`   ✅ ${products.length}개 제품 파싱 완료`);
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
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const allProducts = [];

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name}`);

    for (let pageNum = 1; pageNum <= category.pages; pageNum++) {
      const products = await scrapeCategoryPage(page, category.name, category.cate_no, pageNum);
      allProducts.push(...products);

      // 서버 부하 방지 딜레이
      await new Promise(resolve => setTimeout(resolve, 3000));
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
      console.log(`   가격: ${p.price.toLocaleString()}원${p.discountRate > 0 ? ` (${p.discountRate}% 할인)` : ''}`);
      console.log(`   원가: ${p.originalPrice.toLocaleString()}원`);
      console.log(`   이미지: ${p.imageUrl.substring(0, 80)}...`);
      console.log(`   링크: ${p.productUrl.substring(0, 80)}...`);
    });

    console.log(`\n\n💡 다음 단계:`);
    console.log(`   node scripts/import-guitarnet-to-db.mjs ${filename}`);
  } else {
    console.log(`\n⚠️  제품을 찾지 못했습니다.`);
  }
}

main().catch(console.error);
