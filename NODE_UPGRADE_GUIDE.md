# Node.js 업그레이드 가이드

현재 시스템의 Node.js 버전이 18.0.0이지만, Next.js 16은 Node.js 20.9.0 이상이 필요합니다.

## 방법 1: Homebrew 업데이트 (권장)

```bash
# Homebrew 업데이트
brew update
brew upgrade node

# Node.js 버전 확인
node --version  # v20 이상이어야 함
```

## 방법 2: 새로운 Node.js 다운로드 및 설치

1. https://nodejs.org/en/download 방문
2. LTS 버전 (v20.x 이상) macOS installer 다운로드
3. 설치 후 터미널 재시작

## 방법 3: nvm으로 설치 (홈 디렉토리 권한 필요)

```bash
# NVM_DIR 설정 확인
echo $NVM_DIR

# NVM_DIR이 설정되어 있다면
nvm install --lts
nvm use --lts
nvm alias default node
```

## 설치 후 서버 실행

```bash
cd /Users/danielkim/private/musician-danawa

# Node.js 버전 확인 (20.9.0 이상이어야 함)
node --version

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:8080 접속
```

## 문제 해결

만약 npm이 인식되지 않는다면:
```bash
which npm
# npm 경로 확인 후 PATH에 추가
export PATH="/usr/local/bin:$PATH"
```
