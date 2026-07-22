// 온디바이스 AI 탐지·검증 정본 모듈
// 3단계 진단: ① API 존재 → ② availability() 상태 → ③ 원탭 실동작 검증(지연시간 측정)
// 주의: 브라우저 릴리즈에 따라 API 표면이 바뀐다 — 모든 호출은 try/catch로 감싸고 실패를 그대로 보여준다.
// 모델 다운로드(수 GB)는 사용자가 버튼을 눌렀을 때만 트리거한다.

// 분류: stable(Chrome 148+ 정식) | trial(오리진 트라이얼) | base(기반 기술)
export const CAPS = [
  {
    id: "prompt",
    name: "Prompt API",
    api: "LanguageModel",
    kind: "stable",
    desc: "범용 온디바이스 LLM(Chrome은 Gemini Nano, Edge는 Phi 계열) — 자유 질문·지시 처리",
  },
  {
    id: "summarizer",
    name: "Summarizer API",
    api: "Summarizer",
    kind: "stable",
    desc: "텍스트 요약 전용",
  },
  {
    id: "translator",
    name: "Translator API",
    api: "Translator",
    kind: "stable",
    desc: "언어쌍별 번역 팩 — 한국어→영어 기준으로 진단",
  },
  {
    id: "detector",
    name: "Language Detector API",
    api: "LanguageDetector",
    kind: "stable",
    desc: "입력 텍스트의 언어 감지",
  },
  {
    id: "writer",
    name: "Writer API",
    api: "Writer",
    kind: "trial",
    desc: "새 글 생성(오리진 트라이얼 — 토큰 없인 대부분 미노출)",
  },
  {
    id: "rewriter",
    name: "Rewriter API",
    api: "Rewriter",
    kind: "trial",
    desc: "말투·길이 바꿔쓰기(오리진 트라이얼)",
  },
  {
    id: "proofreader",
    name: "Proofreader API",
    api: "Proofreader",
    kind: "trial",
    desc: "교정·문법 검사(오리진 트라이얼)",
  },
  {
    id: "webgpu",
    name: "WebGPU",
    kind: "base",
    desc: "브라우저에서 GPU 연산 — WebLLM류(모델 직접 다운로드형) 실행의 기반",
  },
  {
    id: "webnn",
    name: "WebNN",
    kind: "base",
    desc: "신경망 가속 표준(초기 단계) — navigator.ml",
  },
];

export const KIND_LABEL = {
  stable: { name: "정식 API", color: "#57A867" },
  trial: { name: "오리진 트라이얼", color: "#D96BA0" },
  base: { name: "기반 기술", color: "#4E8FD9" },
};

// status: available | downloadable | downloading | unavailable | no-api | supported | error
export const STATUS_LABEL = {
  available: { name: "사용 가능", color: "#57A867" },
  supported: { name: "지원됨", color: "#57A867" },
  downloadable: { name: "다운로드 필요", color: "#E8B93E" },
  downloading: { name: "다운로드 중", color: "#E8B93E" },
  unavailable: { name: "이 기기에선 불가", color: "#E4574B" },
  "no-api": { name: "API 없음", color: "#6B6E75" },
  error: { name: "오류", color: "#E4574B" },
};

const TRANSLATE_PAIR = { sourceLanguage: "ko", targetLanguage: "en" };

function apiObject(cap) {
  return cap.api && cap.api in self ? self[cap.api] : null;
}

// ② 상태 진단 — 다운로드를 유발하지 않는 호출만 사용
export async function detect(cap) {
  try {
    if (cap.id === "webgpu") {
      if (!("gpu" in navigator)) return { status: "no-api" };
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return { status: "unavailable", note: "어댑터 없음" };
      const info = adapter.info || {};
      return { status: "supported", note: [info.vendor, info.architecture].filter(Boolean).join(" · ") };
    }
    if (cap.id === "webnn") {
      return "ml" in navigator ? { status: "supported" } : { status: "no-api" };
    }
    const obj = apiObject(cap);
    if (!obj) return { status: "no-api" };
    if (typeof obj.availability !== "function") return { status: "supported", note: "availability() 없음 — 존재만 확인" };
    const arg = cap.id === "translator" ? TRANSLATE_PAIR : undefined;
    const status = await obj.availability(arg);
    return { status };
  } catch (e) {
    return { status: "error", note: e.message };
  }
}

export async function detectAll() {
  const entries = await Promise.all(CAPS.map(async (c) => [c.id, await detect(c)]));
  return Object.fromEntries(entries);
}

