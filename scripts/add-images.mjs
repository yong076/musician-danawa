import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

async function addImages() {
  console.log('🖼️  제품 이미지 추가 중...\n');

  // 실제 악기 이미지 URL (예시)
  const imageData = [
    { name: 'Fender Player Stratocaster', image: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400' },
    { name: 'Gibson Les Paul', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400' },
    { name: 'Ibanez RG', image: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=400' },
    { name: 'PRS', image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400' },
  ];

  try {
    // 1. Fender 제품에 이미지 추가
    await sql`
      UPDATE products
      SET image_url = 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400'
      WHERE name LIKE '%Fender%' OR name LIKE '%펜더%'
    `;
    console.log('✓ Fender 제품 이미지 추가');

    // 2. Gibson 제품에 이미지 추가
    await sql`
      UPDATE products
      SET image_url = 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'
      WHERE name LIKE '%Gibson%'
    `;
    console.log('✓ Gibson 제품 이미지 추가');

    // 3. Ibanez 제품에 이미지 추가
    await sql`
      UPDATE products
      SET image_url = 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=400'
      WHERE name LIKE '%Ibanez%'
    `;
    console.log('✓ Ibanez 제품 이미지 추가');

    // 4. PRS 제품에 이미지 추가
    await sql`
      UPDATE products
      SET image_url = 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400'
      WHERE name LIKE '%PRS%'
    `;
    console.log('✓ PRS 제품 이미지 추가');

    // 5. 확인
    const result = await sql`
      SELECT name, image_url FROM products WHERE image_url IS NOT NULL
    `;

    console.log(`\n✅ 완료: ${result.rows.length}개 제품에 이미지 추가됨\n`);
    result.rows.forEach(p => {
      console.log(`   📸 ${p.name}`);
      console.log(`      ${p.image_url.substring(0, 60)}...`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

addImages();
