/**
 * 기타네트 크롤링 → JSON 파일 저장
 * DB 없이 먼저 제품 데이터 수집
 */

import axios from 'axios';
import { load } from 'cheerio';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://guitarnet.co.kr';

// 크롤링할 카테고리 (발견한 실제 cate_no)
const CATEGORIES = [
  { name: '일렉기타', cate_no: 45, pages: 2 },
  { name: '어쿠스틱기타', cate_no: 43, pages: 2 },
  { name: '베이스', cate_no: 46, pages: 2 },
  { name: '앰프', cate_no: 47, pages: 1 },
  { name: '이펙터', cate_no: 51, pages: 1 },
];

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Fetch failed: ${error.message}`);
    return null;
  }
}

function parsePrice(text) {
  const cleaned = text.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned) : 0;
}

async function scrapeCategoryPage(categoryName, cateNo, page) {
  const url = `${BASE_URL}/product/list.html?cate_no=${cateNo}&page=${page}`;
  console.log(`\n   📄 ${categoryName} - 페이지 ${page}`);
  console.log(`   🔗 ${url}`);

  const html = await fetchPage(url);
  if (!html) return [];

  const $ = load(html);
  const products = [];

  // Cafe24 쇼핑몰의 일반적인 제품 리스트 구조 탐색
  const possibleSelectors = [
    '.prdList > ul > li',
    '.goods_list > ul > li',
    '#productListArea li',
    '.xans-product-list ul li',
  ];

  let foundProducts = false;
  for (const selector of possibleSelectors) {
    const items = $(selector);

    if (items.length > 3) {
      console.log(`   ✓ ${items.length}개 아이템 발견 (${selector})`);
      foundProducts = true;

      items.each((idx, element) => {
        try {
          const $item = $(element);

          // 제품명
          const nameEl = $item.find('.name a, .prdName a, strong a, .item_name a');
          const name = nameEl.text().trim() || $item.find('img').attr('alt') || '';

          if (!name || name.length < 2) return;

          // 제품 URL
          let productUrl = nameEl.attr('href') || $item.find('a').first().attr('href') || '';
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = BASE_URL + productUrl;
          }

          // 이미지 URL (실제 제품 사진!)
          let imageUrl = $item.find('img').first().attr('src') || '';
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl && !imageUrl.startsWith('http') && imageUrl.startsWith('/')) {
            imageUrl = BASE_URL + imageUrl;
          }

          // 가격
          const priceText = $item.find('.price, .prdPrice, .sale_price').text();
          const price = parsePrice(priceText);

          // 원가
          const originalPriceText = $item.find('del, .consumer_price, .price_consumer').text();
          const originalPrice = parsePrice(originalPriceText) || price;

          // 할인율
          const discountText = $item.find('.discount, .rate, .sale_rate').text();
          const discountMatch = discountText.match(/(\d+)%/);
          const discountRate = discountMatch ? parseInt(discountMatch[1]) : 0;

          // 품절 여부
          const soldOut = $item.text().includes('품절') ||
                         $item.find('.soldout, .out_of_stock').length > 0;

          if (name && price > 0 && imageUrl) {
            products.push({
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
          // 개별 제품 파싱 오류 무시
        }
      });

      break;
    }
  }

  if (!foundProducts) {
    console.log(`   ⚠️  제품을 찾을 수 없습니다`);
  } else {
    console.log(`   ✅ ${products.length}개 제품 파싱 완료`);
  }

  return products;
}

async function main() {
  console.log('🎸 기타네트 크롤링 시작 (JSON 저장)\n');
  console.log('✨ 실제 제품 이미지를 수집합니다!\n');

  const allProducts = [];

  for (const category of CATEGORIES) {
    console.log(`\n📂 카테고리: ${category.name}`);

    for (let page = 1; page <= category.pages; page++) {
      const products = await scrapeCategoryPage(category.name, category.cate_no, page);
      allProducts.push(...products);

      // 서버 부하 방지
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // JSON 파일로 저장
  const filename = `guitarnet-products-${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(allProducts, null, 2));

  console.log(`\n\n🎉 크롤링 완료!`);
  console.log(`   총 ${allProducts.length}개 제품 수집`);
  console.log(`   💾 저장: ${filename}`);

  // 샘플 출력
  console.log(`\n📦 샘플 제품 (처음 5개):`);
  allProducts.slice(0, 5).forEach((p, idx) => {
    console.log(`\n${idx + 1}. ${p.name}`);
    console.log(`   가격: ${p.price.toLocaleString()}원${p.discountRate > 0 ? ` (-${p.discountRate}%)` : ''}`);
    console.log(`   이미지: ${p.imageUrl.substring(0, 60)}...`);
    console.log(`   링크: ${p.productUrl.substring(0, 60)}...`);
  });

  console.log(`\n\n💡 다음 단계:`);
  console.log(`   이 JSON 파일을 데이터베이스에 import 하는 스크립트를 실행하세요`);
}

main();
