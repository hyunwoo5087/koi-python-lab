import { useMemo, useState } from "react";
import { codeTests } from "../data/codeTests";
import { cleanOutput, friendlyError, runPython } from "../lib/pythonRunner";

type TestResult = {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  hint: string;
  error?: string;
};

type CheckState =
  | { kind: "idle" }
  | { kind: "running"; current: number; total: number; mode: "sample" | "all" }
  | { kind: "checked"; results: TestResult[]; mode: "sample" | "all" };

// The editor unmounts whenever the student steps away from 코드 확인 or opens
// another problem, so the draft has to outlive the component.
function readSavedCode(problemId: string) {
  try {
    const all = JSON.parse(localStorage.getItem("koi-code") || "{}");
    return typeof all?.[problemId] === "string" ? all[problemId] : "";
  } catch {
    return "";
  }
}

function saveCode(problemId: string, code: string) {
  try {
    const all = JSON.parse(localStorage.getItem("koi-code") || "{}");
    localStorage.setItem("koi-code", JSON.stringify({ ...all, [problemId]: code }));
  } catch {
    // A full or blocked storage must not stop the student from running code.
  }
}

// A blank editor after five steps of guided discovery is a cliff. Seed it with the
// plan the student just worked through, one comment per step, so writing code means
// filling in under each line rather than starting from nothing.
//
// This takes codePlan, not problem.steps: the latter includes the hands-on steps
// used to find the rule, which never become code, so a student saw four comments
// for a two-line program.
function pseudocodeScaffold(plan: string[]) {
  const body = plan.map((step, index) => `# ${index + 1}. ${step}\n\n`).join("");
  return `# 아래 순서대로 한 줄씩 코드로 바꿔 보세요.\n\n${body}`;
}

// Comments and blank lines do not run, so a scaffold-only submission is "not started"
// rather than a wrong answer, and deserves a different message.
function hasRealCode(code: string) {
  return code.split("\n").some((line) => line.trim() && !line.trim().startsWith("#"));
}

export default function CodePractice({ problemId, plan, onPass }: { problemId: string; plan: string[]; onPass: () => void }) {
  const [code, setCode] = useState(() => readSavedCode(problemId) || pseudocodeScaffold(plan));
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const problemTests = codeTests[problemId] ?? [];

  const resultsByName = useMemo(() => {
    if (state.kind !== "checked") return new Map<string, TestResult>();
    return new Map(state.results.map((result) => [result.name, result]));
  }, [state]);

  async function runTests(mode: "sample" | "all") {
    if (!hasRealCode(code)) {
      setState({ kind: "checked", mode, results: [{ name: "코드 입력", input: "", expected: "", actual: "", passed: false, hint: "#로 시작하는 줄은 사람을 위한 메모라 컴퓨터가 실행하지 않아요. 각 순서 아래에 파이썬 코드를 한 줄씩 써 보세요.", error: "아직 실행할 코드가 없어요." }] });
      return;
    }

    const targets = mode === "sample" ? problemTests.slice(0, 1) : problemTests;
    const results: TestResult[] = [];
    setState({ kind: "running", current: 0, total: targets.length, mode });

    for (let index = 0; index < targets.length; index += 1) {
      const test = targets[index];
      setState({ kind: "running", current: index + 1, total: targets.length, mode });
      try {
        const actual = await runPython(code, test.input);
        const passed = actual === cleanOutput(test.expected);
        results.push({ ...test, actual, passed });
        if (!passed && mode === "sample") break;
      } catch (error) {
        results.push({ ...test, actual: "", passed: false, error: friendlyError(String(error)) });
        break;
      }
    }

    setState({ kind: "checked", results, mode });
    if (mode === "all" && results.length === problemTests.length && results.every((result) => result.passed)) onPass();
  }

  const passedCount = state.kind === "checked" ? state.results.filter((result) => result.passed).length : 0;
  const checkedAll = state.kind === "checked" && state.mode === "all";
  const allPassed = checkedAll && state.results.length === problemTests.length && state.results.every((result) => result.passed);
  const firstFailure = state.kind === "checked" ? state.results.find((result) => !result.passed) : undefined;

  return (
    <section className="code-workbench">
      <div className="code-workbench-head">
        <div><small>마지막 단계</small><h2>코드 확인 및 최종 실행</h2></div>
        <span>🔒 브라우저 안에서만 실행</span>
      </div>

      <div className="code-workbench-grid">
        <div className="editor-window">
          <div className="editor-titlebar"><span><i /> <i /> <i /></span><b>solution.py</b><em>⚙︎ ↶</em></div>
          <label className="editor-area">
            <span className="sr-only">내 파이썬 코드</span>
            <textarea
              value={code}
              onChange={(event) => { setCode(event.target.value); saveCode(problemId, event.target.value); setState({ kind: "idle" }); }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={"# 각 순서 아래에 파이썬 코드를 한 줄씩 써 보세요.\n# 예: n = int(input())\n\n"}
              aria-label="내 파이썬 코드"
            />
          </label>
        </div>

        <div className="test-result-panel">
          <div className="test-result-head">
            <h3>☑ 테스트 결과 비교</h3>
            <span>{checkedAll ? `${passedCount} / ${problemTests.length} 통과` : `${problemTests.length}개 테스트`}</span>
          </div>
          <div className="test-result-columns" aria-hidden="true"><span>상태</span><span>입력값</span><span>기대 출력</span><span>실제 결과</span></div>
          <div className="test-result-list">
            {problemTests.map((test, index) => {
              const result = resultsByName.get(test.name);
              const running = state.kind === "running" && state.current === index + 1;
              return (
                <div key={test.name} className={`test-result-row ${result ? (result.passed ? "pass" : "fail") : ""}`}>
                  <span className="test-status">{result ? (result.passed ? "✓ 통과" : "! 확인") : running ? "… 실행" : `○ ${index + 1}`}</span>
                  <code>{test.input.trim() || "-"}</code>
                  <code>{test.expected}</code>
                  <code>{result ? (result.error || result.actual || "출력 없음") : "-"}</code>
                </div>
              );
            })}
          </div>

          {state.kind === "running" && <div className="student-message running">입력 {state.current}번을 넣어 코드를 실행하고 있어요…</div>}
          {allPassed && <div className="student-message success"><b>🎉 모든 테스트를 통과했어요!</b><span>예시 코드와 달라도 올바른 답을 만들었다면 정답이에요.</span></div>}
          {firstFailure && <div className="student-message error"><b>실행 결과를 다시 살펴보세요.</b><span>{firstFailure.error ?? firstFailure.hint}</span></div>}

          <div className="code-action-row">
            <button type="button" className="secondary" onClick={() => runTests("sample")} disabled={state.kind === "running"}>▷ 코드 실행</button>
            <button type="button" className="primary" onClick={() => runTests("all")} disabled={state.kind === "running"}>◎ 정답 확인하기</button>
          </div>
          <p className="code-privacy-note">모든 테스트 케이스를 통과해야 다음 단계의 완료 기록이 저장됩니다.</p>
        </div>
      </div>
    </section>
  );
}
