/**
 * 간단한 테스트: 기타네트 1페이지만 크롤링
 */

import puppeteer from 'puppeteer';

const url = 'https://guitarnet.co.kr/product/list.html?cate_no=45&page=1';

async function test() {
  console.log('🔍 테스트 시작:', url);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  console.log('⏳ 페이지 로딩 중...');

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // 조금 기다림
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('✓ 페이지 로드 완료');

  // HTML 저장 (디버깅용)
  const html = await page.content();
  const { writeFileSync } = await import('fs');
  writeFileSync('guitarnet-page.html', html);
  console.log('💾 HTML 저장: guitarnet-page.html');

  // 제품 개수 확인
  const products = await page.evaluate(() => {
    const items = document.querySelectorAll('li.item[id^="anchorBoxId_"]');
    console.log(`✓ Found ${items.length} product items`);

    const results = [];
    items.forEach((item, idx) => {
      if (idx < 5) {  // 처음 5개만
        // 제품명
        const nameEl = item.querySelector('.proName span:last-child');
        const name = nameEl?.textContent?.trim() || '';

        // 이미지
        const imgEl = item.querySelector('.add_thumb img');
        const imageUrl = imgEl?.src || '';

        // 링크
        const linkEl = item.querySelector('.proName a');
        const productUrl = linkEl?.href || '';

        // 가격
        const priceEl = item.querySelector('.spec li[rel="판매가"] span:not(.title):not(.wg_dRate)');
        const priceText = priceEl?.textContent?.trim() || '';

        // 원가
        const originalPriceEl = item.querySelector('.spec li[rel="소비자가"] span:not(.title)');
        const originalPriceText = originalPriceEl?.textContent?.trim() || '';

        // 할인율
        const discountEl = item.querySelector('.spec .wg_dRate');
        const discountText = discountEl?.textContent?.trim() || '';

        results.push({
          name,
          imageUrl,
          productUrl,
          price: priceText,
          originalPrice: originalPriceText,
          discount: discountText
        });
      }
    });

    return { count: items.length, samples: results };
  });

  console.log('\n📊 결과:');
  console.log(`   제품 개수: ${products.count}`);

  if (products.samples.length > 0) {
    console.log('\n📦 샘플 제품:');
    products.samples.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ${p.name || '(이름 없음)'}`);
      console.log(`   가격: ${p.price}`);
      console.log(`   원가: ${p.originalPrice}`);
      console.log(`   할인: ${p.discount}`);
      console.log(`   이미지: ${p.imageUrl.substring(0, 90)}`);
      console.log(`   링크: ${p.productUrl.substring(0, 90)}`);
    });
  }

  await browser.close();
}

test().catch(console.error);
