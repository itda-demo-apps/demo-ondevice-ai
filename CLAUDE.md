# 온디바이스 AI (demo-ondevice-ai)

이 기기·브라우저에서 쓸 수 있는 온디바이스 AI 탐지·검증 PWA. 교육용 데모 시리즈의 플랫폼 데모 — "기능을 만들기 전에 플랫폼 지형부터 실측한다".

## 배경과 목적

Chrome 148(2026 Q2)에서 Prompt API가 웹 정식 지원되며 브라우저 내장 AI 시대가 열렸지만, 지원은 브라우저·버전·기기(디스크 22GB·RAM 16GB/VRAM 4GB)·플랫폼(iOS 미지원)에 따라 크게 갈린다.
이 앱은 그 지형을 **기기에서 직접 실측**한다: QR로 수강생 폰에 뿌리면 각자 자기 기기의 진단표를 보게 되고, "폰에서 안 되는 것" 자체가 교육 콘텐츠가 된다.
마스터 방향(2026-07-22): 기능성 앱보다 **플랫폼별 가용 온디바이스 AI 파악·검증**이 우선.

## 실행

```bash
npm install
npm run dev / build / preview
npm run icons                       # 아이콘 재생성 (Pillow)
python3 scripts/generate-og.py      # OG 이미지 — 저장소 루트에서 실행
python3 scripts/generate-splash.py  # iOS 스플래시 17종 — 저장소 루트에서 실행
```

## 구조

```
src/
  main.jsx               # 엔트리 — SW 등록
  App.jsx                # 화면 전환(home/contact)만 — 상태는 HomeView가 소유
  capabilities.js        # ★ 진단 정본 — CAPS 목록, detect/detectAll/runTest/triggerDownload/deviceInfo/reportText
  styles.css             # 디자인 토큰 + 클래스
  data/series.js         # 데모 시리즈 목록(SELF_ID·SERIES·REPO_URL)
  views/
    HomeView.jsx         # 기기 요약 카드 + 그룹별 능력 카드 + 결과 복사
    ContactView.jsx      # 문의 폼 (시리즈 공용 패턴)
  components/
    Header.jsx           # 로고 + 진단/문의 탭
    CapCard.jsx          # 능력 카드 — 상태 배지·검증/실습/다운로드 버튼·결과 표시
    Playground.jsx       # 실습 패널 — 사용자 입력을 직접 AI에 넣어 실행(Prompt는 스트리밍)
    InstallHint.jsx      # 홈 화면 추가 안내 (시리즈 공용)
    SeriesLinks.jsx      # 시리즈 링크 푸터
api/contact.js           # 문의 폼 → Telegram (Vercel 함수)
scripts/                 # PIL 아이콘/OG/스플래시 (칩+상태점 도안)
```

## 핵심 로직 (`capabilities.js`)

- **3단계 진단**: ① `api in self` 존재 확인 → ② `availability()` (translator는 ko→en 언어쌍 인자) → ③ available일 때만 `runTest()`로 실호출·지연 측정. WebGPU는 `requestAdapter()`(어댑터 정보 노트), WebNN은 `navigator.ml` 존재만.
- **다운로드 가드가 이 앱의 안전핀**: `create()`는 downloadable 상태에서 모델 다운로드(수백 MB~수 GB)를 유발한다 — 자동 호출 금지, `triggerDownload()`는 사용자 버튼으로만, `monitor`의 downloadprogress로 진행률 표시. 완료 후 해당 항목만 재탐지.
- **API 표면 변동 대응**: 모든 호출 try/catch — 실패는 status "error"/검증 실패로 정직하게 표시. 브라우저 릴리즈마다 표면이 바뀌므로 고치기보다 **드러내는** 것이 앱의 역할. 신규 API 추가는 CAPS 배열 + TESTS 맵에 항목 추가.
- **분류**: stable(Chrome 148+ 정식: Prompt/Summarizer/Translator/LanguageDetector) | trial(Writer/Rewriter/Proofreader — 토큰 없인 대부분 no-api) | base(WebGPU/WebNN). 검증일 2026-07-22 기준 — 갱신 시 이 날짜도 갱신할 것.
- **실습(PLAYGROUNDS)**: available 항목은 "직접 실습해 보기"로 사용자 입력을 실제 실행 — Prompt는 `promptStreaming` 스트리밍 표시, 나머지는 단발 호출. 인스턴스는 항목별 캐시(`cached()`)로 재실행 가속. 기본 입력값은 회사원 유즈케이스(보고체 변환·회의록 요약·미팅 문의 번역)로 유용성을 바로 체감시키는 것이 목적(마스터 피드백 2026-07-22 "검증만 있고 실습이 없다").
- **무전송 원칙**: 진단·검증·리포트 전부 클라이언트. 네트워크 요청 0 (모델 다운로드 제외) — 시연 시 개발자도구 네트워크 탭이 킬러 장면.

## 규약 (데모 시리즈 공통)

- UI·주석 한국어. 배경 `#1E2126`(주철)·텍스트 `#F2EFE9`(초크), Black Han Sans + Noto Sans KR. 상태색: 가능 `#57A867`/다운로드 `#E8B93E`/불가 `#E4574B`/없음 muted.
- 앱 아이콘: 칩 + 초록 상태 점. 재생성 `npm run icons`.
- 모바일 퍼스트(maxWidth 480).
- **시리즈 상호 링크**: `data/series.js` — **새 데모 앱 추가 시 모든 형제 앱의 series.js 함께 갱신·재배포**(마스터 지시 2026-07-22).

## 배포

- Vercel 프로젝트 `itda-demo-ondevice-ai`, 프로덕션 https://itda-demo-ondevice-ai.vercel.app
- 문의 폼: Vercel 환경변수 `TELEGRAM_BOT_TOKEN`·`TELEGRAM_CHAT_ID`(Production) — 원본 `~/Apps/demo-apps/.env`
- 강의 시연 팁: 시연 머신에 모델 **사전 다운로드** 필수(강의장 와이파이로 라이브 다운로드 금지). 이 Mac(Chrome 150)은 2026-07-22 기준 Prompt API "unavailable" — chrome://components 의 On Device Model 설치 상태 확인 필요.

## 미착수 / 로드맵 후보

- [ ] Edge(Phi 계열)·신규 브라우저 실측 결과를 README에 누적
- [ ] WebLLM(모델 직접 다운로드형) 데모 카드 — WebGPU 활용 실연
- [ ] 진단 결과 익명 수집(강의장 통계용) — 서버 필요, 무전송 원칙과 상충하니 옵트인으로만
