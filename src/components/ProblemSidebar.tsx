import type { CSSProperties } from "react";
import type { Problem } from "../data/problems";

type SidebarProps = {
  problems: Problem[];
  selected: string;
  done: string[];
  started: string[];
  onSelect: (id: string) => void;
  onHome: () => void;
  mobile?: boolean;
  onClose?: () => void;
};

export default function ProblemSidebar({ problems, selected, done, started, onSelect, onHome, mobile = false, onClose }: SidebarProps) {
  return (
    <aside className={`problem-sidebar ${mobile ? "mobile" : ""}`} aria-label="문제 지도">
      <div className="sidebar-head">
        <div>
          <small>KOI PYTHON LAB</small>
          <h2>문제 지도</h2>
        </div>
        {mobile && <button type="button" onClick={onClose} aria-label="문제 목록 닫기">×</button>}
      </div>

      <button className="sidebar-home" type="button" onClick={() => { onHome(); onClose?.(); }}>
        <span>⌂</span><b>홈 및 전체 문제</b>
      </button>

      <div className="sidebar-list">
        {problems.map((problem) => {
          const isDone = done.includes(problem.id);
          const isStarted = started.includes(problem.id) && !isDone;
          const status = isDone ? "완료" : isStarted ? "진행 중" : "시작 전";
          return (
            <button
              type="button"
              key={problem.id}
              className={`${selected === problem.id ? "active" : ""} ${isDone ? "done" : ""}`}
              style={{ "--problem-color": problem.color } as CSSProperties}
              onClick={() => { onSelect(problem.id); onClose?.(); }}
            >
              <span className="sidebar-letter">{isDone ? "✓" : problem.id}</span>
              <span className="sidebar-copy">
                <b>문제 {problem.id}</b>
                <small>{problem.title}</small>
              </span>
              <em className={isDone ? "done" : isStarted ? "started" : "new"}>{status}</em>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
