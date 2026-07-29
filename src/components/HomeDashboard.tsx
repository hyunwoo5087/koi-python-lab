import { Fragment } from "react";
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
  const inProgressCount = started.filter((id) => !done.includes(id)).length;
  const active = problems.find((problem) => started.includes(problem.id) && !done.includes(problem.id));
  const next = active ?? problems.find((problem) => !done.includes(problem.id)) ?? problems[0];
  const allDone = done.length === problems.length;

  // 5개씩 끊어 뱀처럼 잇습니다. 두 번째 줄은 오른쪽에서 왼쪽으로 되짚어 가야
  // 한 줄 끝에서 다음 줄로 이어지는 길처럼 읽혀요.
  const rows: Problem[][] = [];
  for (let i = 0; i < problems.length; i += 5) rows.push(problems.slice(i, i + 5));

  return (
    <section className="dashboard-page">
      {/* 진행률 막대 대신 지도가 진행 상황을 나타냅니다. 어디까지 왔는지, 다음이
          어디인지, 얼마나 남았는지를 한 그림에서 읽을 수 있어야 "탐험"이 됩니다. */}
      <div className={`adventure-map ${allDone ? "cleared" : ""}`}>
        <div className="map-head">
          <div>
            <h2>코딩 어드벤처 지도</h2>
            <p>{allDone ? "15개 미션을 모두 통과했어요!" : `${problems.length}개의 미션 중 ${done.length}개를 지났어요.`}</p>
          </div>
          <div className="map-count"><b>{done.length}</b><span>/ {problems.length}</span></div>
        </div>

        <div className="map-track">
          {rows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              <div className={`map-row ${rowIndex % 2 ? "backwards" : ""}`}>
              {row.map((problem, columnIndex) => {
                const isDone = done.includes(problem.id);
                const isStarted = started.includes(problem.id) && !isDone;
                const isNext = problem.id === next.id && !isDone;
                return (
                  <Fragment key={problem.id}>
                    {columnIndex > 0 && <i className={`map-link ${done.includes(row[columnIndex - 1].id) ? "walked" : ""}`} />}
                    <button
                      type="button"
                      className={`map-stop ${isDone ? "done" : isStarted ? "started" : "todo"} ${isNext ? "next" : ""}`}
                      style={{ "--problem-color": problem.color } as CSSProperties}
                      onClick={() => onSelect(problem.id)}
                      aria-label={`문제 ${problem.id} ${problem.title}, ${isDone ? "완료" : isStarted ? "진행 중" : "시작 전"}`}
                    >
                      <span className="stop-mark">{isDone ? "✓" : problem.id}</span>
                      <em>{problem.title}</em>
                      {isNext && <b className="stop-flag">여기부터</b>}
                    </button>
                  </Fragment>
                );
              })}
            </div>
              {rowIndex < rows.length - 1 && (
                <i className={`map-turn ${rowIndex % 2 ? "left" : "right"} ${done.includes(row[row.length - 1].id) ? "walked" : ""}`} />
              )}
            </Fragment>
          ))}
        </div>

        {allDone && (
          <div className="map-cleared">
            <b>🎉 미션 성공!</b>
            <p>15개 문제를 모두 스스로 풀어 냈어요. 지도의 모든 곳을 탐험했습니다.</p>
          </div>
        )}
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
        <div><h2>문제별 해결 상황</h2><span>완료 {done.length} · 진행 중 {inProgressCount} · 시작 전 {problems.length - done.length - inProgressCount}</span></div>
        <p>어느 단계까지 갔는지 확인하고 이어서 풀어 보세요.</p>
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
