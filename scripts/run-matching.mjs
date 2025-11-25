/**
 * 제품 매칭 실행 스크립트
 * 정규화된 제품들을 그룹으로 매칭
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function main() {
  try {
    console.log('🔗 Starting Product Matching...\n');

    const { ProductMatcher } = await import('../src/lib/llm/product-matcher.ts');

    const matcher = new ProductMatcher();

    const limit = parseInt(process.argv[2]) || 50;

    console.log(`🔍 Matching up to ${limit} products...\n`);

    const result = await matcher.processUnmatchedProducts(limit);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Matching Summary:');
    console.log(`   Matched: ${result.matched}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Success rate: ${((result.matched / (result.matched + result.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    // 가격 비교 데이터 생성
    console.log('\n💰 Generating price comparisons...\n');

    const comparisons = await matcher.generatePriceComparisons();

    if (comparisons.length > 0) {
      console.log(`Found ${comparisons.length} product groups with multiple stores:\n`);

      comparisons.slice(0, 10).forEach((comp, index) => {
        const savings = comp.highestPrice - comp.lowestPrice;
        const savingsPercent = ((savings / comp.highestPrice) * 100).toFixed(1);

        console.log(`${index + 1}. ${comp.groupName}`);
        console.log(`   Stores: ${comp.stores.join(', ')}`);
        console.log(`   Price range: ₩${comp.lowestPrice.toLocaleString()} - ₩${comp.highestPrice.toLocaleString()}`);
        console.log(`   💸 Max savings: ₩${savings.toLocaleString()} (${savingsPercent}%)\n`);
      });
    } else {
      console.log('No product groups with multiple stores found yet.');
      console.log('Add more stores and products to see price comparisons.\n');
    }

    console.log('💡 Next steps:');
    console.log('   1. View comparisons in your app');
    console.log('   2. Add more stores for better price coverage');

    process.exit(0);
  } catch (error) {
    console.error('❌ Matching failed:', error);
    console.error('\n💡 Make sure to:');
    console.error('   1. Run normalization first: npm run crawl:normalize');
    console.error('   2. Run with: npx tsx scripts/run-matching.mjs');
    process.exit(1);
  }
}

main();
