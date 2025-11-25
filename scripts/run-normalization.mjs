/**
 * LLM 정규화 실행 스크립트
 * raw_products를 Claude API로 정규화하여 products 테이블에 저장
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function main() {
  try {
    console.log('🤖 Starting LLM Normalization...\n');

    // TypeScript 모듈을 동적으로 import
    // 실제 실행 시에는 tsx 사용 권장: npx tsx scripts/run-normalization.mjs
    const { ProductNormalizer } = await import('../src/lib/llm/normalizer.ts');

    const normalizer = new ProductNormalizer();

    // 최대 50개의 제품 처리
    const limit = parseInt(process.argv[2]) || 50;

    console.log(`📝 Processing up to ${limit} raw products...\n`);

    const result = await normalizer.processRawProducts(limit);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Normalization Summary:');
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Success rate: ${((result.processed / (result.processed + result.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    console.log('\n💡 Next steps:');
    console.log('   Run product matching: npm run crawl:match');

    process.exit(0);
  } catch (error) {
    console.error('❌ Normalization failed:', error);
    console.error('\n💡 Make sure to:');
    console.error('   1. Set ANTHROPIC_API_KEY in .env.local');
    console.error('   2. Run with: npx tsx scripts/run-normalization.mjs');
    process.exit(1);
  }
}

main();
