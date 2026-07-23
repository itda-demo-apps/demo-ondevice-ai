import { navigate } from "../router";

export default function Header({ view, setView }) {
  const tabs = [
    { id: "home", label: "진단" },
    { id: "contact", label: "문의" },
  ];
  return (
    <div className="header">
      <button className="btn header-logo-btn display header-logo" onClick={() => navigate("/")}>
        온디바이스 <span className="accent">AI</span>
      </button>
      <nav className="header-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn tab ${view === t.id ? "tab--active" : ""}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
