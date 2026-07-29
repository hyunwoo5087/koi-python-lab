import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { problems } from "./data/problems";
import { codeLineNotes, codePlan, variableGuides } from "./data/guides";
import GeneralStrategyExplorer from "./components/GeneralStrategyExplorer";
import AlgorithmBridge from "./components/AlgorithmBridge";
import PythonHelp from "./components/PythonHelp";
import CodePractice from "./components/CodePractice";
import AppHeader from "./components/AppHeader";
import ProblemSidebar from "./components/ProblemSidebar";
import HomeDashboard from "./components/HomeDashboard";
import StageHeader from "./components/StageHeader";
import ProblemStage from "./interactions/registry";
import { ButtonRuleExplorer } from "./interactions/ButtonInteractions";
import { preloadPython } from "./lib/pythonRunner";

// "작은 예"는 이 단계에서 실제로 하는 일(그림과 숫자를 직접 바꿔 보며 관찰하기)을
// 가리키지 못했습니다. 특히 문제 G처럼 100억을 다루는 화면에서는 "작은"이 사실과
// 어긋나기까지 했어요.
const STAGES = ["요구 찾기", "직접 해 보기", "핵심 질문", "규칙 발견", "해결 전략", "코드 확인"];

type StoredStages = Record<string, number>;
type StoredNotes = Record<string, string>;

function readArray(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readRecord<T extends Record<string, unknown>>(key: string): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as T : {} as T;
  } catch {
    return {} as T;
  }
}

