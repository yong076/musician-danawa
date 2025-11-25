# 🎸 악기 다나와 - 크롤러 시스템

LLM 기반 악기 가격 비교 플랫폼의 크롤링 및 데이터 처리 시스템입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [설치 및 설정](#설치-및-설정)
4. [사용 방법](#사용-방법)
5. [데이터베이스 구조](#데이터베이스-구조)
6. [새로운 쇼핑몰 추가하기](#새로운-쇼핑몰-추가하기)

---

## 시스템 개요

이 시스템은 여러 악기 쇼핑몰에서 제품 정보를 수집하고, Claude AI를 활용하여 자동으로 정규화 및 매칭하여 가격 비교 서비스를 제공합니다.

### 주요 기능

- 🕷️ **웹 스크래핑**: 여러 악기 쇼핑몰에서 제품 정보 자동 수집
- 🤖 **LLM 정규화**: Claude API를 사용한 제품명 자동 정규화
- 🔗 **제품 매칭**: 유사한 제품을 자동으로 그룹화
- 💰 **가격 비교**: 동일 제품의 최저가 찾기

### 지원 쇼핑몰

- 프리버드뮤직 (freebud.co.kr)
- 미스터기타 (mrguitar.co.kr)
- *더 많은 쇼핑몰 추가 가능*

---

## 아키텍처

### 데이터 처리 파이프라인

```
┌─────────────────┐
│  웹 스크래핑    │  1단계: 쇼핑몰에서 원본 데이터 수집
│  (Cheerio)      │  → raw_products 테이블에 저장
└────────┬────────┘
         ↓
┌─────────────────┐
│  LLM 정규화     │  2단계: Claude API로 제품명 정규화
│  (Claude API)   │  → products 테이블에 저장
└────────┬────────┘
         ↓
┌─────────────────┐
│  제품 매칭      │  3단계: 유사 제품 자동 그룹화
│  (Matching)     │  → product_groups, mappings 생성
└────────┬────────┘
         ↓
┌─────────────────┐
│  가격 비교      │  4단계: 최저가 찾기 및 비교
│  (Comparison)   │  → 가격 비교 데이터 제공
└─────────────────┘
```

### 데이터베이스 구조

```
raw_products          원본 크롤링 데이터
     ↓
products              정규화된 제품 정보
     ↓
product_groups        제품 그룹
     ↓
product_group_mappings 제품-그룹 매핑
     ↓
prices                가격 정보
```

---

## 설치 및 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```bash
# Vercel Postgres
POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_postgres_prisma_url"
POSTGRES_URL_NON_POOLING="your_postgres_url_non_pooling"
POSTGRES_USER="your_user"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_database"

# Claude API Key
ANTHROPIC_API_KEY="your_claude_api_key"
```

### 2. 데이터베이스 초기화

```bash
npm run db:init
```

이 명령은 다음 테이블을 생성합니다:
- `stores` - 악기 상점 정보
- `categories` - 악기 카테고리
- `products` - 정규화된 제품 정보
- `prices` - 가격 정보
- `raw_products` - 원본 크롤링 데이터
- `product_groups` - 제품 그룹
- `product_group_mappings` - 제품-그룹 매핑
- `llm_processing_logs` - LLM 처리 로그

---

## 사용 방법

### 기본 워크플로우

#### 1️⃣ 테스트 크롤링

먼저 테스트 데이터로 시스템을 확인하세요:

```bash
npm run crawl:test
```

이 명령은:
- 프리버드뮤직 스토어를 생성
- 5개의 샘플 제품을 `raw_products`에 삽입
- 통계 정보 출력

#### 2️⃣ LLM 정규화 실행

원본 데이터를 Claude API로 정규화합니다:

```bash
npm run crawl:normalize
```

옵션: 처리할 제품 수 지정
```bash
npm run crawl:normalize 10
```

이 명령은:
- `raw_products`에서 미처리 제품 가져오기
- Claude API로 브랜드, 모델, 스펙 추출
- `products` 테이블에 정규화된 데이터 저장
- `llm_processing_logs`에 처리 로그 기록

**예시 출력:**
```
🤖 Starting LLM Normalization...

📝 Processing up to 50 raw products...

   ✓ [1/5] Fender Player Stratocaster HSS
   ✓ [2/5] Gibson Les Paul Standard 50s
   ✓ [3/5] Ibanez RG550 Genesis Collection
   ...

✅ Normalization Summary:
   Processed: 5
   Failed: 0
   Success rate: 100.0%
```

#### 3️⃣ 제품 매칭

정규화된 제품들을 그룹으로 매칭합니다:

```bash
npm run crawl:match
```

옵션: 매칭할 제품 수 지정
```bash
npm run crawl:match 20
```

이 명령은:
- 미매칭 제품 찾기
- 브랜드/모델 기반으로 그룹 찾기 또는 생성
- `product_group_mappings` 생성
- 가격 비교 데이터 생성 및 출력

**예시 출력:**
```
🔗 Starting Product Matching...

   ✓ [1/5] Matched: Fender Player Stratocaster → Group 1
   ✓ [2/5] Matched: Gibson Les Paul Standard → Group 2
   ...

💰 Generating price comparisons...

1. Fender Player Stratocaster HSS
   Stores: 프리버드뮤직, 미스터기타
   Price range: ₩995,000 - ₩998,000
   💸 Max savings: ₩3,000 (0.3%)
```

#### 4️⃣ 전체 파이프라인 안내

```bash
npm run crawl:pipeline
```

전체 파이프라인 단계와 명령어를 확인할 수 있습니다.

---

## 데이터베이스 구조

### 주요 테이블

#### `raw_products` - 원본 크롤링 데이터
```sql
id                 SERIAL PRIMARY KEY
store_id           INTEGER (stores.id 참조)
original_name      TEXT (원본 제품명)
original_price     DECIMAL(10, 2)
original_url       VARCHAR(500)
original_category  VARCHAR(255)
original_specs     JSONB (원본 스펙)
processed          BOOLEAN (처리 여부)
product_id         INTEGER (정규화 후 products.id 참조)
```

#### `products` - 정규화된 제품
```sql
id           SERIAL PRIMARY KEY
name         VARCHAR(500) (정규화된 제품명)
brand        VARCHAR(200) (브랜드명)
model        VARCHAR(200) (모델명)
category_id  INTEGER (categories.id 참조)
description  TEXT (스펙 정보 JSON)
```

#### `product_groups` - 제품 그룹
```sql
id                SERIAL PRIMARY KEY
normalized_name   VARCHAR(500)
normalized_brand  VARCHAR(200)
normalized_model  VARCHAR(200)
category_id       INTEGER
specs             JSONB
```

#### `product_group_mappings` - 제품-그룹 매핑
```sql
id                SERIAL PRIMARY KEY
product_id        INTEGER (products.id 참조)
group_id          INTEGER (product_groups.id 참조)
confidence_score  DECIMAL(3, 2) (매칭 신뢰도 0-1)
```

---

## 새로운 쇼핑몰 추가하기

### 1. 스크래퍼 클래스 생성

`src/lib/scrapers/` 디렉토리에 새 파일을 만듭니다:

```typescript
// src/lib/scrapers/example-store-scraper.ts
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './base-scraper';

export class ExampleStoreScraper extends BaseScraper {
  constructor() {
    super({
      storeName: '예시 스토어',
      storeUrl: 'https://example-store.com',
      maxConcurrentRequests: 2,
      delayBetweenRequests: 1500,
    });
  }

  async scrapeCategory(categoryUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    const response = await fetch(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // 실제 HTML 구조에 맞게 셀렉터 수정
    $('.product-item').each((_, element) => {
      const $el = $(element);

      const name = $el.find('.product-name').text().trim();
      const priceText = $el.find('.price').text().trim();
      const price = this.extractPrice(priceText);
      const url = this.normalizeUrl($el.find('a').attr('href') || '');
      const imageUrl = this.normalizeUrl($el.find('img').attr('src') || '');

      if (name && price > 0 && url) {
        products.push({ name, price, url, imageUrl });
      }
    });

    return products;
  }

  async scrapeProductDetail(productUrl: string): Promise<ScrapedProduct> {
    // 상세 페이지 스크래핑 로직 구현
    // ...
  }

  private extractPrice(text: string): number {
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${this.config.storeUrl}${url}`;
    return `${this.config.storeUrl}/${url}`;
  }
}
```

### 2. 크롤링 스크립트 작성

```javascript
// scripts/crawl-example-store.mjs
import { config } from 'dotenv';
import { ExampleStoreScraper } from '../src/lib/scrapers/example-store-scraper.ts';

config({ path: '.env.local' });

async function main() {
  const scraper = new ExampleStoreScraper();

  const categoryUrls = [
    'https://example-store.com/guitars',
    'https://example-store.com/bass',
  ];

  await scraper.run(categoryUrls);
}

main();
```

### 3. HTML 구조 분석 팁

각 쇼핑몰의 HTML 구조를 확인하려면:

```bash
# 페이지 HTML 다운로드
curl -A "Mozilla/5.0" "https://example-store.com/guitars" > test.html

# 브라우저 개발자 도구로 확인
# 1. 페이지 접속
# 2. F12 (개발자 도구)
# 3. Elements 탭에서 제품 구조 확인
# 4. 클래스명과 구조를 메모
```

---

## 고급 기능

### LLM 정규화 커스터마이징

`src/lib/llm/normalizer.ts`에서 프롬프트를 수정하여 정규화 규칙을 변경할 수 있습니다:

```typescript
private buildPrompt(productName: string): string {
  return `당신은 악기 제품 정보를 정규화하는 전문가입니다.

규칙:
1. 브랜드명은 영문 원어 표기 우선 (펜더 → Fender)
2. 모델명의 띄어쓰기 통일
3. 색상/연도는 specs로 분리
...
`;
}
```

### 제품 매칭 알고리즘 개선

`src/lib/llm/product-matcher.ts`에서 매칭 로직을 개선할 수 있습니다:

```typescript
async findOrCreateGroup(product: Product): Promise<number> {
  // Claude API를 사용한 더 정밀한 매칭
  const existingGroups = await sql`...`;

  for (const group of existingGroups.rows) {
    const match = await this.areProductsSame(product, group);
    if (match.isSame && match.confidence > 0.9) {
      return group.id;
    }
  }

  // 새 그룹 생성
  return await this.createNewGroup(product);
}
```

---

## 트러블슈팅

### 문제: 스크래핑이 실패합니다

**해결책:**
1. 쇼핑몰 HTML 구조가 변경되었는지 확인
2. User-Agent 헤더 확인
3. 요청 딜레이 늘리기 (서버 차단 방지)

```typescript
super({
  // ...
  delayBetweenRequests: 3000, // 3초로 늘림
});
```

### 문제: Claude API 오류

**해결책:**
1. `ANTHROPIC_API_KEY` 환경변수 확인
2. API 할당량 확인
3. 요청 속도 줄이기

```typescript
// normalizer.ts
await this.delay(1000); // 1초 딜레이 추가
```

### 문제: 제품이 중복 생성됩니다

**해결책:**
1. 제품 매칭 로직 확인
2. 브랜드/모델 정규화 규칙 개선
3. confidence_score 임계값 조정

---

## 라이선스

MIT License

---

## 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 문의

이슈가 있으시면 GitHub Issues에 등록해주세요.
