import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
config({ path: join(__dirname, '..', '.env.local') });

async function initDatabase() {
  try {
    console.log('🗄️  데이터베이스 초기화 시작...\n');

    // schema.sql 파일 읽기
    const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // 주석 제거
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // SQL 문을 개별적으로 실행
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
        // 이미 존재하는 테이블/인덱스는 무시
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          skipCount++;
          const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`⚠️  [${i + 1}/${statements.length}] 이미 존재 (건너뜀): ${preview}...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] 오류:`, error.message);
          const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
          console.error(`   SQL: ${preview}...`);
        }
      }
    }

    console.log('\n🎉 데이터베이스 초기화 완료!');
    console.log(`   ✓ 성공: ${successCount}개`);
    console.log(`   ⚠️  건너뜀: ${skipCount}개`);
    console.log('\n📊 테이블 및 데이터:');
    console.log('  - stores (악기 상점)');
    console.log('  - categories (카테고리 + 10개 초기 데이터)');
    console.log('  - products (제품)');
    console.log('  - prices (가격 정보)');

    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    process.exit(1);
  }
}

initDatabase();
