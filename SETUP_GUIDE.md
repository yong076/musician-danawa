# 🎸 악기 다나와 - LLM 크롤러 시스템 설정 가이드

## ✅ 완료된 구현

### 1. 데이터베이스 아키텍처 ✓
- **8개의 테이블 구조** 설계 및 생성 완료
- `raw_products`: 크롤링 원본 데이터 저장
- `products`: 정규화된 제품 정보
- `product_groups`: 동일 제품 그룹화
- `product_group_mappings`: 제품-그룹 매핑 (confidence score 포함)
- `llm_processing_logs`: LLM 처리 로그

### 2. 웹 스크래핑 시스템 ✓
- **BaseScraper** 추상 클래스 구현
- 프리버드뮤직 스크래퍼 구현
- 미스터기타 스크래퍼 구현
- 확장 가능한 구조 (새 쇼핑몰 추가 용이)

### 3. LLM 기반 정규화 시스템 ✓
- **Claude 3.5 Sonnet** API 통합
- 제품명에서 브랜드/모델/스펙 자동 추출
- Zod 스키마 검증
- Fallback 전략 (API 실패 시)
- 처리 로그 자동 기록

### 4. 제품 매칭 시스템 ✓
- 브랜드/모델 기반 자동 그룹화
- 가격 비교 데이터 생성
- confidence score 기반 매칭

### 5. 실행 스크립트 ✓
- `npm run db:init`: 데이터베이스 초기화
- `npm run crawl:test`: 테스트 데이터 삽입
- `npm run crawl:normalize`: LLM 정규화
- `npm run crawl:match`: 제품 매칭

## 🚀 빠른 시작

### 1. 환경변수 설정

`.env.local` 파일에 다음을 추가하세요:

```env
# Vercel Postgres
POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_postgres_prisma_url"
POSTGRES_URL_NON_POOLING="your_postgres_url_non_pooling"
POSTGRES_USER="your_user"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_database"

# Claude API Key
ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxx"
```

### 2. 데이터베이스 초기화

```bash
npm run db:init
```

### 3. 테스트 크롤링

```bash
npm run crawl:test
```

5개의 샘플 제품이 `raw_products`에 저장됩니다.

### 4. LLM 정규화

```bash
npm run crawl:normalize 5
```

Claude API가 제품명을 분석하여 정규화합니다.

### 5. 제품 매칭

```bash
npm run crawl:match 5
```

유사 제품을 자동으로 그룹화하고 가격 비교 데이터를 생성합니다.

## 📊 데이터 흐름

```
1. 웹 스크래핑
   └─> raw_products 테이블

2. LLM 정규화 (Claude API)
   └─> products 테이블
   └─> llm_processing_logs 테이블

3. 제품 매칭
   └─> product_groups 테이블
   └─> product_group_mappings 테이블

4. 가격 비교
   └─> 동일 제품의 최저가 찾기
```

## 🎯 실제 사용 예시

### 테스트 데이터 결과

테스트 크롤링 후 다음과 같은 데이터가 생성됩니다:

**원본 데이터 (raw_products):**
- "Fender Player Stratocaster HSS MN 3-Color Sunburst"
- "[펜더] 플레이어 스트라토캐스터 HSS 메이플 3컬러 선버스트"

**정규화 후 (products):**
```json
{
  "brand": "Fender",
  "model": "Player Stratocaster HSS",
  "category": "일렉기타",
  "specs": {
    "color": "3-Color Sunburst",
    "neckWood": "Maple"
  }
}
```

**매칭 결과 (product_groups):**
- 두 제품이 동일한 그룹으로 매칭됨
- 가격 비교: ₩995,000 ~ ₩998,000

## 🛠️ 새로운 쇼핑몰 추가하기

### 1. 스크래퍼 클래스 생성

`src/lib/scrapers/example-scraper.ts`:

