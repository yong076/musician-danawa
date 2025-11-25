import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

// 브랜드별 이미지 매핑 (Unsplash에서 악기 관련 고품질 이미지)
const BRAND_IMAGES = {
  'Fender': 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
  '펜더': 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
  'Gibson': 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400',
  '깁슨': 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400',
  'Ibanez': 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400',
  '아이바네즈': 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400',
  'PRS': 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400',
  'ESP': 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=400',
  'Yamaha': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400',
  '야마하': 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400',
  'Cort': 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400',
  '콜트': 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400',
  'Epiphone': 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?w=400',
  '에피폰': 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?w=400',
  'Schecter': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400',
  'Jackson': 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=400',
  'Taylor': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
  'Martin': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
  'Roland': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
  '롤랜드': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
  'Boss': 'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=400',
  '보스': 'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=400',
  'Marshall': 'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=400',
  '마샬': 'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=400',
};

// 카테고리별 기본 이미지
const CATEGORY_IMAGES = {
  '일렉기타': 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
  '어쿠스틱기타': 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=400',
  '베이스': 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?w=400',
  '키보드': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
  '드럼': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
  '앰프': 'https://images.unsplash.com/photo-1558098329-a11dd5a8ed1f?w=400',
  '이펙터': 'https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=400',
  '기타용품': 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400',
};

async function addAllImages() {
  try {
    console.log('🖼️  모든 제품에 이미지 추가 시작...\n');

    // 이미지가 없는 모든 제품 가져오기
    const productsResult = await sql`
      SELECT p.id, p.name, p.brand, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.image_url IS NULL
      ORDER BY p.id
    `;

    const products = productsResult.rows;
    console.log(`📦 이미지가 없는 제품: ${products.length}개\n`);

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      let imageUrl = null;

      // 1. 브랜드 기반 이미지 매칭
      if (product.brand) {
        imageUrl = BRAND_IMAGES[product.brand];
      }

      // 2. 제품명에서 브랜드 키워드 찾기
      if (!imageUrl && product.name) {
        for (const [brandKey, brandImage] of Object.entries(BRAND_IMAGES)) {
          if (product.name.includes(brandKey)) {
            imageUrl = brandImage;
            break;
          }
        }
      }

      // 3. 카테고리 기반 기본 이미지
      if (!imageUrl && product.category_name) {
        imageUrl = CATEGORY_IMAGES[product.category_name];
      }

      // 4. 최종 폴백: 일반 악기 이미지
      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400';
      }

      // 이미지 URL 업데이트
      try {
        await sql`
          UPDATE products
          SET image_url = ${imageUrl}
          WHERE id = ${product.id}
        `;
        updated++;

        const namePreview = product.name.substring(0, 50);
        const brandInfo = product.brand ? `[${product.brand}]` : '[브랜드없음]';
        console.log(`✓ ${updated}/${products.length} ${brandInfo} ${namePreview}...`);
      } catch (error) {
        failed++;
        console.error(`❌ 실패 (ID: ${product.id}):`, error.message);
      }
    }

    // 최종 통계
    console.log('\n📊 이미지 추가 완료!');
    console.log(`   ✓ 성공: ${updated}개`);
    console.log(`   ❌ 실패: ${failed}개`);

    // 전체 이미지 통계 확인
    const finalStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(image_url) as with_images
      FROM products
    `;

    console.log('\n🖼️  최종 이미지 통계:');
    console.log(`   총 제품: ${finalStats.rows[0].total}개`);
    console.log(`   이미지 있음: ${finalStats.rows[0].with_images}개`);
    console.log(`   이미지 커버리지: ${((finalStats.rows[0].with_images / finalStats.rows[0].total) * 100).toFixed(1)}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

addAllImages();
