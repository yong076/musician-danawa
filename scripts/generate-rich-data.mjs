import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 풍부한 테스트 데이터 생성
 * - 다양한 카테고리 (기타, 베이스, 드럼, 이펙터, 앰프, 부품, 액세서리)
 * - 할인/세일 정보
 * - 실제 제품명 패턴
 */

const STORES = [
  { name: '프리버드뮤직', url: 'https://freebird.co.kr' },
  { name: '뮤지션마켓', url: 'https://musicianmarket.co.kr' },
  { name: '미스터기타', url: 'https://mr-guitar.com' },
  { name: '영창뮤직', url: 'https://www.music114.co.kr' },
];

const SALE_EVENTS = [
  '블랙프라이데이',
  '연말대란',
  '새학기 특가',
  '브랜드데이',
  '재고정리',
  null,
  null,
  null, // 대부분은 일반 가격
];

// 브랜드별 제품 라인업
const PRODUCTS = {
  일렉기타: [
    { brands: ['Fender', 'Squier'], models: ['Stratocaster', 'Telecaster', 'Jazzmaster', 'Mustang'], colors: ['Sunburst', 'Black', 'White', 'Red', 'Blue'] },
    { brands: ['Gibson', 'Epiphone'], models: ['Les Paul', 'SG', 'ES-335', 'Flying V'], colors: ['Sunburst', 'Cherry', 'Ebony', 'Gold Top'] },
    { brands: ['Ibanez'], models: ['RG', 'S', 'GRG', 'Prestige'], colors: ['Black', 'White', 'Blue', 'Red'] },
    { brands: ['PRS', 'PRS SE'], models: ['Custom 24', 'McCarty', 'Silver Sky', 'Standard'], colors: ['Sunburst', 'Aqua', 'Black', 'Fire Red'] },
    { brands: ['ESP', 'LTD'], models: ['Eclipse', 'MH', 'KH', 'Viper'], colors: ['Black', 'See Thru Blue', 'Snow White'] },
  ],
  베이스: [
    { brands: ['Fender', 'Squier'], models: ['Precision Bass', 'Jazz Bass', 'Jaguar Bass'], colors: ['Sunburst', 'Black', 'White', 'Lake Placid Blue'] },
    { brands: ['Ibanez'], models: ['SR', 'BTB', 'GSR'], colors: ['Walnut Flat', 'Black', 'Weathered Black'] },
    { brands: ['Music Man', 'Sterling'], models: ['StingRay', 'Bongo'], colors: ['Natural', 'Stealth Black', 'Aqua Sparkle'] },
    { brands: ['Yamaha'], models: ['TRBX', 'BB'], colors: ['Black', 'Translucent Black', 'Old Violin Sunburst'] },
  ],
  앰프: [
    { brands: ['Fender'], models: ['Blues Junior', 'Hot Rod Deluxe', 'Princeton', 'Twin Reverb'], types: ['Combo', 'Head'] },
    { brands: ['Marshall'], models: ['JCM800', 'DSL', 'Origin', 'Code'], types: ['Combo', 'Head', 'Stack'] },
    { brands: ['Vox'], models: ['AC15', 'AC30', 'MV50'], types: ['Combo', 'Head'] },
    { brands: ['Boss', 'Roland'], models: ['Katana', 'Cube', 'JC-120'], types: ['Combo'] },
  ],
  이펙터: [
    { brands: ['Boss'], models: ['DS-1', 'BD-2', 'DD-8', 'OD-3', 'MT-2', 'CE-5', 'RV-6'] },
    { brands: ['Ibanez'], models: ['Tube Screamer TS9', 'TS808', 'TS Mini'] },
    { brands: ['MXR'], models: ['Phase 90', 'Carbon Copy', 'Dyna Comp', 'Distortion+'] },
    { brands: ['Electro-Harmonix'], models: ['Big Muff', 'POG2', 'Mel9', 'Holy Grail'] },
  ],
  드럼: [
    { brands: ['Pearl'], models: ['Export', 'Roadshow', 'Masters', 'Reference'], configs: ['5-Piece', '7-Piece'] },
    { brands: ['Yamaha'], models: ['Stage Custom', 'Tour Custom', 'Recording Custom'], configs: ['5-Piece', '7-Piece'] },
    { brands: ['Roland'], models: ['TD-17', 'TD-27', 'TD-50'], configs: ['KVX', 'KV', 'KVX2'] },
    { brands: ['Tama'], models: ['Superstar', 'Imperialstar', 'Starclassic'], configs: ['5-Piece'] },
  ],
  부품: [
    { brands: ['Seymour Duncan'], types: ['Humbucker', 'Single Coil', 'P-Bass', 'J-Bass'] },
    { brands: ['DiMarzio'], types: ['PAF', 'Super Distortion', 'Area', 'DP100'] },
    { brands: ['Gotoh'], types: ['Bridge', 'Tuner', 'Tremolo', 'Bass Bridge'] },
    { brands: ['Hipshot'], types: ['Bridge', 'Tuner', 'Xtender', 'Bass Tuner'] },
  ],
  줄: [
    { brands: ['Elixir'], gauges: ['009-042', '010-046', '011-049'], types: ['Nanoweb', 'Polyweb'] },
    { brands: ['D\'Addario'], gauges: ['009-042', '010-046', '011-050'], types: ['XL', 'NYXL', 'EXP'] },
    { brands: ['Ernie Ball'], gauges: ['009-042', '010-046', '011-048'], types: ['Regular Slinky', 'Super Slinky', 'Coated'] },
  ],
  케이블: [
    { brands: ['Mogami'], lengths: ['3m', '5m', '7m'], types: ['Instrument', 'XLR', 'Patch'] },
    { brands: ['Planet Waves'], lengths: ['3m', '5m', '6m'], types: ['Classic', 'American Stage'] },
  ],
};

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🎸 풍부한 테스트 데이터 생성 시작!\n');

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  // 상점 등록
  const storeIds = {};
  for (const store of STORES) {
    const existing = await client.query('SELECT id FROM stores WHERE name = $1', [store.name]);

    if (existing.rows.length > 0) {
      storeIds[store.name] = existing.rows[0].id;
      console.log(`✓ Store: ${store.name} (ID: ${existing.rows[0].id}) [기존]`);
    } else {
      const result = await client.query(
        'INSERT INTO stores (name, website_url) VALUES ($1, $2) RETURNING id',
        [store.name, store.url]
      );
      storeIds[store.name] = result.rows[0].id;
      console.log(`✓ Store: ${store.name} (ID: ${result.rows[0].id}) [신규]`);
    }
  }

  console.log('\n');

  let totalGenerated = 0;

  // 카테고리별 제품 생성
  for (const [category, productLines] of Object.entries(PRODUCTS)) {
    console.log(`\n📂 카테고리: ${category}`);

    let categoryCount = 0;

    for (const line of productLines) {
      for (const brand of line.brands) {
        const itemsToGenerate = randomInt(5, 15);

        for (let i = 0; i < itemsToGenerate; i++) {
          // 제품명 생성
          let productName;
          if (category === '일렉기타' || category === '베이스') {
            const model = randomChoice(line.models);
            const color = randomChoice(line.colors);
            productName = `${brand} ${model} ${color}`;
          } else if (category === '앰프') {
            const model = randomChoice(line.models);
            const type = randomChoice(line.types);
            productName = `${brand} ${model} ${type}`;
          } else if (category === '이펙터') {
            productName = `${brand} ${randomChoice(line.models)}`;
          } else if (category === '드럼') {
            const model = randomChoice(line.models);
            const config = randomChoice(line.configs);
            productName = `${brand} ${model} ${config}`;
          } else if (category === '부품') {
            const type = randomChoice(line.types);
            productName = `${brand} ${type} Pickup`;
          } else if (category === '줄') {
            const gauge = randomChoice(line.gauges);
            const type = randomChoice(line.types);
            productName = `${brand} ${type} ${gauge}`;
          } else if (category === '케이블') {
            const length = randomChoice(line.lengths);
            const type = randomChoice(line.types);
            productName = `${brand} ${type} Cable ${length}`;
          }

          // 가격 설정
          let basePrice;
          if (category === '일렉기타') basePrice = randomInt(300000, 2500000);
          else if (category === '베이스') basePrice = randomInt(350000, 2000000);
          else if (category === '앰프') basePrice = randomInt(200000, 1500000);
          else if (category === '이펙터') basePrice = randomInt(50000, 350000);
          else if (category === '드럼') basePrice = randomInt(500000, 3000000);
          else if (category === '부품') basePrice = randomInt(80000, 300000);
          else if (category === '줄') basePrice = randomInt(8000, 25000);
          else if (category === '케이블') basePrice = randomInt(15000, 80000);

          // 할인 정보 (30% 확률로 할인)
          const hasDiscount = Math.random() < 0.3;
          const discountRate = hasDiscount ? randomInt(10, 40) : 0;
          const salePrice = Math.round(basePrice * (100 - discountRate) / 100);
          const saleEvent = hasDiscount ? randomChoice(SALE_EVENTS) : null;

          // 재고 여부 (95% 재고 있음)
          const inStock = Math.random() < 0.95;

          // 무료배송 (50% 확률, 10만원 이상 제품)
          const freeShipping = basePrice >= 100000 && Math.random() < 0.5;

          // 랜덤 상점 선택
          const storeName = randomChoice(STORES).name;
          const storeId = storeIds[storeName];

          // DB에 저장
          const discountInfo = {
            originalPrice: hasDiscount ? basePrice : null,
            discountRate: discountRate || null,
            saleEventName: saleEvent,
            inStock,
            freeShipping,
          };

          await client.query(
            `INSERT INTO raw_products (
              store_id,
              original_name,
              original_price,
              original_category,
              discount_info,
              scraped_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [storeId, productName, salePrice, category, JSON.stringify(discountInfo)]
          );

          categoryCount++;
          totalGenerated++;

          const priceDisplay = hasDiscount
            ? `${salePrice.toLocaleString()}원 (${discountRate}% 할인, 원가: ${basePrice.toLocaleString()}원)`
            : `${salePrice.toLocaleString()}원`;

          if (categoryCount % 10 === 0) {
            console.log(`   ✓ ${categoryCount}개 생성됨...`);
          }
        }
      }
    }

    console.log(`   ✅ ${category}: ${categoryCount}개 제품 생성 완료`);
  }

  console.log(`\n\n🎉 총 ${totalGenerated}개 제품 생성 완료!`);

  // 통계
  const stats = await client.query(`
    SELECT
      original_category,
      COUNT(*) as total,
      COUNT(CASE WHEN (discount_info->>'discountRate')::int > 0 THEN 1 END) as on_sale,
      AVG(original_price)::int as avg_price
    FROM raw_products
    WHERE scraped_at > NOW() - INTERVAL '1 minute'
    GROUP BY original_category
    ORDER BY total DESC
  `);

  console.log('\n📊 카테고리별 통계:');
  console.log('='.repeat(80));
  stats.rows.forEach(row => {
    const salePercent = ((row.on_sale / row.total) * 100).toFixed(1);
    console.log(
      `${row.original_category.padEnd(15)} | ` +
      `제품: ${String(row.total).padStart(4)} | ` +
      `할인: ${String(row.on_sale).padStart(3)} (${salePercent}%) | ` +
      `평균가: ${row.avg_price.toLocaleString()}원`
    );
  });

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
