import { sql } from '@vercel/postgres';

export interface Store {
  id: number;
  name: string;
  website_url?: string;
  contact?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface Product {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  category_id?: number;
  description?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Price {
  id: number;
  product_id: number;
  store_id: number;
  price: number;
  currency: string;
  product_url?: string;
  in_stock: boolean;
  scraped_at: Date;
}

export interface ProductWithPrice extends Product {
  category_name?: string;
  min_price?: number;
  max_price?: number;
  price_count?: number;
}

export interface PriceWithDetails extends Price {
  product_name: string;
  product_brand?: string;
  store_name: string;
}

// 데이터베이스 초기화
export async function initDatabase() {
  try {
    const schema = await fetch('/db/schema.sql').then(res => res.text());
    await sql.query(schema);
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}

// 카테고리 목록 가져오기
export async function getCategories(): Promise<Category[]> {
  const result = await sql`
    SELECT * FROM categories ORDER BY name
  `;
  return result.rows as Category[];
}

// 상점 목록 가져오기
export async function getStores(): Promise<Store[]> {
  const result = await sql`
    SELECT * FROM stores ORDER BY name
  `;
  return result.rows as Store[];
}

// 제품 검색
export async function searchProducts(query: string, categoryId?: number): Promise<ProductWithPrice[]> {
  let result;

  if (categoryId) {
    result = await sql`
      SELECT
        p.*,
        c.name as category_name,
        MIN(pr.price) as min_price,
        MAX(pr.price) as max_price,
        COUNT(pr.id) as price_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN prices pr ON p.id = pr.product_id AND pr.in_stock = true
      WHERE p.category_id = ${categoryId}
        AND (p.name ILIKE ${`%${query}%`} OR p.brand ILIKE ${`%${query}%`} OR p.model ILIKE ${`%${query}%`})
      GROUP BY p.id, c.name
      ORDER BY p.name
      LIMIT 50
    `;
  } else {
    result = await sql`
      SELECT
        p.*,
        c.name as category_name,
        MIN(pr.price) as min_price,
        MAX(pr.price) as max_price,
        COUNT(pr.id) as price_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN prices pr ON p.id = pr.product_id AND pr.in_stock = true
      WHERE p.name ILIKE ${`%${query}%`} OR p.brand ILIKE ${`%${query}%`} OR p.model ILIKE ${`%${query}%`}
      GROUP BY p.id, c.name
      ORDER BY p.name
      LIMIT 50
    `;
  }

  return result.rows as ProductWithPrice[];
}

// 특정 제품의 가격 비교
export async function getProductPrices(productId: number): Promise<PriceWithDetails[]> {
  const result = await sql`
    SELECT
      pr.*,
      p.name as product_name,
      p.brand as product_brand,
      s.name as store_name
    FROM prices pr
    JOIN products p ON pr.product_id = p.id
    JOIN stores s ON pr.store_id = s.id
    WHERE pr.product_id = ${productId}
    ORDER BY pr.price ASC
  `;
  return result.rows as PriceWithDetails[];
}

// 제품 추가
export async function addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const result = await sql`
    INSERT INTO products (name, brand, model, category_id, description, image_url)
    VALUES (${product.name}, ${product.brand || null}, ${product.model || null},
            ${product.category_id || null}, ${product.description || null}, ${product.image_url || null})
    RETURNING *
  `;
  return result.rows[0] as Product;
}

// 가격 추가 또는 업데이트
export async function upsertPrice(price: Omit<Price, 'id' | 'scraped_at'>): Promise<Price> {
  const result = await sql`
    INSERT INTO prices (product_id, store_id, price, currency, product_url, in_stock)
    VALUES (${price.product_id}, ${price.store_id}, ${price.price},
            ${price.currency || 'KRW'}, ${price.product_url || null}, ${price.in_stock})
    ON CONFLICT (product_id, store_id)
    DO UPDATE SET
      price = EXCLUDED.price,
      product_url = EXCLUDED.product_url,
      in_stock = EXCLUDED.in_stock,
      scraped_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result.rows[0] as Price;
}

// 상점 추가
export async function addStore(store: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
  const result = await sql`
    INSERT INTO stores (name, website_url, contact, location)
    VALUES (${store.name}, ${store.website_url || null}, ${store.contact || null}, ${store.location || null})
    RETURNING *
  `;
  return result.rows[0] as Store;
}
