import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function initBrands() {
  try {
    console.log('🏷️  브랜드 및 스펙 테이블 초기화 시작...\n');

    const schemaPath = join(__dirname, '..', 'db', 'schema-brands.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 ${statements.length}개의 SQL 문을 실행합니다...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql.query(statement);
        successCount++;
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          skipCount++;
          const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`⚠️  [${i + 1}/${statements.length}] 이미 존재 (건너뜀): ${preview}...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] 오류:`, error.message);
        }
      }
    }

    console.log('\n🎉 브랜드 테이블 초기화 완료!');
    console.log(`   ✓ 성공: ${successCount}개`);
    console.log(`   ⚠️  건너뜀: ${skipCount}개`);

    // 브랜드 통계
    const brandCount = await sql`SELECT COUNT(*) as count FROM brands`;
    console.log(`\n📊 등록된 브랜드: ${brandCount.rows[0].count}개`);

    // 브랜드 목록 출력
    const brands = await sql`SELECT name, name_kr, country FROM brands ORDER BY name`;
    console.log('\n🏷️  등록된 브랜드 목록:');
    brands.rows.forEach(b => {
      console.log(`   - ${b.name} (${b.name_kr}) - ${b.country}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    process.exit(1);
  }
}

initBrands();
