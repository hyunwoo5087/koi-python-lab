import type { CSSProperties } from "react";
import type { Problem } from "../data/problems";

type HomeProps = {
  problems: Problem[];
  done: string[];
  started: string[];
  stageByProblem: Record<string, number>;
  onSelect: (id: string) => void;
};

export default function HomeDashboard({ problems, done, started, stageByProblem, onSelect }: HomeProps) {
  const percent = Math.round((done.length / problems.length) * 100);
  const active = problems.find((problem) => started.includes(problem.id) && !done.includes(problem.id));
  const next = active ?? problems.find((problem) => !done.includes(problem.id)) ?? problems[0];
  const inProgressCount = started.filter((id) => !done.includes(id)).length;

  return (
    <section className="dashboard-page">
      <div className="dashboard-summary">
        <div className="summary-label">OVERALL PROGRESS</div>
        <div className="summary-number"><b>{percent}</b><span>%</span></div>
        <div className="summary-track"><i style={{ width: `${percent}%` }} /></div>
        <div className="summary-stats">
          <span>✓ 완료 <b>{done.length} / {problems.length}</b></span>
          <span>◷ 진행 중 <b>{inProgressCount}</b></span>
          <span>○ 남은 문제 <b>{problems.length - done.length}</b></span>
        </div>
      </div>

      <div className="resume-banner" style={{ "--problem-color": next.color } as CSSProperties}>
        <div>
          <small>{active ? "계속 학습" : done.length === problems.length ? "다시 도전" : "오늘의 추천"}</small>
          <h2>{next.title}</h2>
          <p>{next.story}</p>
        </div>
        <button type="button" onClick={() => onSelect(next.id)}>{active ? "계속하기" : "지금 시작하기"} →</button>
      </div>

      <div className="dashboard-section-head">
        <div><h2>코딩 어드벤처 지도</h2><span>총 {problems.length}개의 미션</span></div>
        <p>카드를 눌러 문제 해결 여행을 시작해 보세요.</p>
      </div>

      <div className="problem-card-grid">
        {problems.map((problem) => {
          const isDone = done.includes(problem.id);
          const isStarted = started.includes(problem.id) && !isDone;
          const currentStage = stageByProblem[problem.id] ?? 0;
          const progress = isDone ? 100 : isStarted ? Math.round(((currentStage + 1) / 6) * 100) : 0;
          const status = isDone ? "완료" : isStarted ? `STEP ${currentStage + 1}` : "시작 전";
          return (
            <button
              type="button"
              key={problem.id}
              className="problem-card"
              style={{ "--problem-color": problem.color } as CSSProperties}
              onClick={() => onSelect(problem.id)}
            >
              <div className="problem-card-top">
                <span className="problem-card-letter">{problem.id}</span>
                <em className={isDone ? "done" : isStarted ? "started" : "new"}>{isDone ? "✓ " : isStarted ? "◷ " : "○ "}{status}</em>
              </div>
              <h3>{problem.title}</h3>
              <div className="problem-card-tags">{problem.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="problem-card-progress"><span>진행률</span><b>{progress}%</b><i><u style={{ width: `${progress}%` }} /></i></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
