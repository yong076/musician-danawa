-- 악기 상점 테이블
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500),
  contact VARCHAR(100),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 악기 카테고리 테이블
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 악기 제품 테이블
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  brand VARCHAR(200),
  model VARCHAR(200),
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 가격 정보 테이블
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',
  product_url VARCHAR(500),
  in_stock BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, store_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_prices_scraped_at ON prices(scraped_at);

-- 크롤링 원본 데이터 테이블 (정규화 전 데이터)
CREATE TABLE IF NOT EXISTS raw_products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  original_price DECIMAL(10, 2),
  original_url VARCHAR(500),
  original_image_url VARCHAR(500),
  original_category VARCHAR(255),
  original_specs JSONB,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT false,
  product_id INTEGER REFERENCES products(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제품 매칭 그룹 테이블 (동일 제품으로 판단되는 것들을 그룹화)
CREATE TABLE IF NOT EXISTS product_groups (
  id SERIAL PRIMARY KEY,
  normalized_name VARCHAR(500) NOT NULL,
  normalized_brand VARCHAR(200),
  normalized_model VARCHAR(200),
  category_id INTEGER REFERENCES categories(id),
  specs JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제품과 그룹의 매핑 테이블
CREATE TABLE IF NOT EXISTS product_group_mappings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES product_groups(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3, 2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, group_id)
);

-- LLM 처리 로그 테이블 (디버깅 및 학습용)
CREATE TABLE IF NOT EXISTS llm_processing_logs (
  id SERIAL PRIMARY KEY,
  raw_product_id INTEGER REFERENCES raw_products(id) ON DELETE CASCADE,
  input_text TEXT,
  llm_response JSONB,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_raw_products_store ON raw_products(store_id);
CREATE INDEX IF NOT EXISTS idx_raw_products_processed ON raw_products(processed);
CREATE INDEX IF NOT EXISTS idx_raw_products_scraped_at ON raw_products(scraped_at);
CREATE INDEX IF NOT EXISTS idx_product_groups_brand_model ON product_groups(normalized_brand, normalized_model);
CREATE INDEX IF NOT EXISTS idx_product_group_mappings_product ON product_group_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_group_mappings_group ON product_group_mappings(group_id);

-- 초기 카테고리 데이터
INSERT INTO categories (name, description) VALUES
  ('일렉기타', '일렉트릭 기타 (Fender, Gibson, Ibanez 등)'),
  ('어쿠스틱기타', '통기타, 클래식 기타'),
  ('베이스', '일렉트릭 베이스, 어쿠스틱 베이스'),
  ('키보드', '디지털 피아노, 신디사이저, MIDI 키보드'),
  ('드럼', '어쿠스틱 드럼, 전자드럼, 퍼커션'),
  ('관악기', '색소폰, 트럼펫, 플루트 등'),
  ('현악기', '바이올린, 첼로, 비올라 등'),
  ('앰프', '기타 앰프, 베이스 앰프'),
  ('이펙터', '기타 이펙터, 베이스 이펙터'),
  ('오디오인터페이스', '레코딩 장비, 오디오 인터페이스'),
  ('기타용품', '줄, 피크, 케이블, 스탠드 등')
ON CONFLICT (name) DO NOTHING;
