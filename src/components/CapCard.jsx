import { KIND_LABEL, STATUS_LABEL } from "../capabilities";

// 능력 카드 — 상태 배지 + 검증/다운로드 액션 + 결과 표시
export default function CapCard({ cap, status, test, downloading, onTest, onDownload }) {
  const kind = KIND_LABEL[cap.kind];
  const st = STATUS_LABEL[status?.status] || { name: "확인 중...", color: "var(--muted)" };
  const canTest = status?.status === "available" || status?.status === "supported";
  const canDownload = status?.status === "downloadable";

  return (
    <div className="cap-card">
      <div className="cap-head">
        <span className="cap-name">{cap.name}</span>
        <span className="cap-kind" style={{ color: kind.color, borderColor: kind.color }}>
          {kind.name}
        </span>
        <span className="cap-status" style={{ color: st.color }}>
          <span className="dot" style={{ background: st.color }} /> {st.name}
        </span>
      </div>
      <div className="cap-desc">{cap.desc}</div>
      {status?.note && <div className="cap-note">{status.note}</div>}

      {canTest && (
        <button className="btn cap-action" disabled={test?.running} onClick={() => onTest(cap.id)}>
          {test?.running ? "검증 중..." : test ? "다시 검증" : "실동작 검증"}
        </button>
      )}
      {canDownload && (
        <button className="btn cap-action cap-action--download" disabled={downloading != null} onClick={() => onDownload(cap)}>
          {downloading != null ? `다운로드 중 ${downloading}%` : "모델 다운로드 (수백 MB~수 GB, 와이파이 권장)"}
        </button>
      )}

      {test && !test.running && (
        <div className={`cap-result ${test.ok ? "" : "cap-result--err"}`}>
          <span className="cap-result-meta">{test.ok ? `✓ 성공 · ${test.ms}ms` : `✗ 실패 · ${test.ms}ms`}</span>
          <span className="cap-result-output">{test.output}</span>
        </div>
      )}
    </div>
  );
}
