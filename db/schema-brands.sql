-- 브랜드/메이커 테이블 추가
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  name_kr VARCHAR(200),
  logo_url VARCHAR(500),
  country VARCHAR(100),
  description TEXT,
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제품-브랜드 매핑 테이블
CREATE TABLE IF NOT EXISTS product_brands (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(product_id, brand_id)
);

-- 상세 스펙 테이블 (JSONB 대신 구조화된 테이블)
CREATE TABLE IF NOT EXISTS product_specs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  -- 공통 스펙
  condition VARCHAR(50), -- 새상품, 중고, 리퍼
  made_in VARCHAR(100), -- 제조국
  year INTEGER, -- 제조년도

  -- 기타/베이스 스펙
  body_type VARCHAR(100), -- Solid Body, Semi-Hollow, Hollow Body
  body_wood VARCHAR(200), -- Ash, Alder, Mahogany 등
  neck_wood VARCHAR(200),
  fingerboard_wood VARCHAR(200), -- Rosewood, Maple, Ebony 등
  frets INTEGER, -- 프렛 수
  scale_length VARCHAR(50), -- 25.5", 24.75" 등
  pickups VARCHAR(200), -- HSS, SSS, HH 등
  pickup_config VARCHAR(200), -- 픽업 상세 구성
  bridge_type VARCHAR(100), -- Fixed, Tremolo 등
  tuners VARCHAR(200), -- 튜너 종류
  strings INTEGER, -- 줄 수 (6현, 7현 등)
  color VARCHAR(100), -- 색상
  finish_type VARCHAR(100), -- Gloss, Satin, Matte

  -- 앰프/이펙터 스펙
  wattage INTEGER, -- 와트수
  channels INTEGER, -- 채널 수
  speaker_size VARCHAR(50), -- 10", 12" 등
  tube_type VARCHAR(200), -- 진공관 타입
  effects TEXT, -- 내장 이펙트

  -- 드럼 스펙
  drum_shell_material VARCHAR(200), -- 쉘 재질
  drum_sizes VARCHAR(200), -- 드럼 사이즈
  cymbals_included BOOLEAN,

  -- 기타 메타데이터
  weight_kg DECIMAL(5, 2), -- 무게
  dimensions VARCHAR(200), -- 크기
  included_accessories TEXT, -- 포함 악세서리
  warranty_months INTEGER, -- 보증 기간

  -- 추가 자유 형식 스펙
  additional_specs JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 제품 태그 테이블 (필터링용)
CREATE TABLE IF NOT EXISTS product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_value VARCHAR(200),
  tag_category VARCHAR(50), -- brand, type, style, feature 등
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_tags_product (product_id),
  INDEX idx_product_tags_name (tag_name),
  INDEX idx_product_tags_category (tag_category)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_product_brands_product ON product_brands(product_id);
CREATE INDEX IF NOT EXISTS idx_product_brands_brand ON product_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs(product_id);

-- 유명 기타 브랜드 초기 데이터
INSERT INTO brands (name, name_kr, country, description) VALUES
  ('Fender', '펜더', 'USA', '전설적인 일렉기타 제조사, Stratocaster와 Telecaster로 유명'),
  ('Gibson', '깁슨', 'USA', 'Les Paul, SG 등의 명기로 유명한 프리미엄 기타 브랜드'),
  ('Ibanez', '아이바네즈', 'Japan', '메탈과 록 연주자들에게 인기있는 일본 브랜드'),
  ('PRS', 'PRS', 'USA', 'Paul Reed Smith가 설립한 하이엔드 기타 브랜드'),
  ('ESP', 'ESP', 'Japan', '메탈 기타로 유명한 일본 브랜드'),
  ('Schecter', '셰터', 'USA', '메탈과 하드록 기타로 유명'),
  ('Jackson', '잭슨', 'USA', '메탈 기타의 대명사'),
  ('Gretsch', '그레치', 'USA', '할로우 바디와 세미할로우 기타로 유명'),
  ('Epiphone', '에피폰', 'USA', 'Gibson의 자매 브랜드'),
  ('Squier', '스콰이어', 'USA', 'Fender의 엔트리 라인'),

  -- 베이스 브랜드
  ('Music Man', '뮤직맨', 'USA', 'StingRay 베이스로 유명'),
  ('Warwick', '워윅', 'Germany', '프리미엄 베이스 제조사'),
  ('Yamaha', '야마하', 'Japan', '다양한 악기를 제조하는 종합 악기 브랜드'),
  ('Cort', '콜트', 'South Korea', '가성비 좋은 한국 브랜드'),

  -- 앰프 브랜드
  ('Marshall', '마샬', 'UK', '록 앰프의 전설'),
  ('Orange', '오렌지', 'UK', '독특한 사운드의 영국 앰프'),
  ('Mesa/Boogie', '메사부기', 'USA', '하이게인 앰프로 유명'),
  ('Vox', '복스', 'UK', '빈티지 톤의 영국 앰프'),
  ('Roland', '롤랜드', 'Japan', '디지털 앰프와 이펙터로 유명'),

  -- 이펙터 브랜드
  ('Boss', '보스', 'Japan', '가장 유명한 이펙터 브랜드'),
  ('Electro-Harmonix', '일렉트로 하모닉스', 'USA', '빈티지 이펙터의 명가'),
  ('TC Electronic', 'TC 일렉트로닉', 'Denmark', '고품질 디지털 이펙터'),
  ('Strymon', '스트라이몬', 'USA', '프리미엄 디지털 이펙터'),

  -- 드럼 브랜드
  ('Pearl', '펄', 'Japan', '전문 드럼 제조사'),
  ('Tama', '타마', 'Japan', '프로페셔널 드럼 브랜드'),
  ('DW', 'DW', 'USA', 'Drum Workshop, 커스텀 드럼으로 유명'),
  ('Zildjian', '질젠', 'USA', '400년 역사의 심벌 제조사')
ON CONFLICT (name) DO NOTHING;
