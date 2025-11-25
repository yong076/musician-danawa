-- 제품 이미지 테이블 (여러 개의 이미지 지원)
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_order INTEGER DEFAULT 0,  -- 이미지 순서 (0이 메인)
  alt_text VARCHAR(255),           -- 이미지 설명
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, image_order);

-- 기존 products 테이블의 image_url을 product_images로 마이그레이션
INSERT INTO product_images (product_id, image_url, image_order, alt_text)
SELECT
  id,
  image_url,
  0,
  name
FROM products
WHERE image_url IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE product_images IS '제품별 여러 이미지 지원 (메인, 상세, 각도별 등)';
COMMENT ON COLUMN product_images.image_order IS '0: 메인 이미지, 1+: 추가 이미지';