export default function App() {
  const [view, setView] = useState<"home" | "problem">("home");
  const [selected, setSelected] = useState("A");
  const [stage, setStage] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [started, setStarted] = useState<string[]>([]);
  const [stageByProblem, setStageByProblem] = useState<StoredStages>({});
  const [notes, setNotes] = useState<StoredNotes>({});
  const [rules, setRules] = useState<StoredNotes>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const problem = useMemo(() => problems.find((item) => item.id === selected) ?? problems[0], [selected]);

  useEffect(() => {
    setDone(readArray("koi-progress"));
    setStarted(readArray("koi-started"));
    setStageByProblem(readRecord<StoredStages>("koi-stages"));
    setNotes(readRecord<StoredNotes>("koi-notes"));
    setRules(readRecord<StoredNotes>("koi-rules"));
  }, []);

  // STAGES[4] is 해결 전략, the step right before 코드 확인, so the Python
  // runtime is already cached by the time the student runs their first program.
  useEffect(() => {
    if (stage >= 4) preloadPython();
  }, [stage]);

  useEffect(() => {
    if (!drawerOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawerOpen]);

  function persistStage(problemId: string, nextStage: number) {
    setStage(nextStage);
    setStageByProblem((current) => {
      const next = { ...current, [problemId]: Math.max(current[problemId] ?? 0, nextStage) };
      localStorage.setItem("koi-stages", JSON.stringify(next));
      return next;
    });
  }

  function selectProblem(id: string) {
    const savedStage = stageByProblem[id] ?? 0;
    setSelected(id);
    setView("problem");
    setStage(savedStage);
    setChoice(null);
    setHint(false);
    setRevealed(false);
    setStarted((current) => {
      const next = [...new Set([...current, id])];
      localStorage.setItem("koi-started", JSON.stringify(next));
      return next;
    });
  }

  function finish() {
    const next = [...new Set([...done, problem.id])];
    setDone(next);
    localStorage.setItem("koi-progress", JSON.stringify(next));
    persistStage(problem.id, 5);
  }

  function saveNote() {
    localStorage.setItem("koi-notes", JSON.stringify(notes));
  }

  function moveStage(nextStage: number) {
    persistStage(problem.id, nextStage);
    setChoice(null);
    setHint(false);
  }

  return (
    <div className="app-frame">
      <AppHeader
        view={view}
        stages={STAGES}
        done={done.length}
        total={problems.length}
        onHome={() => setView("home")}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      <div className="app-layout">
        <ProblemSidebar
          problems={problems}
          selected={selected}
          done={done}
          started={started}
          onSelect={selectProblem}
          onHome={() => setView("home")}
        />

        <main className="app-content">
          {view === "home" ? (
            <HomeDashboard
              problems={problems}
              done={done}
              started={started}
              stageByProblem={stageByProblem}
              onSelect={selectProblem}
            />
          ) : (
            <section className="problem-page" style={{ "--accent": problem.color } as CSSProperties}>
              <StageHeader stages={STAGES} stage={stage} onMove={moveStage} />

              <div className="problem-page-title">
                <div>
                  <span>문제 {problem.id}</span>
                  <small>{problem.tags.join(" · ")}</small>
                </div>
                <h1>{stage === 1 ? problem.question : problem.title}</h1>
                <p>{stage === 1 ? problem.story : `${STAGES[stage]} 단계에서 문제의 핵심을 차근차근 찾아봅니다.`}</p>
              </div>

              <div className="problem-stage-content">
                {stage === 0 && (
                  <div className="requirements-stage">
                    <div className="mission modern-card">
                      <span>이번 문제의 할 일</span>
                      <h3>{problem.story}</h3>
                    </div>
                    <div className="io-cards">
                      <button type="button" onClick={() => setChoice(0)} className={choice === 0 ? "selected" : ""}>
                        <span>컴퓨터가 받는 값</span><b>{problem.input}</b>
                      </button>
                      <button type="button" onClick={() => setChoice(1)} className={choice === 1 ? "selected" : ""}>
                        <span>컴퓨터가 보여 줄 답</span><b>{problem.output}</b>
                      </button>
                    </div>
                    <div className="coach-callout">💬 먼저 “무엇을 답으로 보여 줘야 하지?”를 자기 말로 설명해 보세요.</div>
                  </div>
                )}

                {stage === 1 && (
                  <div className="simulation-layout">
                    <div className="simulation-column">
                      <div className="simulation-prompt">
                        <span>관찰 질문</span>
                        <b>{problem.question}</b>
                      </div>
                      <div className="simulation-surface"><ProblemStage key={problem.id} problem={problem} /></div>
                    </div>
                    <aside className="reflection-panel">
                      <span>생각 기록하기</span>
                      <h3>관찰한 뒤에 알게 된 점은?</h3>
                      <p>숫자나 그림을 바꾸며 새롭게 발견한 규칙을 한 문장으로 적어 보세요.</p>
                      <textarea
                        value={notes[problem.id] ?? ""}
                        maxLength={80}
                        onChange={(event) => setNotes((current) => ({ ...current, [problem.id]: event.target.value }))}
                        placeholder="여기에 적어 보세요…"
                        aria-label="관찰한 규칙 기록"
                      />
                      <small>{(notes[problem.id] ?? "").length} / 80</small>
                      <button type="button" onClick={saveNote}>내 생각 저장 ▣</button>
                      <div className="reflection-tip">ⓘ 숫자를 여러 번 바꾸어 본 뒤 적으면 규칙을 더 잘 발견할 수 있어요.</div>
                    </aside>
                  </div>
                )}

                {stage === 2 && (
                  <div className="question-card modern-card">
                    <span>생각 질문</span>
                    <h3>{problem.question}</h3>
                    <div className="choices">
                      {problem.choices.map((item, index) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setChoice(index)}
                          className={choice === index ? (index === problem.correct ? "correct" : "wrong") : ""}
                        >
                          {item}
                          {choice === index && <i>{index === problem.correct ? "맞았어요!" : "다시 생각해 볼까요?"}</i>}
                        </button>
                      ))}
                    </div>
                    <button className="hint-btn" type="button" onClick={() => setHint(!hint)}>💡 {hint ? "힌트 닫기" : "힌트 보기"}</button>
                    {hint && <p className="hint">{problem.hint}</p>}
                  </div>
                )}

                {stage === 3 && (
                  <div className="insight modern-card">
                    <div className="spark">✦</div>
                    <p>직접 해 보며 발견한 규칙</p>
                    <h3>{problem.insight}</h3>
                    {/* Was an uncontrolled textarea: whatever the student wrote here
                        vanished the moment they moved off the step. */}
                    <textarea
                      value={rules[problem.id] ?? ""}
                      onChange={(event) => {
                        const next = { ...rules, [problem.id]: event.target.value };
                        setRules(next);
                        localStorage.setItem("koi-rules", JSON.stringify(next));
                      }}
                      placeholder="내가 발견한 규칙을 다시 적어 보세요…"
                      aria-label="내가 발견한 규칙"
                    />
                    <small>정답을 외우기보다 왜 이런 규칙이 생기는지 그림을 다시 살펴보세요.</small>
                  </div>
                )}

                {stage === 4 && (
                  <div className="strategy-stage">
                    {problem.id === "O" ? <ButtonRuleExplorer /> : <GeneralStrategyExplorer key={problem.id} p={problem} />}
                    <AlgorithmBridge
                      key={problem.id}
                      steps={problem.steps}
                      plan={codePlan[problem.id]}
                      code={problem.code}
                      codeNotes={codeLineNotes[problem.id]}
                    />
                  </div>
                )}

                {stage === 5 && (
                  <div className="code-stage-new">
                    {/* The plan the student wrote is right above the editor, and this is
                        where they need the syntax for it. */}
                    <PythonHelp />
                    <CodePractice key={problem.id} problemId={problem.id} plan={codePlan[problem.id]} onPass={finish} />
                    <div className="solution-toggle">
                      <div><span>막힐 때 비교하는 여러 풀이 중 하나</span><h3>가장 쉬운 풀이 예시를 볼까요?</h3></div>
                      <button type="button" onClick={() => setRevealed(!revealed)}>{revealed ? "코드 가리기" : "풀이 예시 열기"}</button>
                    </div>
                    {revealed && (
                      <div className="solution-example">
                        <div className="many-answers-note"><b>이 코드만 정답은 아니에요.</b><p>다른 코드를 써도 모든 입력에서 알맞은 답이 나오면 정답이 될 수 있어요.</p></div>
                        <div className="variable-guide"><span>이름표 먼저 읽기</span>{variableGuides[problem.id]?.map((item) => { const [name, meaning] = item.split(" = "); return <div key={item}><code>{name}</code><i>→</i><b>{meaning}</b></div>; })}</div>
                        <pre><code>{problem.code}</code></pre>
                        <div className="verify"><span>손으로 검산</span><b>{problem.sample}</b></div>
                        {/* No completion button here: reading the example is not solving
                            the problem, and the panel above promises that the record is
                            saved only when every test passes. CodePractice calls finish(). */}
                        <div className="example-closing">
                          {done.includes(problem.id)
                            ? "✓ 이 문제는 이미 완료했어요."
                            : "예시를 참고했다면, 위 편집기에 내 코드로 다시 써서 모든 테스트를 통과해 보세요."}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="problem-footer-nav">
                <button type="button" disabled={stage === 0} onClick={() => moveStage(stage - 1)}>← 이전 단계</button>
                {/* The dots and the old "STEP n 진행률 nn%" bar below said the same
                    thing twice, and that label read as progress *within* the step
                    rather than through the six of them. One indicator, worded plainly. */}
                <div className="stage-progress-line">
                  <div className="stage-dots" aria-hidden="true">
                    {STAGES.map((_, index) => <i key={index} className={index <= stage ? "filled" : ""} />)}
                  </div>
                  <span>6단계 중 <b>{stage + 1}단계</b> · {STAGES[stage]}</span>
                </div>
                <button
                  type="button"
                  className="primary"
                  disabled={stage === 5 || (stage === 2 && choice !== problem.correct)}
                  onClick={() => moveStage(stage + 1)}
                >
                  {stage === 2 && choice !== problem.correct ? "정답을 찾아야 이동할 수 있어요" : "다음 단계 →"}
                </button>
              </div>

            </section>
          )}
        </main>
      </div>

      {drawerOpen && (
        <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="모바일 문제 목록">
          <button className="drawer-backdrop" type="button" aria-label="문제 목록 닫기" onClick={() => setDrawerOpen(false)} />
          <ProblemSidebar
            mobile
            problems={problems}
            selected={selected}
            done={done}
            started={started}
            onSelect={selectProblem}
            onHome={() => setView("home")}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
