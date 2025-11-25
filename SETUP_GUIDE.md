# 🚀 Musician Danawa 설치 가이드

## 핵심 개념: 하나의 Vercel 프로젝트로 웹 + DB 통합

기존에는 웹 앱과 데이터베이스를 위해 **두 개의 Vercel 프로젝트**가 필요했습니다.
하지만 **Vercel Storage**를 사용하면 **하나의 프로젝트**에서 모든 것을 관리할 수 있습니다!

---

## 📋 사전 준비

- Node.js 18+ 설치
- Vercel 계정
- GitHub 계정 (선택사항, 권장)

---

## 🏗️ 로컬 개발 환경 설정

### 1단계: 프로젝트 클론 또는 준비

```bash
cd /Users/danielkim/private/musician-danawa
```

### 2단계: 패키지 설치

```bash
npm install
```

### 3단계: 환경 변수 설정 (임시)

로컬 개발을 위해 임시 환경 변수 파일을 생성합니다:

```bash
cp .env.example .env.local
```

> ⚠️ **주의**: 이 시점에서는 아직 실제 데이터베이스가 없으므로 앱이 완전히 작동하지 않습니다.
> Vercel에 배포한 후 실제 DB 연결 정보를 받아야 합니다.

### 4단계: 개발 서버 실행 (선택사항)

```bash
npm run dev
```

http://localhost:3002 에서 UI는 확인할 수 있지만, DB 연결이 없어 데이터는 조회되지 않습니다.

---

## 🌐 Vercel 배포 및 DB 설정

### 1단계: Git 저장소 초기화 및 푸시

```bash
# Git 초기화
git init

# .gitignore에 의해 .env.local은 자동으로 제외됩니다
git add .
git commit -m "Initial commit: Musician Danawa 악기 가격 비교 사이트"

# GitHub에 저장소 생성 후 연결
git remote add origin https://github.com/YOUR_USERNAME/musician-danawa.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel에 프로젝트 배포

1. https://vercel.com 접속 및 로그인
2. **"Add New Project"** 클릭
3. GitHub 저장소 연결 (musician-danawa 선택)
4. 설정 확인 후 **"Deploy"** 클릭
5. 배포 완료 대기 (약 1-2분)

> 🎉 **첫 배포 완료!** 하지만 아직 DB가 없어서 데이터는 표시되지 않습니다.

### 3단계: Vercel Postgres 데이터베이스 추가 (중요!)

이제 **같은 프로젝트에** 데이터베이스를 추가합니다:

1. Vercel 프로젝트 대시보드에서 **"Storage"** 탭 클릭
2. **"Create Database"** 버튼 클릭
3. **"Postgres"** 선택
4. 데이터베이스 이름 입력 (예: `musician-danawa-db`)
5. Region 선택 (가까운 지역 선택, 예: `ap-southeast-1`)
6. **"Create"** 클릭

> ✨ **자동으로 환경 변수가 프로젝트에 추가됩니다!**
> - POSTGRES_URL
> - POSTGRES_PRISMA_URL
> - POSTGRES_URL_NON_POOLING
> - POSTGRES_USER
> - POSTGRES_HOST
> - POSTGRES_PASSWORD
> - POSTGRES_DATABASE

### 4단계: 데이터베이스 스키마 초기화

1. Storage > 방금 생성한 Postgres DB 클릭
2. **"Query"** 탭으로 이동
3. 로컬의 `db/schema.sql` 파일 내용을 복사
4. Query 입력창에 붙여넣기
5. **"Run Query"** 클릭

> 🗃️ **데이터베이스 테이블 생성 완료!**
> - stores (악기 상점)
> - categories (카테고리)
> - products (제품)
> - prices (가격 정보)

### 5단계: 자동 재배포 (환경 변수 적용)

데이터베이스를 추가하면 Vercel이 자동으로 재배포를 트리거할 수 있습니다.
안 되었다면 수동으로:

1. Vercel 프로젝트 대시보드 > **"Deployments"** 탭
2. 최신 배포 오른쪽의 **"..."** 메뉴 클릭
3. **"Redeploy"** 클릭

> ✅ **완료!** 이제 웹 앱이 데이터베이스에 연결되어 정상 작동합니다.

---

## 🔄 로컬 개발 환경에 실제 DB 연결

배포 후 실제 데이터베이스 연결 정보를 로컬에서도 사용하려면:

### 방법 1: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트와 연결
vercel link

# 환경 변수 다운로드
vercel env pull .env.local
```

