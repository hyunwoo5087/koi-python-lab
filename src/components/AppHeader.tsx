type HeaderProps = {
  done: number;
  total: number;
  onHome: () => void;
  onOpenMenu: () => void;
};

// 여섯 단계 목록은 헤더에서 뺐습니다. 문제 안에서는 StageHeader가 이미 같은 줄을
// 누를 수 있게 보여 주고, 홈에서는 지도가 진행을 나타내므로 읽을 것만 늘었습니다.
export default function AppHeader({ done, total, onHome, onOpenMenu }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand-row">
        <button className="mobile-menu-button" type="button" onClick={onOpenMenu} aria-label="문제 목록 열기">
          ☰
        </button>
        <button className="brand-button" type="button" onClick={onHome} aria-label="KOI Python Lab 홈으로 이동">
          <span className="brand-mark">K</span>
          <span><b>KOI</b> Lab</span>
        </button>
      </div>

      <button className="map-button" type="button" onClick={onHome} aria-label={`지도로 돌아가기. ${total}문제 중 ${done}문제 완료`}>
        <b>{done}<i>/{total}</i></b>
        <small>지도</small>
      </button>
    </header>
  );
}
