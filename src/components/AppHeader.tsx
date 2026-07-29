type HeaderProps = {
  view: "home" | "problem";
  stages: string[];
  done: number;
  total: number;
  onHome: () => void;
  onOpenMenu: () => void;
};

export default function AppHeader({ view, stages, done, total, onHome, onOpenMenu }: HeaderProps) {
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

      {/* 예전에는 아무 동작 없는 초록 점이었는데 aria-label만 "학습자 메뉴"라고 읽혀,
          누르면 뭔가 열릴 것처럼 보이고 실제로는 아무 일도 없었습니다. 눌러서 지도로
          돌아가는 진행 상황 표시로 바꿨습니다. */}
      <button className="map-button" type="button" onClick={onHome} aria-label={`지도로 돌아가기. 15문제 중 ${done}문제 완료`}>
        <b>{done}<i>/{total}</i></b>
        <small>지도</small>
      </button>
    </header>
  );
}
