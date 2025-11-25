import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env.local') });

async function checkDatabase() {
  console.log('🔍 데이터베이스 확인 중...\n');

  try {
    // 1. 상점 확인
    const stores = await sql`SELECT * FROM stores`;
    console.log('📦 Stores:', stores.rows.length);
    stores.rows.forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));

    // 2. 원본 제품 확인
    const rawProducts = await sql`SELECT COUNT(*) as count FROM raw_products`;
    console.log('\n📝 Raw Products:', rawProducts.rows[0].count);

    // 3. 정규화된 제품 확인
    const products = await sql`SELECT * FROM products LIMIT 10`;
    console.log('\n✅ Products:', products.rows.length);
    products.rows.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));

    // 4. 제품 그룹 확인
    const groups = await sql`SELECT * FROM product_groups`;
    console.log('\n🔗 Product Groups:', groups.rows.length);
    groups.rows.forEach(g => console.log(`   - ${g.normalized_name} (ID: ${g.id})`));

    // 5. 가격 확인
    const prices = await sql`SELECT COUNT(*) as count FROM prices`;
    console.log('\n💰 Prices:', prices.rows[0].count);

    // 6. 매핑 확인
    const mappings = await sql`SELECT COUNT(*) as count FROM product_group_mappings`;
    console.log('🔗 Mappings:', mappings.rows[0].count);

    // 7. 제품 페이지에서 사용하는 쿼리 실행
    console.log('\n🎯 제품 페이지 쿼리 실행...\n');
    const result = await sql`
      SELECT
        pg.id,
        pg.normalized_name as name,
        pg.normalized_brand as brand,
        pg.normalized_model as model,
        c.name as category_name,
        MIN(pr.price) as min_price,
        MAX(pr.price) as max_price,
        COUNT(DISTINCT s.id) as store_count,
        ARRAY_AGG(DISTINCT s.name) as stores
      FROM product_groups pg
      LEFT JOIN product_group_mappings pgm ON pg.id = pgm.group_id
      LEFT JOIN products p ON pgm.product_id = p.id
      LEFT JOIN prices pr ON p.id = pr.product_id
      LEFT JOIN stores s ON pr.store_id = s.id
      LEFT JOIN categories c ON pg.category_id = c.id
      WHERE pr.in_stock = true
      GROUP BY pg.id, pg.normalized_name, pg.normalized_brand, pg.normalized_model, c.name
      ORDER BY min_price DESC
      LIMIT 50
    `;

    console.log(`결과: ${result.rows.length}개 제품`);
    result.rows.forEach(p => {
      console.log(`\n✨ ${p.name}`);
      console.log(`   브랜드: ${p.brand}`);
      console.log(`   모델: ${p.model}`);
      console.log(`   카테고리: ${p.category_name}`);
      console.log(`   최저가: ₩${Number(p.min_price).toLocaleString()}`);
      console.log(`   상점: ${p.stores?.join(', ')}`);
    });

    if (result.rows.length === 0) {
      console.log('\n❌ 문제 발견: 쿼리 결과가 비어있습니다!');
      console.log('\n원인 분석:');

      // 가격이 없는 제품 확인
      const productsWithoutPrices = await sql`
        SELECT p.id, p.name
        FROM products p
        LEFT JOIN prices pr ON p.id = pr.product_id
        WHERE pr.id IS NULL
      `;
      console.log(`- 가격 정보가 없는 제품: ${productsWithoutPrices.rows.length}개`);

      // 그룹에 매핑되지 않은 제품 확인
      const productsWithoutGroups = await sql`
        SELECT p.id, p.name
        FROM products p
        LEFT JOIN product_group_mappings pgm ON p.id = pgm.product_id
        WHERE pgm.id IS NULL
      `;
      console.log(`- 그룹에 매핑되지 않은 제품: ${productsWithoutGroups.rows.length}개`);
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }

  process.exit(0);
}

checkDatabase();