### 방법 2: 수동 복사

1. Vercel 프로젝트 > **"Settings"** > **"Environment Variables"**
2. `POSTGRES_*` 변수들을 복사
3. `.env.local` 파일에 붙여넣기

이제 로컬에서도 실제 Vercel Postgres DB에 연결할 수 있습니다!

```bash
npm run dev
# http://localhost:3002 - 실제 DB 데이터 사용
```

---

## 📊 요약: 단일 프로젝트 구조

```
Vercel 프로젝트: musician-danawa
│
├── 웹 애플리케이션 (Next.js)
│   ├── app/
│   ├── db/
│   └── public/
│
└── Vercel Storage (같은 프로젝트 내)
    └── Postgres Database
        ├── stores
        ├── categories
        ├── products
        └── prices
```

### 장점

✅ **하나의 프로젝트만 관리**
✅ **환경 변수 자동 주입**
✅ **비용 절감** (Hobby 플랜 무료)
✅ **배포 간편** (Git push만으로 자동 배포)
✅ **데이터베이스 쿼리 도구 내장** (Vercel Dashboard)

### 기존 방식과의 차이

| 항목 | 기존 방식 (2개 프로젝트) | 새로운 방식 (1개 프로젝트) |
|------|------------------------|---------------------------|
| Vercel 프로젝트 수 | 2개 (웹 + DB 서버) | 1개 |
| 환경 변수 설정 | 수동 설정 필요 | 자동 주입 |
| 배포 복잡도 | 높음 | 낮음 |
| 관리 포인트 | 2곳 | 1곳 |

---

## 🧪 테스트 데이터 추가 (선택사항)

배포 후 테스트 데이터를 추가하려면:

1. Vercel Dashboard > Storage > Postgres > **"Query"** 탭
2. 아래 SQL 실행:

```sql
-- 테스트 상점 추가
INSERT INTO stores (name, website_url, location) VALUES
  ('삼익악기', 'https://www.samick.co.kr', '서울'),
  ('뮤직메카', 'https://www.musicmeca.com', '서울'),
  ('신시웨이', 'https://www.syntheway.co.kr', '서울');

-- 테스트 제품 추가
INSERT INTO products (name, brand, model, category_id) VALUES
  ('Fender Player Stratocaster', 'Fender', 'Player Stratocaster', 1),
  ('Gibson Les Paul Standard', 'Gibson', 'Les Paul Standard', 1),
  ('Yamaha P-125 Digital Piano', 'Yamaha', 'P-125', 3);

-- 테스트 가격 추가
INSERT INTO prices (product_id, store_id, price, product_url) VALUES
  (1, 1, 1200000, 'https://example.com/product1'),
  (1, 2, 1150000, 'https://example.com/product1'),
  (2, 1, 3500000, 'https://example.com/product2'),
  (3, 3, 850000, 'https://example.com/product3');
```

---

## 🎯 다음 단계

1. 웹 스크래핑 로직 추가
2. 주요 악기 상점 API 연동
3. 제품 검색 UI 개선
4. 가격 알림 기능 추가

## 💡 문제 해결

### DB 연결 오류
- Vercel Dashboard > Storage에서 DB가 정상 작동하는지 확인
- Environment Variables에 `POSTGRES_*` 변수가 있는지 확인
- 프로젝트를 다시 배포해보기

### 로컬에서 DB 연결 안 됨
- `.env.local` 파일에 올바른 환경 변수가 있는지 확인
- `vercel env pull .env.local` 명령으로 최신 환경 변수 다운로드

---

**🎸 Happy Coding!**
