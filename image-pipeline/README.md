# 🎨 AI 이미지 생성 도구 (React + Vite)

OpenAI (DALL-E 2, DALL-E 3, gpt-image-1) 및 Google Imagen 3를 사용한 이미지 생성 웹 애플리케이션

## ✨ 주요 기능

- 🎯 **이미지 생성**: DALL-E 2, DALL-E 3, gpt-image-1, Google Imagen 3 모델 지원
- 🖌️ **인페인팅**: ~~gpt-image-1을 사용한 이미지 수정~~ (현재 임시 비활성화)
- 💰 **비용 계산**: 실시간 API 호출 비용 산출
- 📱 **반응형 디자인**: 모바일/데스크톱 지원
- 💾 **로컬 저장**: 생성된 이미지 다운로드
- ⚡ **모던 스택**: React + Vite로 빠른 개발 경험

## 🚀 설치 및 실행

### 필요 조건

- Node.js 16.0.0 이상
- OpenAI API 키 (DALL-E 모델용)
- Google API 키 (Imagen 3 모델용)

### 1. 프로젝트 클론 또는 다운로드

```bash
# 디렉토리로 이동
cd image-pipeline
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
# 프론트엔드와 백엔드를 동시에 실행
npm start

# 또는 개별 실행
npm run server  # 백엔드 프록시 서버 (포트 3001)
npm run dev     # 프론트엔드 개발 서버 (포트 5173)
```

### 4. 브라우저에서 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3001

## 📖 사용법

### 1. API 키 설정

