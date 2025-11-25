import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 모든 제품에 카테고리/브랜드별 고품질 이미지 추가
 * Unsplash의 악기 사진 컬렉션 활용
 */

// 카테고리별 대표 이미지
const CATEGORY_IMAGES = {
  '일렉기타': [
    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600',  // Stratocaster
    'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600',    // Les Paul
    'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600', // Electric guitar
    'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600', // PRS style
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',    // Modern electric
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=600', // Dark guitar
  ],
  '어쿠스틱기타': [
    'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=600',
  ],
  '베이스': [
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
    'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=600',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=600',
  ],
  '앰프': [
    'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=600',  // Marshall amp
    'https://images.unsplash.com/photo-1614963366796-8b6b6b3c0a4b?w=600',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
  ],
  '이펙터': [
    'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=600',  // Guitar pedals
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600',
    'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=600',
  ],
  '드럼': [
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',  // Drum kit
    'https://images.unsplash.com/photo-1543443374-a12e596e0c1e?w=600',
    'https://images.unsplash.com/photo-1519139270028-ab664cf42264?w=600',
  ],
  '부품': [
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',  // Guitar parts
    'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600',
  ],
  '줄': [
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',  // Guitar strings
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
  ],
  '케이블': [
    'https://images.unsplash.com/photo-1614963366796-8b6b6b3c0a4b?w=600',  // Cables
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
  ],
  '키보드': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600',  // Piano/keyboard
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600',
  ],
};

// 브랜드별 특정 이미지
const BRAND_IMAGES = {
  'Fender': 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600',
  'Squier': 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600',
  'Gibson': 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600',
  'Epiphone': 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600',
  'Ibanez': 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600',
  'PRS': 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600',
  'ESP': 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
  'LTD': 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
  'Marshall': 'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=600',
  'Vox': 'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=600',
  'Boss': 'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=600',
  'Roland': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
  'Yamaha': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600',
  'Pearl': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
  'Tama': 'https://images.unsplash.com/photo-1543443374-a12e596e0c1e?w=600',
};

function getRandomImage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🖼️  모든 제품에 이미지 추가 시작...\n');

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  // 이미지가 없는 제품 가져오기
  const result = await client.query(`
    SELECT p.id, p.name, p.brand, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.image_url IS NULL
    ORDER BY p.id
  `);

  const products = result.rows;
  console.log(`📦 이미지가 없는 제품: ${products.length}개\n`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    let imageUrl = null;

    // 1. 브랜드 기반 이미지
    if (product.brand && BRAND_IMAGES[product.brand]) {
      imageUrl = BRAND_IMAGES[product.brand];
    }

    // 2. 제품명에서 브랜드 찾기
    if (!imageUrl && product.name) {
      for (const [brandKey, brandImage] of Object.entries(BRAND_IMAGES)) {
        if (product.name.includes(brandKey)) {
          imageUrl = brandImage;
          break;
        }
      }
    }

    // 3. 카테고리 기반 이미지 (랜덤)
    if (!imageUrl && product.category_name) {
      const categoryImages = CATEGORY_IMAGES[product.category_name];
      if (categoryImages && categoryImages.length > 0) {
        imageUrl = getRandomImage(categoryImages);
      }
    }

    // 4. 최종 폴백: 일반 악기 이미지
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600';
    }

    // 이미지 URL 업데이트
    try {
      await client.query(
        'UPDATE products SET image_url = $1 WHERE id = $2',
        [imageUrl, product.id]
      );
      updated++;

      if (updated % 50 === 0) {
        console.log(`✓ ${updated}/${products.length} 처리됨...`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ 실패 (ID: ${product.id}):`, error.message);
    }
  }

  console.log(`\n\n✅ 이미지 추가 완료!`);
  console.log(`   성공: ${updated}개`);
  console.log(`   실패: ${failed}개`);

  // 최종 통계
  const finalStats = await client.query(`
    SELECT
      COUNT(*) as total,
      COUNT(image_url) as with_images,
      COUNT(*) - COUNT(image_url) as without_images
    FROM products
  `);

  const coverage = ((finalStats.rows[0].with_images / finalStats.rows[0].total) * 100).toFixed(1);

  console.log(`\n📊 최종 이미지 통계:`);
  console.log(`   총 제품: ${finalStats.rows[0].total}개`);
  console.log(`   이미지 있음: ${finalStats.rows[0].with_images}개`);
  console.log(`   이미지 커버리지: ${coverage}%`);

  // 카테고리별 통계
  const categoryStats = await client.query(`
    SELECT
      c.name as category,
      COUNT(p.id) as total,
      COUNT(p.image_url) as with_images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY total DESC
  `);

  console.log(`\n📂 카테고리별 이미지 현황:`);
  console.log('='.repeat(60));
  categoryStats.rows.forEach(row => {
    const cov = ((row.with_images / row.total) * 100).toFixed(1);
    console.log(`${row.category.padEnd(20)} | 제품: ${String(row.total).padStart(3)} | 이미지: ${String(row.with_images).padStart(3)} (${cov}%)`);
  });

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
