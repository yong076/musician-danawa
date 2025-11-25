# 🎸 뮤지션 다나와 (Musician Danawa)

한국의 모든 악기 상점 가격을 한눈에 비교하는 플랫폼

## 주요 기능

- 🔍 악기 검색 및 가격 비교
- 🏪 다양한 악기 상점 통합
- 📊 실시간 가격 정보
- 📱 반응형 디자인 (모바일/태블릿/데스크톱)

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Vercel Postgres
- **Deployment**: Vercel

## 프로젝트 구조

```
musician-danawa/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── products/      # 제품 관련 API
│   │   ├── categories/    # 카테고리 API
│   │   └── stores/        # 상점 API
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── db/                    # 데이터베이스
│   ├── schema.sql         # DB 스키마
│   └── index.ts           # DB 헬퍼 함수
└── public/                # 정적 파일
```

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Vercel Postgres 설정

1. Vercel 프로젝트 생성
2. Storage 탭에서 Postgres 데이터베이스 생성
3. `.env.local` 파일 생성 및 환경 변수 설정

```bash
cp .env.example .env.local
```

4. Vercel에서 제공하는 Postgres 환경 변수를 `.env.local`에 복사

### 3. 데이터베이스 초기화

편리한 초기화 스크립트를 제공합니다:

```bash
npm run db:init
```

이 스크립트는 자동으로:
- `.env.local`에서 데이터베이스 연결 정보 로드
- `db/schema.sql` 파일 실행
- 테이블 생성 (stores, categories, products, prices)
- 10개의 초기 카테고리 데이터 삽입

또는 Vercel Postgres 대시보드의 Query 탭에서 `db/schema.sql` 파일의 내용을 직접 실행할 수도 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3002](http://localhost:3002) 열기

## Vercel 배포

### 단일 프로젝트로 웹 + DB 구현

이 프로젝트는 **하나의 Vercel 프로젝트**에서 웹과 데이터베이스를 모두 관리합니다:

1. **GitHub 저장소 연결**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Vercel에 배포**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 배포

3. **Postgres Storage 추가**
   - 배포된 프로젝트의 "Storage" 탭 이동
   - "Create Database" 클릭
   - "Postgres" 선택
   - 데이터베이스 생성 (환경 변수가 자동으로 프로젝트에 추가됨)

4. **데이터베이스 초기화**
   - Storage > Postgres > 데이터베이스 선택
   - "Query" 탭 클릭
   - `db/schema.sql` 파일 내용 복사하여 실행

5. **자동 배포**
   - main 브랜치에 push하면 자동으로 재배포됨
   - 환경 변수는 Vercel에서 자동 관리

### 장점

✅ **하나의 프로젝트로 관리**: 웹 앱과 DB를 분리된 Vercel 프로젝트로 만들 필요 없음
✅ **환경 변수 자동 설정**: Postgres 추가 시 환경 변수가 자동으로 프로젝트에 주입됨
✅ **비용 효율적**: Hobby 플랜에서도 무료로 사용 가능
✅ **간편한 관리**: 하나의 대시보드에서 웹과 DB 모두 관리

## 데이터베이스 스키마

### 주요 테이블

- `stores`: 악기 상점 정보
- `categories`: 악기 카테고리
- `products`: 악기 제품 정보
- `prices`: 제품별 상점별 가격 정보

## API 엔드포인트

- `GET /api/categories` - 카테고리 목록
- `GET /api/stores` - 상점 목록
- `GET /api/products?q=검색어&category=카테고리ID` - 제품 검색
- `GET /api/products/[id]/prices` - 제품 가격 비교

## 샘플 데이터 생성

데이터베이스가 비어있다면 샘플 데이터를 생성할 수 있습니다:

```bash
npm run db:sample
```

이 스크립트는 다음을 생성합니다:
- 8개의 악기 상점
- 20개 이상의 일렉기타 제품 (Fender, Gibson, PRS, Ibanez, ESP 등)
- 각 제품별 3-5개 상점의 가격 정보

## 주요 기능

### 완료된 기능 ✅

- ✅ 홈페이지 (검색, 추천 제품, 브랜드별 찾기)
- ✅ 제품 리스트 페이지 (고급 필터링)
- ✅ 제품 상세 페이지 (가격 비교)
- ✅ 브랜드별 검색
- ✅ 카테고리별 검색
- ✅ 가격대별 필터링
- ✅ 반응형 디자인
- ✅ API 엔드포인트
  - `/api/products` - 제품 검색 및 필터링
  - `/api/products/[id]/prices` - 제품별 가격 비교
  - `/api/brands` - 브랜드 목록
  - `/api/stores` - 상점 목록
  - `/api/categories` - 카테고리 목록

### 향후 개발 계획 📋

- [ ] 웹 스크래핑 시스템 구축
- [ ] 주요 악기 상점 연동
  - [ ] 삼익악기
  - [ ] 뮤직메카
  - [ ] 신시웨이
  - [ ] 영창뮤직
  - [ ] 기타 온라인 쇼핑몰
- [ ] 가격 알림 기능
- [ ] 사용자 즐겨찾기
- [ ] 가격 변동 히스토리

## 라이선스

MIT
