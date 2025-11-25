-- 가격 테이블에 할인/세일 정보 추가
ALTER TABLE prices
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),  -- 원래 가격 (할인 전)
ADD COLUMN IF NOT EXISTS discount_rate INTEGER,          -- 할인율 (%)
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false, -- 세일 중 여부
ADD COLUMN IF NOT EXISTS sale_event_name VARCHAR(255),   -- 이벤트명 (예: "블랙프라이데이", "연말세일")
ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP,      -- 세일 시작일
ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP,        -- 세일 종료일
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0, -- 배송비
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;    -- 무료배송 여부

-- 추가 카테고리 삽입
INSERT INTO categories (name, description) VALUES
  ('이펙터', '기타/베이스 이펙터 페달'),
  ('오디오인터페이스', '레코딩 장비, 오디오 인터페이스'),
  ('마이크', '다이나믹/콘덴서 마이크'),
  ('스피커', '모니터 스피커, PA 시스템'),
  ('헤드폰', '스튜디오 헤드폰, 모니터링 헤드폰'),
  ('케이블', '악기 케이블, XLR 케이블'),
  ('스탠드', '기타/마이크/보면대 스탠드'),
  ('케이스/가방', '기타케이스, 가방'),
  ('부품', '기타 부품, 픽업, 브릿지 등'),
  ('줄', '기타줄, 베이스줄'),
  ('튜너', '크로마틱 튜너, 클립 튜너'),
  ('메트로놈', '전자/기계식 메트로놈'),
  ('악보', '교재, 악보'),
  ('건전지/전원', '9V 건전지, 어댑터')
ON CONFLICT (name) DO NOTHING;

-- 세일/할인 정보 인덱스
CREATE INDEX IF NOT EXISTS idx_prices_on_sale ON prices(is_on_sale, sale_end_date);
CREATE INDEX IF NOT EXISTS idx_prices_discount_rate ON prices(discount_rate DESC);
CREATE INDEX IF NOT EXISTS idx_prices_sale_event ON prices(sale_event_name);

-- raw_products 테이블에 할인 정보 추가
ALTER TABLE raw_products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_info JSONB;

COMMENT ON COLUMN prices.original_price IS '할인 전 원가';
COMMENT ON COLUMN prices.discount_rate IS '할인율 (0-100)';
COMMENT ON COLUMN prices.is_on_sale IS '현재 세일 진행 중 여부';
COMMENT ON COLUMN prices.sale_event_name IS '세일 이벤트명 (블랙프라이데이, 연말대란 등)';
