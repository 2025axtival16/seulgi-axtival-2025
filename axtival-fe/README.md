# Axtival Frontend

AI 기반 회의 녹음, 전사, 요약 및 RAG 질의응답 시스템의 프론트엔드 애플리케이션입니다.

## 🚀 주요 기능

- **회의 녹음 및 전사**: 실시간 음성 인식을 통한 회의 내용 기록
- **참가자 관리**: 임직원 정보 연동을 통한 화자 추가 및 관리
- **자동 요약**: AI를 활용한 회의 내용 요약 및 follow-up 사항 도출
- **Confluence 연동**: 회의록 자동 저장 및 링크 공유
- **RAG 시스템**: 라벨 기반 문서 검색 및 질의응답
- **실시간 채팅**: RAG 연동 콘텐츠 기반 AI 채팅

## 🛠 기술 스택

- **Framework**: Next.js 15.1.5
- **언어**: TypeScript
- **스타일링**: Vanilla Extract + Sprinkles
- **UI 라이브러리**: Lucide React
- **폰트**: Pretendard

## 📦 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

> 💡 **pnpm을 사용하는 이유**: 빠른 설치 속도, 효율적인 디스크 공간 사용, 심볼릭 링크를 통한 의존성 관리

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx          # 메인 페이지
│   └── globals.css       # 전역 스타일
├── components/           # React 컴포넌트
│   ├── Button/           # 공용 버튼 컴포넌트
│   └── MeetingRecorder/  # 회의 녹음 관련 컴포넌트
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── ContentArea.tsx
│       ├── TranscriptionArea.tsx
│       ├── ParticipantManager.tsx
│       ├── RAGManager.tsx
│       ├── RAGChat.tsx
│       └── MeetingEndModal.tsx
└── styles/              # 스타일 시스템
    ├── sprinkles.css.ts # 디자인 토큰 및 Sprinkles 설정
    ├── button.css.ts    # 버튼 스타일
    └── meetingRecorder.css.ts # 회의 녹음 관련 스타일
```

## 🎨 디자인 시스템

### Sprinkles CSS-in-JS 시스템 활용

- **시맨틱 컬러**: `primary`, `secondary`, `neutral` 등
- **타이포그래피**: `fontSize`, `fontWeight`, `lineHeight`
- **레이아웃**: `padding`, `margin`, `borderRadius`
- **브랜드 컬러**: U+ 마젠타/네이비 색상 팔레트

### 사용 예시

```tsx
// Sprinkles 활용
<div className={sprinkles({
  backgroundColor: "primary",
  color: "on_primary",
  padding: 16,
  borderRadius: "medium"
})}>
  콘텐츠
</div>

// 버튼 컴포넌트
<Button variant="primary" padding={12}>
  클릭하세요
</Button>
```

## 🔧 개발 가이드

### 컴포넌트 작성 규칙

1. **TypeScript 사용**: 모든 컴포넌트에 타입 정의
2. **Sprinkles 우선 사용**: 인라인 스타일보다 디자인 토큰 활용
3. **Props 타입 정의**: 명확한 인터페이스 정의

### 스타일링 우선순위

1. Sprinkles 디자인 토큰
2. Vanilla Extract CSS 클래스
3. 인라인 스타일 (최후 수단)

## 📱 반응형 디자인

- **데스크톱**: 3컬럼 레이아웃 (Sidebar - Main - RAG Chat)
- **모바일**: 적응형 레이아웃 (추후 구현)

## 🤝 기여 가이드

1. 코드 스타일: Prettier + ESLint 준수
2. 컴포넌트: 재사용 가능하도록 설계
3. 타입 안전성: TypeScript 활용
4. 디자인 시스템: Sprinkles 토큰 사용

## 📄 라이선스

Private Repository
