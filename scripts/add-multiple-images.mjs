import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 각 제품에 2-4개의 추가 이미지 생성
 * (메인 이미지는 이미 있으므로, 다른 각도/상세 이미지 추가)
 */

// 카테고리별 다양한 각도 이미지
const IMAGE_SETS = {
  '일렉기타': [
    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600',
    'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600',
    'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600',
    'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=600',
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=600',
    'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?w=600',
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600',
  ],
  '베이스': [
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=600',
    'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=600',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=600',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=600',
  ],
  '앰프': [
    'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=600',
    'https://images.unsplash.com/photo-1614963366796-8b6b6b3c0a4b?w=600',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
  ],
  '이펙터': [
    'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=600',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600',
    'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=600',
  ],
  '드럼': [
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600',
    'https://images.unsplash.com/photo-1543443374-a12e596e0c1e?w=600',
    'https://images.unsplash.com/photo-1519139270028-ab664cf42264?w=600',
  ],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  console.log('🖼️  제품별 추가 이미지 생성 시작...\n');

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  // 모든 제품 가져오기
  const products = await client.query(`
    SELECT p.id, p.name, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id
    LIMIT 1000
  `);

  console.log(`📦 처리할 제품: ${products.rows.length}개\n`);

  let added = 0;

  for (const product of products.rows) {
    // 이미 추가 이미지가 있는지 확인
    const existing = await client.query(
      'SELECT COUNT(*) FROM product_images WHERE product_id = $1 AND image_order > 0',
      [product.id]
    );

    if (parseInt(existing.rows[0].count) > 0) {
      continue; // 이미 추가 이미지가 있으면 스킵
    }

    // 카테고리별 이미지 세트 가져오기
    let imageSet = IMAGE_SETS[product.category_name] || IMAGE_SETS['일렉기타'];
    imageSet = shuffleArray(imageSet);

    // 2-4개의 추가 이미지 추가
    const numImages = randomInt(2, 4);

    for (let i = 0; i < numImages && i < imageSet.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, image_order, alt_text)
        VALUES ($1, $2, $3, $4)`,
        [product.id, imageSet[i], i + 1, `${product.name} - 이미지 ${i + 2}`]
      );
    }

    added++;

    if (added % 100 === 0) {
      console.log(`✓ ${added}/${products.rows.length} 제품 처리됨...`);
    }
  }

  console.log(`\n✅ ${added}개 제품에 추가 이미지 추가 완료!`);

  // 통계
  const stats = await client.query(`
    SELECT
      COUNT(DISTINCT product_id) as products_with_images,
      COUNT(*) as total_images,
      AVG(image_count) as avg_images_per_product
    FROM (
      SELECT product_id, COUNT(*) as image_count
      FROM product_images
      GROUP BY product_id
    ) sub
  `);

  console.log('\n📊 이미지 통계:');
  console.log(`   이미지가 있는 제품: ${stats.rows[0].products_with_images}개`);
  console.log(`   총 이미지 수: ${stats.rows[0].total_images}개`);
  console.log(`   제품당 평균: ${parseFloat(stats.rows[0].avg_images_per_product).toFixed(1)}개`);

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
