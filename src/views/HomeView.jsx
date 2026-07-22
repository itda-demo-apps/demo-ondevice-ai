import { useEffect, useState } from "react";

import Header from "../components/Header";
import InstallHint from "../components/InstallHint";
import CapCard from "../components/CapCard";
import SeriesLinks from "../components/SeriesLinks";
import {
  CAPS,
  detect,
  detectAll,
  runTest,
  triggerDownload,
  deviceInfo,
  reportText,
} from "../capabilities";

const GROUPS = [
  { kind: "stable", title: "브라우저 내장 AI — 정식 API" },
  { kind: "trial", title: "오리진 트라이얼 (실험 단계)" },
  { kind: "base", title: "기반 기술" },
];

export default function HomeView({ view, setView }) {
  const [statuses, setStatuses] = useState({});
  const [tests, setTests] = useState({}); // {capId: {running} | {ok, ms, output}}
  const [downloads, setDownloads] = useState({}); // {capId: percent}
  const [copied, setCopied] = useState(false);
  const info = deviceInfo();

  // 진입 즉시 전체 탐지 — 다운로드를 유발하지 않는 호출만
  useEffect(() => {
    detectAll().then(setStatuses);
  }, []);

  const onTest = async (capId) => {
    setTests((t) => ({ ...t, [capId]: { running: true } }));
    const result = await runTest(capId);
    setTests((t) => ({ ...t, [capId]: result }));
  };

  const onDownload = async (cap) => {
    setDownloads((d) => ({ ...d, [cap.id]: 0 }));
    try {
      await triggerDownload(cap, (loaded, total) =>
        setDownloads((d) => ({ ...d, [cap.id]: total ? Math.round((loaded / total) * 100) : 0 }))
      );
    } catch (e) {
      setTests((t) => ({ ...t, [cap.id]: { ok: false, ms: 0, output: `다운로드 실패: ${e.message}` } }));
    }
    setDownloads((d) => {
      const next = { ...d };
      delete next[cap.id];
      return next;
    });
    setStatuses((s) => ({ ...s })); // 재탐지
    const fresh = await detect(cap);
    setStatuses((s) => ({ ...s, [cap.id]: fresh }));
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText(statuses, tests));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 클립보드 미지원 환경 무시 */
    }
  };

  const availableCount = Object.values(statuses).filter(
    (s) => s?.status === "available" || s?.status === "supported"
  ).length;

  return (
    <div className="app">
      <Header view={view} setView={setView} />
      <InstallHint />

      {/* 기기 요약 카드 */}
      <div className="device-card">
        <div className="device-title">
          이 기기에서 <span className="accent">{Object.keys(statuses).length ? availableCount : "..."}</span>개
          사용 가능 <span className="device-total">/ {CAPS.length}개 점검</span>
        </div>
        <div className="device-info">
          {info.browser} · {info.platform} · RAM {info.memory} · 코어 {info.cores}
        </div>
        <div className="device-hint">
          모든 진단은 이 브라우저 안에서만 실행돼요 — 서버로 아무것도 보내지 않습니다.
        </div>
        <button className="btn device-copy" onClick={copyReport}>
          {copied ? "복사됐어요 ✓" : "진단 결과 복사"}
        </button>
      </div>

      {GROUPS.map((g) => (
        <div key={g.kind} className="cap-group">
          <div className="list-label">{g.title}</div>
          {CAPS.filter((c) => c.kind === g.kind).map((c) => (
            <CapCard
              key={c.id}
              cap={c}
              status={statuses[c.id]}
              test={tests[c.id]}
              downloading={downloads[c.id]}
              onTest={onTest}
              onDownload={onDownload}
            />
          ))}
        </div>
      ))}

      <div className="foot-note">
        API 지원 상황은 브라우저 버전에 따라 계속 바뀝니다. iPhone·Safari에서 대부분 "API 없음"으로
        나오는 것은 정상이에요 — 아직 웹에 열린 온디바이스 AI가 없기 때문이고, 그 지형을 확인하는 것이
        이 앱의 역할입니다.
      </div>

      <SeriesLinks />
    </div>
  );
}
