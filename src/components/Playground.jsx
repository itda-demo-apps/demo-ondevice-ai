import { useState } from "react";

import { PLAYGROUNDS } from "../capabilities";

// 실습 패널 — 사용 가능한 AI에 내 입력을 직접 넣어 돌려본다 (전부 기기 안에서 실행)
export default function Playground({ capId }) {
  const pg = PLAYGROUNDS[capId];
  const [input, setInput] = useState(pg.defaultInput || "");
  const [output, setOutput] = useState("");
  const [state, setState] = useState("idle"); // idle | running | done | error
  const [ms, setMs] = useState(0);

  const run = async () => {
    if (!input.trim() || state === "running") return;
    setState("running");
    setOutput("");
    const t0 = performance.now();
    try {
      // 스트리밍 지원 항목(Prompt)은 생성되는 대로 출력이 차오른다
      const result = await pg.run(input.trim(), (partial) => setOutput(partial));
      setOutput(result);
      setMs(Math.round(performance.now() - t0));
      setState("done");
    } catch (e) {
      setOutput(e.message);
      setMs(Math.round(performance.now() - t0));
      setState("error");
    }
  };

  return (
    <div className="pg">
      <div className="pg-label">{pg.label}</div>
      <textarea
        className="input pg-input"
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={pg.placeholder}
        maxLength={4000}
      />
      <button className="btn pg-run" disabled={!input.trim() || state === "running"} onClick={run}>
        {state === "running" ? "실행 중... (첫 실행은 준비에 몇 초 걸려요)" : "실행"}
      </button>
      {(output || state === "done" || state === "error") && (
        <div className={`pg-output ${state === "error" ? "pg-output--err" : ""}`}>
          {state !== "running" && (
            <span className="pg-output-meta">
              {state === "error" ? `✗ 실패 · ${ms}ms` : `✓ ${ms}ms · 기기 안에서 생성됨`}
            </span>
          )}
          <span className="pg-output-text">{output}</span>
        </div>
      )}
    </div>
  );
}