#### OpenAI API 키
1. [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키를 발급받습니다
2. 웹 애플리케이션의 "API 설정" 섹션에 키를 입력합니다
3. "저장" 버튼을 클릭합니다

#### Google API 키
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 또는 [Google Cloud Console](https://console.cloud.google.com/)에서 API 키를 발급받습니다
2. Gemini API를 활성화합니다
3. 웹 애플리케이션의 "API 설정" 섹션에 키를 입력합니다
4. "저장" 버튼을 클릭합니다

### 2. 이미지 생성

1. **프롬프트 입력**: 생성하고 싶은 이미지를 자세히 설명합니다
2. **모델 선택**: 
   - **OpenAI 모델**:
     - DALL-E 2: 빠르고 경제적
     - DALL-E 3: 높은 품질과 자연어 이해력
     - gpt-image-1: 최신 모델, 인페인팅 지원
   - **Google 모델**:
     - Imagen 3: 뛰어난 사실감과 디테일, 다양한 스타일 지원
3. **크기 선택**: 모델에 따라 지원되는 해상도가 다릅니다
4. **품질 선택**: 모델별로 다양한 품질 옵션 제공
5. **스타일 선택**: 일부 모델에서 스타일 옵션 제공 (사진, 일러스트, 예술적, 영화적 등)
6. **이미지 수**: 1-10개 선택 가능 (모델별 제한 있음)
7. "이미지 생성" 버튼 클릭

### 3. ~~인페인팅 (이미지 수정)~~ - 현재 비활성화

인페인팅 기능은 현재 임시로 비활성화되어 있습니다.

### 4. 이미지 다운로드

- 생성된 이미지 하단의 "다운로드" 버튼을 클릭합니다
- 이미지는 PNG 형식으로 저장됩니다

## 💰 비용 정보 (2025년 6월 기준)

### OpenAI 모델

#### DALL-E 2
- 256x256: $0.016
- 512x512: $0.018
- 1024x1024: $0.020

#### DALL-E 3
- 1024x1024 (표준): $0.040
- 1024x1024 (HD): $0.080
- 1024x1536/1536x1024 (표준): $0.080
- 1024x1536/1536x1024 (HD): $0.120

#### gpt-image-1
- Low (1024x1024): $0.011
- Medium (1024x1024): $0.042
- High (1024x1024): $0.167

### Google 모델

#### Imagen 3
- 1024x1024 (표준): $0.035
- 1024x1024 (고품질): $0.070
- 1024x1536/1536x1024 (표준): $0.052
- 1024x1536/1536x1024 (고품질): $0.105
- 1792x1024/1024x1792 (표준): $0.063
- 1792x1024/1024x1792 (고품질): $0.126

*비용은 이미지 1장 기준이며, API 제공사의 공식 가격 정책에 따라 변경될 수 있습니다.*

## 🛠️ 기술 스택

### Frontend
- **React 18** - 컴포넌트 기반 UI 라이브러리
- **Vite** - 빠른 개발 빌드 도구
- **CSS3** - 모던 스타일링 (Flexbox, Grid)

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **CORS** - Cross-Origin 요청 처리

### API
- **OpenAI Images API** - DALL-E 이미지 생성
- **Google Gemini API** - Imagen 3 이미지 생성

## 📂 프로젝트 구조

```
image-pipeline/
├── src/
│   ├── components/
│   │   ├── ApiKeySection.jsx      # API 키 입력 섹션
│   │   ├── ImageGenerationSection.jsx  # 이미지 생성 컨트롤
│   │   ├── InpaintingSection.jsx  # 인페인팅 컨트롤 (비활성화)
│   │   ├── ImageResults.jsx       # 생성된 이미지 표시
│   │   ├── LoadingSpinner.jsx     # 로딩 스피너
│   │   └── Message.jsx           # 메시지 컴포넌트
│   ├── utils/
│   │   ├── api.js                # API 호출 함수
│   │   └── pricing.js            # 비용 계산 유틸리티
│   ├── App.jsx                   # 메인 App 컴포넌트
│   ├── App.css                   # 애플리케이션 스타일
│   └── main.jsx                  # React 엔트리 포인트
├── server.js                     # Express 프록시 서버
├── package.json                  # 프로젝트 의존성
├── vite.config.js               # Vite 설정
└── README.md                    # 이 파일
```

## ⚙️ 설정 옵션

### 환경 변수

```bash
PORT=3001              # 백엔드 서버 포트 (기본값: 3001)
```

### 개발 스크립트

```bash
npm run dev           # 프론트엔드 개발 서버 실행
npm run server        # 백엔드 프록시 서버 실행
npm run dev:server    # 백엔드 서버 (nodemon 사용)
npm start            # 프론트엔드 + 백엔드 동시 실행
npm run build        # 프로덕션 빌드
npm run preview      # 빌드된 애플리케이션 미리보기
```

## 🐛 문제 해결

### CORS 오류

프록시 서버(`server.js`)를 사용하므로 CORS 문제가 해결됩니다. 만약 여전히 문제가 있다면:

1. 백엔드 서버가 정상적으로 실행되고 있는지 확인 (포트 3001)
2. http://localhost:3001/api/health 에서 서버 상태 확인
3. Vite 프록시 설정이 올바른지 확인 (`vite.config.js`)

### API 키 오류

#### OpenAI
1. OpenAI API 키가 `sk-`로 시작하는지 확인
2. API 키에 충분한 크레딧이 있는지 확인
3. API 키가 이미지 생성 권한을 가지고 있는지 확인

#### Google
1. Google API 키가 올바른 형식인지 확인 (보통 `AIza`로 시작)
2. Gemini API가 활성화되어 있는지 확인
3. API 키에 이미지 생성 권한이 있는지 확인

### 포트 충돌

- 프론트엔드: 5173 포트 (Vite 기본값)
- 백엔드: 3001 포트 (설정 가능)

포트를 변경하려면 `package.json`의 스크립트를 수정하거나 환경 변수를 설정하세요.

## 🆕 업데이트 내용

### v2.0.0 (2025년 6월)
- ✅ Google Imagen 3 모델 지원 추가
- ✅ 두 개의 API 키 관리 (OpenAI, Google)
- ✅ 모델별 파라미터 설정 개선
- ⚠️ 인페인팅 기능 임시 비활성화
- 🎨 UI/UX 개선

---

⚠️ **주의사항**: API 사용에는 비용이 발생합니다. 사용 전 반드시 각 제공사의 가격 정책을 확인하세요.