// ③ 실동작 검증 — status가 available일 때만 호출할 것 (create()는 다운로드를 유발할 수 있다)
const TESTS = {
  prompt: async () => {
    const session = await LanguageModel.create();
    const out = await session.prompt("한 단어로만 답해: 대한민국의 수도는?");
    session.destroy?.();
    return out;
  },
  summarizer: async () => {
    const s = await Summarizer.create({ type: "tldr", length: "short" });
    const out = await s.summarize(
      "온디바이스 AI는 클라우드 서버로 데이터를 보내지 않고 기기 안에서 모델을 실행하는 방식이다. 개인정보가 기기 밖으로 나가지 않고, 네트워크 없이 동작하며, 호출 비용이 들지 않는 것이 장점이다. 다만 모델 크기와 기기 성능의 제약으로 클라우드 모델보다 품질이 낮을 수 있다."
    );
    s.destroy?.();
    return out;
  },
  translator: async () => {
    const t = await Translator.create(TRANSLATE_PAIR);
    const out = await t.translate("안녕하세요, 현장에서 바로 써보는 온디바이스 AI 진단입니다.");
    t.destroy?.();
    return out;
  },
  detector: async () => {
    const d = await LanguageDetector.create();
    const results = await d.detect("안녕하세요");
    d.destroy?.();
    const top = results[0];
    return top ? `${top.detectedLanguage} (신뢰도 ${(top.confidence * 100).toFixed(1)}%)` : "결과 없음";
  },
  writer: async () => {
    const w = await Writer.create({ tone: "formal", length: "short" });
    const out = await w.write("회의 시작을 알리는 정중한 인사말 한 문장");
    w.destroy?.();
    return out;
  },
  rewriter: async () => {
    const r = await Rewriter.create({ tone: "more-formal" });
    const out = await r.rewrite("내일까지 이거 해줘");
    r.destroy?.();
    return out;
  },
  proofreader: async () => {
    const p = await Proofreader.create();
    const out = await p.proofread("나는 어제 회의를 갔다왔다");
    p.destroy?.();
    return typeof out === "string" ? out : (out.correctedInput ?? JSON.stringify(out));
  },
  webgpu: async () => {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    device.destroy?.();
    return "GPU 디바이스 획득 성공";
  },
};

export async function runTest(capId) {
  const fn = TESTS[capId];
  if (!fn) return { ok: false, output: "검증 미지원 항목" };
  const t0 = performance.now();
  try {
    const output = await fn();
    return { ok: true, ms: Math.round(performance.now() - t0), output: String(output).slice(0, 300) };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - t0), output: e.message };
  }
}

// downloadable 상태에서 명시적 다운로드 트리거 — 진행률 콜백 제공
export async function triggerDownload(cap, onProgress) {
  const obj = apiObject(cap);
  const arg = cap.id === "translator" ? { ...TRANSLATE_PAIR } : {};
  const instance = await obj.create({
    ...arg,
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => onProgress(e.loaded, e.total));
    },
  });
  instance.destroy?.();
}

// 기기·브라우저 정보
export function deviceInfo() {
  const uad = navigator.userAgentData;
  const brands = uad?.brands?.filter((b) => !/Not.A.Brand/i.test(b.brand)) || [];
  return {
    browser: brands.map((b) => `${b.brand} ${b.version}`).join(", ") || navigator.userAgent.slice(0, 80),
    platform: uad?.platform || navigator.platform,
    memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB+` : "확인 불가",
    cores: navigator.hardwareConcurrency || "확인 불가",
  };
}

// 진단 결과를 공유용 텍스트로
export function reportText(statuses, tests) {
  const info = deviceInfo();
  const lines = [
    `[온디바이스 AI 진단] ${new Date().toLocaleString("ko-KR")}`,
    `브라우저: ${info.browser} / ${info.platform} / RAM ${info.memory} / 코어 ${info.cores}`,
    "",
    ...CAPS.map((c) => {
      const st = statuses[c.id];
      const label = STATUS_LABEL[st?.status]?.name || st?.status || "-";
      const t = tests[c.id];
      const testPart = t ? ` | 검증: ${t.ok ? `성공 ${t.ms}ms` : `실패(${t.output})`}` : "";
      return `- ${c.name}: ${label}${st?.note ? ` (${st.note})` : ""}${testPart}`;
    }),
  ];
  return lines.join("\n");
}
