/**
 * 기타네트 간단 크롤러 (Node 18.0.0 호환)
 * undici/pg 모듈 없이 axios만 사용
 */

import axios from 'axios';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://guitarnet.co.kr';

async function crawlGuitarnet() {
  console.log('🎸 기타네트 크롤링 시작!\n');

  try {
    // 메인 페이지 가져오기
    console.log('📡 메인 페이지 접속 중...');
    const response = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    console.log(`✅ 응답 받음 (${response.status})`);
    console.log(`📊 HTML 길이: ${response.data.length} bytes\n`);

    // HTML을 파일로 저장해서 분석
    writeFileSync('guitarnet-page.html', response.data);
    console.log('💾 HTML을 guitarnet-page.html에 저장했습니다');
    console.log('   이 파일을 열어서 제품 리스트 구조를 확인해보세요\n');

    // 간단한 패턴 매칭으로 제품 찾기
    const html = response.data;

    // 제품 이미지 URL 찾기
    const imageMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif)/gi) || [];
    const productImages = imageMatches
      .filter(url => url.includes('ecimg.cafe24img.com'))
      .slice(0, 20);

    console.log('🖼️  발견된 제품 이미지 URL (샘플 20개):');
    productImages.forEach((url, idx) => {
      console.log(`   ${idx + 1}. ${url}`);
    });

    // 가격 패턴 찾기
    const priceMatches = html.match(/[\d,]+원/g) || [];
    const prices = priceMatches
      .map(p => parseInt(p.replace(/[^\d]/g, '')))
      .filter(p => p >= 10000 && p <= 10000000)
      .slice(0, 10);

    console.log('\n💰 발견된 가격 (샘플 10개):');
    prices.forEach((price, idx) => {
      console.log(`   ${idx + 1}. ${price.toLocaleString()}원`);
    });

    // 제품 링크 찾기
    const productLinkPattern = /\/product\/[^"'\s]+/g;
    const productLinks = [...new Set(html.match(productLinkPattern) || [])]
      .filter(link => link.includes('/product/'))
      .slice(0, 10);

    console.log('\n🔗 발견된 제품 링크 (샘플 10개):');
    productLinks.forEach((link, idx) => {
      console.log(`   ${idx + 1}. ${BASE_URL}${link}`);
    });

    console.log('\n\n💡 다음 단계:');
    console.log('   1. guitarnet-page.html 파일을 브라우저에서 열어보세요');
    console.log('   2. 개발자 도구(F12)로 제품 리스트의 HTML 구조를 확인하세요');
    console.log('   3. 올바른 CSS 셀렉터를 찾아서 크롤러를 개선하세요');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.response) {
      console.error(`   HTTP 상태: ${error.response.status}`);
      console.error(`   응답: ${error.response.data.substring(0, 200)}...`);
    }
  }
}

crawlGuitarnet();
