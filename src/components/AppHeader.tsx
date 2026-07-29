type HeaderProps = {
  view: "home" | "problem";
  stages: string[];
  onHome: () => void;
  onOpenMenu: () => void;
};

export default function AppHeader({ view, stages, onHome, onOpenMenu }: HeaderProps) {
  return (
    <header className={`app-header ${view === "problem" ? "no-steps" : ""}`}>
      <div className="header-brand-row">
        <button className="mobile-menu-button" type="button" onClick={onOpenMenu} aria-label="문제 목록 열기">
          ☰
        </button>
        <button className="brand-button" type="button" onClick={onHome} aria-label="KOI Python Lab 홈으로 이동">
          <span className="brand-mark">K</span>
          <span><b>KOI</b> Lab</span>
        </button>
      </div>

      {/* On a problem page StageHeader already shows these six steps, and does it
          interactively, so repeating them here would only duplicate the row. */}
      {view === "home" && (
        <div className="header-steps overview" aria-label="6단계 학습 과정">
          {stages.map((label, index) => (
            <div key={label}>
              <small>STEP {index + 1}</small>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      <button className="profile-button" type="button" aria-label="학습자 메뉴">●</button>
    </header>
  );
}
