import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Sample electric guitar data
const stores = [
  { name: '기타랜드', website_url: 'https://guitarland.kr', location: '서울 강남구' },
  { name: '뮤지션마켓', website_url: 'https://musicianmarket.kr', location: '서울 마포구' },
  { name: '프리버드', website_url: 'https://freebird.kr', location: '서울 강남구' },
  { name: '스쿨뮤직', website_url: 'https://schoolmusic.kr', location: '서울 강북구' },
  { name: '경은어쿠스틱', website_url: 'https://kyungeun.kr', location: '서울 서초구' },
  { name: '악기타운', website_url: 'https://akgitown.kr', location: '부산 해운대구' },
  { name: '뮤직팜', website_url: 'https://musicfarm.kr', location: '경기 성남시' },
  { name: '사운드스테이션', website_url: 'https://soundstation.kr', location: '대구 중구' },
];

const guitarData = [
  // Fender
  {
    brand: 'Fender',
    model: 'Player Stratocaster',
    name: 'Fender Player Stratocaster',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/FF6347/FFFFFF?text=Fender+Strat',
    base_price: 850000,
    price_variance: 0.15,
  },
  {
    brand: 'Fender',
    model: 'American Professional II Stratocaster',
    name: 'Fender American Professional II Stratocaster',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/FF6347/FFFFFF?text=Fender+Am+Pro',
    base_price: 2500000,
    price_variance: 0.12,
  },
  {
    brand: 'Fender',
    model: 'Player Telecaster',
    name: 'Fender Player Telecaster',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/FF6347/FFFFFF?text=Fender+Tele',
    base_price: 820000,
    price_variance: 0.15,
  },
  {
    brand: 'Fender',
    model: 'Vintera 60s Stratocaster',
    name: 'Fender Vintera 60s Stratocaster',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/FF6347/FFFFFF?text=Fender+Vintera',
    base_price: 1400000,
    price_variance: 0.13,
  },

  // Gibson
  {
    brand: 'Gibson',
    model: 'Les Paul Standard',
    name: 'Gibson Les Paul Standard',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Gibson+LP',
    base_price: 3200000,
    price_variance: 0.10,
  },
  {
    brand: 'Gibson',
    model: 'SG Standard',
    name: 'Gibson SG Standard',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Gibson+SG',
    base_price: 2800000,
    price_variance: 0.12,
  },
  {
    brand: 'Gibson',
    model: 'Les Paul Studio',
    name: 'Gibson Les Paul Studio',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Gibson+Studio',
    base_price: 2100000,
    price_variance: 0.13,
  },
  {
    brand: 'Gibson',
    model: 'ES-335',
    name: 'Gibson ES-335',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Gibson+ES335',
    base_price: 4500000,
    price_variance: 0.08,
  },

  // PRS
  {
    brand: 'PRS',
    model: 'SE Custom 24',
    name: 'PRS SE Custom 24',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/9370DB/FFFFFF?text=PRS+SE',
    base_price: 1200000,
    price_variance: 0.14,
  },
  {
    brand: 'PRS',
    model: 'Custom 24',
    name: 'PRS Custom 24',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/9370DB/FFFFFF?text=PRS+Custom',
    base_price: 5500000,
    price_variance: 0.08,
  },
  {
    brand: 'PRS',
    model: 'SE Standard 24',
    name: 'PRS SE Standard 24',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/9370DB/FFFFFF?text=PRS+Standard',
    base_price: 950000,
    price_variance: 0.15,
  },

  // Ibanez
  {
    brand: 'Ibanez',
    model: 'RG550',
    name: 'Ibanez RG550',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Ibanez+RG',
    base_price: 1800000,
    price_variance: 0.13,
  },
  {
    brand: 'Ibanez',
    model: 'JEM Jr',
    name: 'Ibanez JEM Jr',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Ibanez+JEM',
    base_price: 950000,
    price_variance: 0.15,
  },
  {
    brand: 'Ibanez',
    model: 'AZ2402',
    name: 'Ibanez AZ2402',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Ibanez+AZ',
    base_price: 2400000,
    price_variance: 0.11,
  },

  // ESP
  {
    brand: 'ESP',
    model: 'LTD EC-1000',
    name: 'ESP LTD EC-1000',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/DC143C/FFFFFF?text=ESP+EC',
    base_price: 1600000,
    price_variance: 0.13,
  },
  {
    brand: 'ESP',
    model: 'E-II Horizon',
    name: 'ESP E-II Horizon',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/DC143C/FFFFFF?text=ESP+Horizon',
    base_price: 2800000,
    price_variance: 0.10,
  },

  // Gretsch
  {
    brand: 'Gretsch',
    model: 'G5420T Electromatic',
    name: 'Gretsch G5420T Electromatic',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/FF8C00/FFFFFF?text=Gretsch',
    base_price: 1300000,
    price_variance: 0.14,
  },

  // Epiphone
  {
    brand: 'Epiphone',
    model: 'Les Paul Standard',
    name: 'Epiphone Les Paul Standard',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Epiphone+LP',
    base_price: 650000,
    price_variance: 0.16,
  },
  {
    brand: 'Epiphone',
    model: 'SG Standard',
    name: 'Epiphone SG Standard',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Epiphone+SG',
    base_price: 580000,
    price_variance: 0.16,
  },

  // Yamaha
  {
    brand: 'Yamaha',
    model: 'Pacifica 112V',
    name: 'Yamaha Pacifica 112V',
    category: '일렉기타',
    image_url: 'https://via.placeholder.com/400x400/191970/FFFFFF?text=Yamaha+Pacifica',
    base_price: 450000,
    price_variance: 0.17,
  },
];

