/**
 * 전체 크롤링 파이프라인
 *
 * 1단계: 웹 스크래핑 (raw_products에 저장)
 * 2단계: LLM 정규화 (products에 정규화된 데이터 저장)
 * 3단계: 제품 매칭 (product_groups 및 매핑 생성)
 * 4단계: 가격 비교 데이터 생성
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
config({ path: join(__dirname, '..', '.env.local') });

// 동적 import를 사용하여 TypeScript 모듈 로드
async function loadModules() {
  // TypeScript 파일을 직접 실행하기 위해서는 tsx나 ts-node가 필요합니다
  // 여기서는 간단한 예시를 보여드립니다

  console.log('📦 Loading modules...\n');

  // 실제 환경에서는 빌드된 JavaScript 파일을 import하거나
  // tsx를 사용하여 실행해야 합니다
  console.log('⚠️  Note: Run this with tsx or compile TypeScript first');
  console.log('   Example: npx tsx scripts/crawl-pipeline.mjs\n');
}

async function runPipeline() {
  try {
    console.log('🚀 Starting crawl pipeline...\n');
    console.log('=' .repeat(60));

    await loadModules();

    // 단계별 실행 안내
    console.log('\n📋 Pipeline Steps:\n');
    console.log('1️⃣  Step 1: Web Scraping');
    console.log('   - Scrape products from music stores');
    console.log('   - Save to raw_products table');
    console.log('   - Command: npm run crawl:scrape\n');

    console.log('2️⃣  Step 2: LLM Normalization');
    console.log('   - Use Claude API to normalize product names');
    console.log('   - Extract brand, model, specs');
    console.log('   - Save to products table');
    console.log('   - Command: npm run crawl:normalize\n');

    console.log('3️⃣  Step 3: Product Matching');
    console.log('   - Group similar products together');
    console.log('   - Create product_groups and mappings');
    console.log('   - Command: npm run crawl:match\n');

    console.log('4️⃣  Step 4: Price Comparison');
    console.log('   - Generate price comparison data');
    console.log('   - Find best deals across stores');
    console.log('   - Command: npm run crawl:compare\n');

    console.log('=' .repeat(60));
    console.log('\n💡 Quick Start:');
    console.log('   npm run db:init          # Initialize database');
    console.log('   npm run crawl:test       # Test scraping');
    console.log('   npm run crawl:full       # Run full pipeline\n');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

runPipeline();
