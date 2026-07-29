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

export default function CodePractice({ problemId, onPass }: { problemId: string; onPass: () => void }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const problemTests = codeTests[problemId] ?? [];

  const resultsByName = useMemo(() => {
    if (state.kind !== "checked") return new Map<string, TestResult>();
    return new Map(state.results.map((result) => [result.name, result]));
  }, [state]);

  async function runTests(mode: "sample" | "all") {
    if (!code.trim()) {
      setState({ kind: "checked", mode, results: [{ name: "코드 입력", input: "", expected: "", actual: "", passed: false, hint: "먼저 코드 칸에 내 코드를 쓰거나 붙여 넣어 주세요.", error: "코드가 비어 있어요." }] });
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
        <div><small>FINAL STEP</small><h2>코드 확인 및 최종 실행</h2></div>
        <span>🔒 브라우저 안에서만 실행</span>
      </div>

      <div className="code-workbench-grid">
        <div className="editor-window">
          <div className="editor-titlebar"><span><i /> <i /> <i /></span><b>solution.py</b><em>⚙︎ ↶</em></div>
          <label className="editor-area">
            <span className="sr-only">내 파이썬 코드</span>
            <textarea
              value={code}
              onChange={(event) => { setCode(event.target.value); setState({ kind: "idle" }); }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={"# 여기에 내 코드를 작성하세요.\n# 예: n = int(input())\n\n"}
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
