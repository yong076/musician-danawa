import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

/**
 * 대량의 제품 데이터 생성 (수천 개)
 * 다양한 브랜드, 모델, 가격대, 할인 정보 포함
 */

const STORES = [
  { name: '프리버드뮤직', url: 'https://freebird.co.kr' },
  { name: '뮤지션마켓', url: 'https://musicianmarket.co.kr' },
  { name: '미스터기타', url: 'https://mr-guitar.com' },
  { name: '영창뮤직', url: 'https://www.music114.co.kr' },
];

const SALE_EVENTS = [
  '블랙프라이데이', '사이버먼데이', '연말대란', '설 특가', '새학기 특가',
  '브랜드데이', '재고정리', '여름 페스티벌', '가을맞이', '크리스마스',
  null, null, null, null, null  // 대부분은 일반 가격
];

// 확장된 제품 라인업
const PRODUCTS = {
  일렉기타: [
    {
      brands: ['Fender', 'Squier'],
      series: ['Stratocaster', 'Telecaster', 'Jazzmaster', 'Mustang', 'Jaguar'],
      models: ['Standard', 'Deluxe', 'Player', 'Professional', 'American', 'Mexican'],
      colors: ['3-Color Sunburst', 'Black', 'Olympic White', 'Surf Green', 'Candy Apple Red', 'Lake Placid Blue'],
      basePrice: [400000, 2800000]
    },
    {
      brands: ['Gibson', 'Epiphone'],
      series: ['Les Paul', 'SG', 'ES-335', 'Flying V', 'Explorer', 'Firebird'],
      models: ['Standard', 'Custom', 'Studio', 'Classic', 'Traditional', 'Modern'],
      colors: ['Heritage Cherry Sunburst', 'Ebony', 'Gold Top', 'Alpine White', 'Wine Red'],
      basePrice: [350000, 4500000]
    },
    {
      brands: ['Ibanez'],
      series: ['RG', 'S', 'AZ', 'Prestige', 'GIO', 'Iron Label'],
      models: ['350', '450', '550', '650', '750', 'Premium'],
      colors: ['Black', 'White', 'Blue', 'Red', 'Galaxy Black', 'Transparent'],
      basePrice: [250000, 2500000]
    },
    {
      brands: ['PRS', 'PRS SE'],
      series: ['Custom 24', 'McCarty', 'Silver Sky', 'Standard', 'S2'],
      models: ['10 Top', 'Standard', 'Core', 'S2'],
      colors: ['Aqua', 'Fire Red', 'Vintage Sunburst', 'Black', 'Whale Blue'],
      basePrice: [800000, 5500000]
    },
    {
      brands: ['ESP', 'LTD'],
      series: ['Eclipse', 'MH', 'KH', 'Viper', 'Horizon', 'M'],
      models: ['Standard', 'Deluxe', '1000', '400', '200'],
      colors: ['Black', 'See Thru Blue', 'Snow White', 'Purple', 'Metallic Red'],
      basePrice: [350000, 3500000]
    }
  ],
  베이스: [
    {
      brands: ['Fender', 'Squier'],
      series: ['Precision Bass', 'Jazz Bass', 'Jaguar Bass', 'Mustang Bass'],
      models: ['Player', 'Professional', 'American', 'Vintage', 'Standard'],
      colors: ['3-Color Sunburst', 'Black', 'Olympic White', 'Lake Placid Blue'],
      basePrice: [400000, 3000000]
    },
    {
      brands: ['Ibanez'],
      series: ['SR', 'BTB', 'GSR', 'EHB', 'Prestige'],
      models: ['300', '500', '600', 'Premium', 'Standard'],
      colors: ['Walnut Flat', 'Black', 'Weathered Black', 'Cerulean Blue'],
      basePrice: [280000, 2000000]
    },
    {
      brands: ['Music Man', 'Sterling'],
      series: ['StingRay', 'Bongo', 'Sterling'],
      models: ['4-String', '5-String', 'Special', 'Classic'],
      colors: ['Natural', 'Stealth Black', 'Aqua Sparkle', 'Ghost Pepper'],
      basePrice: [900000, 3800000]
    }
  ],
  앰프: [
    {
      brands: ['Fender'],
      series: ['Blues Junior', 'Hot Rod Deluxe', 'Princeton', 'Twin Reverb', 'Bassbreaker'],
      models: ['III', 'IV', 'Tweed', 'Limited Edition'],
      types: ['Combo 15W', 'Combo 40W', 'Head 50W', 'Stack 100W'],
      basePrice: [350000, 1800000]
    },
    {
      brands: ['Marshall'],
      series: ['JCM800', 'DSL', 'Origin', 'Code', 'JVM'],
      models: ['20', '40', '100', 'Head', 'Combo'],
      types: ['Combo', 'Head', 'Stack', 'Cabinet'],
      basePrice: [400000, 2500000]
    },
    {
      brands: ['Boss', 'Roland'],
      series: ['Katana', 'Cube', 'JC-120', 'Micro Cube'],
      models: ['50', '100', 'Artist', 'MkII'],
      types: ['Combo'],
      basePrice: [200000, 800000]
    }
  ],
  이펙터: [
    {
      brands: ['Boss'],
      models: ['DS-1 Distortion', 'BD-2 Blues Driver', 'DD-8 Delay', 'OD-3 Overdrive',
               'MT-2 Metal Zone', 'CE-5 Chorus', 'RV-6 Reverb', 'SD-1 Super Overdrive'],
      basePrice: [50000, 200000]
    },
    {
      brands: ['Ibanez'],
      models: ['Tube Screamer TS9', 'TS808', 'TS Mini', 'Analog Delay'],
      basePrice: [80000, 250000]
    },
    {
      brands: ['MXR'],
      models: ['Phase 90', 'Carbon Copy', 'Dyna Comp', 'Distortion+', 'Blue Box'],
      basePrice: [90000, 280000]
    }
  ],
  드럼: [
    {
      brands: ['Pearl'],
      series: ['Export', 'Roadshow', 'Masters', 'Reference', 'Vision'],
      configs: ['5-Piece', '7-Piece', 'Add-on Pack'],
      colors: ['Jet Black', 'Smokey Chrome', 'Red Wine', 'Arctic White'],
      basePrice: [600000, 4000000]
    },
    {
      brands: ['Yamaha'],
      series: ['Stage Custom', 'Tour Custom', 'Recording Custom', 'Rydeen'],
      configs: ['5-Piece', '7-Piece'],
      colors: ['Pure White', 'Cranberry Red', 'Matte Black', 'Natural Wood'],
      basePrice: [550000, 3500000]
    },
    {
      brands: ['Roland', 'Alesis'],
      series: ['TD-17', 'TD-27', 'TD-50', 'Nitro', 'Command'],
      configs: ['KVX', 'KV', 'Mesh Kit'],
      colors: ['Black'],
      basePrice: [800000, 5000000]
    }
  ],
  부품: [
    {
      brands: ['Seymour Duncan'],
      types: ['Humbucker', 'Single Coil', 'P-Bass Pickup', 'J-Bass Pickup', 'Stacked Humbucker'],
      models: ['JB', 'SH-4', 'SSL-1', 'Hot Rails', 'Invader'],
      basePrice: [80000, 350000]
    },
    {
      brands: ['DiMarzio'],
      types: ['PAF', 'Super Distortion', 'Area', 'Tone Zone', 'Evolution'],
      models: ['DP100', 'DP151', 'DP155'],
      basePrice: [85000, 320000]
    }
  ],
  줄: [
    {
      brands: ['Elixir', "D'Addario", 'Ernie Ball'],
      gauges: ['009-042 Super Light', '010-046 Regular', '011-049 Medium', '012-053 Heavy'],
      types: ['Nanoweb', 'Polyweb', 'NYXL', 'EXP', 'Coated', 'Regular Slinky', 'Super Slinky'],
      basePrice: [8000, 28000]
    }
  ],
  케이블: [
    {
      brands: ['Mogami', 'Planet Waves', 'Monster'],
      lengths: ['3m', '5m', '7m', '10m'],
      types: ['Instrument Cable', 'Speaker Cable', 'XLR Cable', 'Patch Cable'],
      basePrice: [15000, 120000]
    }
  ],
  키보드: [
    {
      brands: ['Yamaha', 'Roland', 'Korg'],
      series: ['PSR', 'DGX', 'FP', 'RD', 'Minilogue', 'MicroKorg'],
      models: ['E373', 'EW310', '88-key', '61-key', '76-key'],
      basePrice: [200000, 2500000]
    }
  ]
};

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🎸 대량 제품 데이터 생성 시작!\n');

  const TARGET_COUNT = 2000;  // 목표: 2000개 제품

  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  // 현재 제품 수 확인
  const currentCount = await client.query('SELECT COUNT(*) FROM raw_products');
  const existing = parseInt(currentCount.rows[0].count);
  const toGenerate = Math.max(0, TARGET_COUNT - existing);

  console.log(`📊 현재 DB 상태:`);
  console.log(`   기존 제품: ${existing}개`);
  console.log(`   생성 목표: ${toGenerate}개`);
  console.log(`   최종 목표: ${TARGET_COUNT}개\n`);

  if (toGenerate === 0) {
    console.log('✅ 이미 목표 제품 수에 도달했습니다!');
    await client.end();
    process.exit(0);
  }

  // 상점 ID 가져오기
  const storeIds = {};
  for (const store of STORES) {
    const result = await client.query('SELECT id FROM stores WHERE name = $1', [store.name]);
    if (result.rows.length > 0) {
      storeIds[store.name] = result.rows[0].id;
    }
  }

  let generated = 0;
  const batchSize = 100;

  while (generated < toGenerate) {
    const batch = [];
    const batchCount = Math.min(batchSize, toGenerate - generated);

    for (let i = 0; i < batchCount; i++) {
      // 랜덤 카테고리 선택
      const categories = Object.keys(PRODUCTS);
      const category = randomChoice(categories);
      const productLines = PRODUCTS[category];
      const line = randomChoice(productLines);

      // 제품명 생성
      let productName;
      if (category === '일렉기타' || category === '베이스' || category === '앰프') {
        const brand = randomChoice(line.brands);
        const series = randomChoice(line.series);
        const model = line.models ? randomChoice(line.models) : '';
        const color = line.colors ? randomChoice(line.colors) : '';
        productName = `${brand} ${series} ${model} ${color}`.trim();
      } else if (category === '이펙터') {
        const brand = randomChoice(line.brands);
        const model = randomChoice(line.models);
        productName = `${brand} ${model}`;
      } else if (category === '드럼') {
        const brand = randomChoice(line.brands);
        const series = randomChoice(line.series);
        const config = randomChoice(line.configs);
        const color = line.colors ? randomChoice(line.colors) : '';
        productName = `${brand} ${series} ${config} ${color}`.trim();
      } else if (category === '부품') {
        const brand = randomChoice(line.brands);
        const type = randomChoice(line.types);
        const model = line.models ? randomChoice(line.models) : '';
        productName = `${brand} ${type} ${model}`.trim();
      } else if (category === '줄') {
        const brand = randomChoice(line.brands);
        const gauge = randomChoice(line.gauges);
        const type = randomChoice(line.types);
        productName = `${brand} ${type} ${gauge}`;
      } else if (category === '케이블') {
        const brand = randomChoice(line.brands);
        const length = randomChoice(line.lengths);
        const type = randomChoice(line.types);
        productName = `${brand} ${type} ${length}`;
      } else {
        const brand = randomChoice(line.brands);
        const series = randomChoice(line.series);
        const model = randomChoice(line.models);
        productName = `${brand} ${series} ${model}`;
      }

      // 가격 설정
      const [minPrice, maxPrice] = line.basePrice;
      const basePrice = randomInt(minPrice, maxPrice);

      // 할인 (35% 확률)
      const hasDiscount = Math.random() < 0.35;
      const discountRate = hasDiscount ? randomInt(10, 50) : 0;
      const salePrice = Math.round(basePrice * (100 - discountRate) / 100);
      const saleEvent = hasDiscount ? randomChoice(SALE_EVENTS) : null;

      // 재고/배송
      const inStock = Math.random() < 0.92;
      const freeShipping = basePrice >= 50000 && Math.random() < 0.6;

      // 상점 선택
      const storeName = randomChoice(STORES).name;
      const storeId = storeIds[storeName];

      batch.push({
        storeId,
        name: productName,
        price: salePrice,
        category,
        discountInfo: {
          originalPrice: hasDiscount ? basePrice : null,
          discountRate: discountRate || null,
          saleEventName: saleEvent,
          inStock,
          freeShipping,
        }
      });
    }

    // 배치 삽입
    for (const product of batch) {
      await client.query(
        `INSERT INTO raw_products (
          store_id, original_name, original_price, original_category,
          discount_info, scraped_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          product.storeId,
          product.name,
          product.price,
          product.category,
          JSON.stringify(product.discountInfo)
        ]
      );
    }

    generated += batch.length;
    console.log(`✓ ${generated}/${toGenerate} 생성됨... (${((generated/toGenerate)*100).toFixed(1)}%)`);
  }

  console.log(`\n🎉 ${generated}개 제품 생성 완료!`);

  // 최종 통계
  const finalCount = await client.query('SELECT COUNT(*) FROM raw_products');
  console.log(`\n📊 최종 DB 통계:`);
  console.log(`   총 raw_products: ${finalCount.rows[0].count}개`);

  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
