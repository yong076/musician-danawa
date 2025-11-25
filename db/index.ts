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

export interface ProductGroup {
  id: number;
  normalized_name: string;
  normalized_brand?: string;
  normalized_model?: string;
  category_id?: number;
  specs?: any;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithPrice extends Product {
  category_name?: string;
  min_price?: number;
  max_price?: number;
  price_count?: number;
}

export interface ProductGroupWithPrice {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  category_id?: number;
  category_name?: string;
  min_price?: number;
  max_price?: number;
  store_count?: number;
  image_url?: string;
}

export interface PriceWithDetails extends Price {
  product_name: string;
  product_brand?: string;
  image_url?: string;
  store_name: string;
  website_url?: string;
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

// 제품 그룹 검색 (추천 방식)
export async function searchProductGroups(
  query?: string,
  categoryId?: number,
  brand?: string,
  minPrice?: number,
  maxPrice?: number,
  limit: number = 50
): Promise<ProductGroupWithPrice[]> {
  const conditions = [];
  const params: any = {};

  if (categoryId) {
    conditions.push('pg.category_id = ' + categoryId);
  }

  if (brand) {
    conditions.push(`pg.normalized_brand ILIKE '%${brand}%'`);
  }

  if (query) {
    conditions.push(`(pg.normalized_name ILIKE '%${query}%' OR pg.normalized_brand ILIKE '%${query}%' OR pg.normalized_model ILIKE '%${query}%')`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const havingConditions = [];

  if (minPrice !== undefined) {
    havingConditions.push(`MIN(pr.price) >= ${minPrice}`);
  }

  if (maxPrice !== undefined) {
    havingConditions.push(`MAX(pr.price) <= ${maxPrice}`);
  }

  const havingClause = havingConditions.length > 0 ? 'HAVING ' + havingConditions.join(' AND ') : '';

  const queryText = `
    SELECT
      pg.id,
      pg.normalized_name as name,
      pg.normalized_brand as brand,
      pg.normalized_model as model,
      pg.category_id,
      c.name as category_name,
      MIN(pr.price) as min_price,
      MAX(pr.price) as max_price,
      COUNT(DISTINCT s.id) as store_count,
      MIN(p.image_url) as image_url
    FROM product_groups pg
    LEFT JOIN product_group_mappings pgm ON pg.id = pgm.group_id
    LEFT JOIN products p ON pgm.product_id = p.id
    LEFT JOIN prices pr ON p.id = pr.product_id AND pr.in_stock = true
    LEFT JOIN stores s ON pr.store_id = s.id
    LEFT JOIN categories c ON pg.category_id = c.id
    ${whereClause}
    GROUP BY pg.id, pg.normalized_name, pg.normalized_brand, pg.normalized_model, pg.category_id, c.name
    ${havingClause}
    ORDER BY min_price ASC NULLS LAST
    LIMIT ${limit}
  `;

  const result = await sql.query(queryText);
  return result.rows as ProductGroupWithPrice[];
}

// 단일 제품 그룹 조회
export async function getProductGroup(groupId: number): Promise<ProductGroupWithPrice | null> {
  const result = await sql`
    SELECT
      pg.id,
      pg.normalized_name as name,
      pg.normalized_brand as brand,
      pg.normalized_model as model,
      pg.category_id,
      pg.specs,
      c.name as category_name,
      MIN(pr.price) as min_price,
      MAX(pr.price) as max_price,
      COUNT(DISTINCT s.id) as store_count,
      MIN(p.image_url) as image_url
    FROM product_groups pg
    LEFT JOIN product_group_mappings pgm ON pg.id = pgm.group_id
    LEFT JOIN products p ON pgm.product_id = p.id
    LEFT JOIN prices pr ON p.id = pr.product_id AND pr.in_stock = true
    LEFT JOIN stores s ON pr.store_id = s.id
    LEFT JOIN categories c ON pg.category_id = c.id
    WHERE pg.id = ${groupId}
    GROUP BY pg.id, pg.normalized_name, pg.normalized_brand, pg.normalized_model, pg.category_id, pg.specs, c.name
  `;

  return result.rows[0] as ProductGroupWithPrice || null;
}

// 제품 그룹의 모든 가격 조회
export async function getProductGroupPrices(groupId: number): Promise<PriceWithDetails[]> {
  const result = await sql`
    SELECT
      pr.*,
      p.name as product_name,
      p.brand as product_brand,
      p.image_url,
      s.name as store_name,
      s.website_url
    FROM prices pr
    JOIN products p ON pr.product_id = p.id
    JOIN stores s ON pr.store_id = s.id
    JOIN product_group_mappings pgm ON p.id = pgm.product_id
    WHERE pgm.group_id = ${groupId} AND pr.in_stock = true
    ORDER BY pr.price ASC
  `;
  return result.rows as PriceWithDetails[];
}

// 제품 검색 (기존 방식 - 호환성을 위해 유지)
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