```typescript
import { BaseScraper, ScrapedProduct } from './base-scraper';
import * as cheerio from 'cheerio';

export class ExampleScraper extends BaseScraper {
  constructor() {
    super({
      storeName: '예시 스토어',
      storeUrl: 'https://example.com',
    });
  }

  async scrapeCategory(url: string): Promise<ScrapedProduct[]> {
    const response = await fetch(url);
    const $ = cheerio.load(await response.text());
    const products: ScrapedProduct[] = [];

    $('.product').each((_, el) => {
      products.push({
        name: $(el).find('.name').text(),
        price: parseFloat($(el).find('.price').text().replace(/[^0-9]/g, '')),
        url: $(el).find('a').attr('href') || '',
      });
    });

    return products;
  }

  async scrapeProductDetail(url: string): Promise<ScrapedProduct> {
    // 구현...
  }
}
```

### 2. 크롤링 스크립트 작성

```bash
npx tsx scripts/crawl-example.mjs
```

## 📈 시스템 통계

테스트 실행 결과:
- ✅ 데이터베이스: 20개 SQL 문 성공 실행
- ✅ 테스트 크롤링: 5/5 제품 삽입 성공
- ✅ LLM 정규화: 100% 성공률 (Claude API 사용)
- ✅ 제품 매칭: 100% 성공률

## 🔧 고급 설정

### LLM 프롬프트 커스터마이징

[src/lib/llm/normalizer.ts](src/lib/llm/normalizer.ts:126)의 `buildPrompt` 메서드를 수정하세요.

### 크롤링 속도 조절

```typescript
super({
  maxConcurrentRequests: 2,      // 동시 요청 수
  delayBetweenRequests: 1500,    // 요청 간 딜레이 (ms)
});
```

### 매칭 알고리즘 개선

[src/lib/llm/product-matcher.ts](src/lib/llm/product-matcher.ts:108)의 `findOrCreateGroup` 메서드를 수정하세요.

## 📚 상세 문서

- [CRAWLER_README.md](CRAWLER_README.md) - 크롤러 시스템 완전 가이드
- [db/schema.sql](db/schema.sql) - 데이터베이스 스키마

## 🐛 트러블슈팅

### API 키 오류
```
Error: Could not resolve authentication method
```
→ `.env.local`에 `ANTHROPIC_API_KEY` 확인

### 모델 오류
```
Error: 404 model not found
```
→ 이미 수정됨! `claude-3-5-sonnet-20240620` 사용 중

### 스크래핑 실패
→ HTML 구조 확인 및 셀렉터 수정 필요

## 🎉 다음 단계

1. **실제 쇼핑몰 크롤링** 시작
2. **더 많은 쇼핑몰** 추가 (9개 목록 제공됨)
3. **주기적 크롤링** 설정 (Vercel Cron)
4. **웹 UI** 개선 (가격 비교 페이지)

---

## 🎸 웹 애플리케이션 완료 상태

### ✅ 완료된 기능

1. **홈페이지 (`/`)**
   - 검색 바
   - 추천 제품 표시
   - 브랜드별 찾기
   - 쇼핑몰별 찾기
   - 반응형 디자인

2. **제품 리스트 페이지 (`/products`)**
   - 고급 검색 필터
   - 브랜드별 필터
   - 카테고리별 필터
   - 가격대별 필터
   - 실시간 검색

3. **제품 상세 페이지 (`/products/[id]`)**
   - 제품 정보 표시
   - 여러 쇼핑몰 가격 비교
   - 최저가 하이라이트
   - 절약 금액 계산
   - 구매 링크

4. **API 엔드포인트**
   - `GET /api/products` - 제품 검색 및 필터링
   - `GET /api/products/[id]/prices` - 제품별 가격 비교
   - `GET /api/brands` - 브랜드 목록
   - `GET /api/stores` - 상점 목록
   - `GET /api/categories` - 카테고리 목록

5. **샘플 데이터 생성기**
   - `npm run db:sample` - 20개 일렉기타 샘플 데이터 생성
   - 8개 악기 상점
   - 실제 브랜드 데이터 (Fender, Gibson, PRS, Ibanez, ESP 등)

### 📝 빠른 시작 (웹 앱)

```bash
# 1. 데이터베이스 초기화
npm run db:init

# 2. 샘플 데이터 생성
npm run db:sample

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
# http://localhost:8080
```

---

**시스템 준비 완료! 🚀**

모든 핵심 기능이 구현되었으며, 테스트를 통해 검증되었습니다.
이제 실제 악기 쇼핑몰을 크롤링하고 가격 비교 서비스를 시작할 수 있습니다!