async function generateSampleData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Generating sample data for electric guitar price comparison...\n');

    // 1. Get category ID for electric guitar
    const categoryResult = await client.query(
      "SELECT id FROM categories WHERE name = '일렉기타' LIMIT 1"
    );

    if (categoryResult.rows.length === 0) {
      console.error('Category "일렉기타" not found. Please run database initialization first.');
      return;
    }

    const categoryId = categoryResult.rows[0].id;
    console.log(`✓ Found category "일렉기타" with ID: ${categoryId}`);

    // 2. Insert stores
    console.log('\nInserting stores...');
    const storeIds = [];

    for (const store of stores) {
      // Check if store exists
      const existingStore = await client.query(
        'SELECT id FROM stores WHERE name = $1',
        [store.name]
      );

      let storeId;
      if (existingStore.rows.length > 0) {
        storeId = existingStore.rows[0].id;
        console.log(`  ✓ ${store.name} (already exists)`);
      } else {
        const result = await client.query(
          `INSERT INTO stores (name, website_url, location)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [store.name, store.website_url, store.location]
        );
        storeId = result.rows[0].id;
        console.log(`  ✓ ${store.name}`);
      }
      storeIds.push(storeId);
    }

    // 3. Insert product groups and products
    console.log('\nInserting products and prices...');

    for (const guitar of guitarData) {
      // Create product group
      const groupResult = await client.query(
        `INSERT INTO product_groups (normalized_name, normalized_brand, normalized_model, category_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [guitar.name, guitar.brand, guitar.model, categoryId]
      );

      const groupId = groupResult.rows[0].id;

      // Create 3-5 product entries per group (different stores)
      const numProducts = 3 + Math.floor(Math.random() * 3); // 3-5 products
      const selectedStoreIds = storeIds
        .sort(() => 0.5 - Math.random())
        .slice(0, numProducts);

      for (const storeId of selectedStoreIds) {
        // Insert product
        const productResult = await client.query(
          `INSERT INTO products (name, brand, model, category_id, image_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [guitar.name, guitar.brand, guitar.model, categoryId, guitar.image_url]
        );

        const productId = productResult.rows[0].id;

        // Link product to group
        await client.query(
          `INSERT INTO product_group_mappings (product_id, group_id, confidence_score)
           VALUES ($1, $2, 1.0)`,
          [productId, groupId]
        );

        // Generate price with variance
        const variance = 1 + (Math.random() * 2 - 1) * guitar.price_variance;
        const price = Math.round(guitar.base_price * variance / 1000) * 1000; // Round to nearest 1000
        const inStock = Math.random() > 0.1; // 90% in stock

        // Insert price
        await client.query(
          `INSERT INTO prices (product_id, store_id, price, in_stock)
           VALUES ($1, $2, $3, $4)`,
          [productId, storeId, price, inStock]
        );
      }

      console.log(`  ✓ ${guitar.name} (${numProducts} stores)`);
    }

    await client.query('COMMIT');

    console.log('\n✓ Sample data generated successfully!');
    console.log(`\nSummary:`);
    console.log(`  - ${stores.length} stores`);
    console.log(`  - ${guitarData.length} product groups`);
    console.log(`  - Multiple products per group across different stores`);
    console.log('\nYou can now visit http://localhost:8080 to see the data!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating sample data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

generateSampleData();
