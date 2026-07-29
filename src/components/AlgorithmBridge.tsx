import { useState } from "react";

type Props = {
  /** What the student did by hand to find the rule. Not all of it becomes code. */
  steps: string[];
  /** Only the steps that become code, in run order — the pseudocode, and the editor scaffold. */
  plan: string[];
  code: string;
  /** One note per line of `code`. Problem O has no strategy guide, so this is optional. */
  codeNotes?: string[];
};

/**
 * Sits between 규칙 발견 and 코드 확인: restates the algorithm the student just
 * worked out, then lets them turn it into Python one line at a time.
 *
 * Lines start hidden on purpose. The whole solution used to print as soon as the
 * step opened, which answered the question before the student had attempted the
 * translation; now each line is a prompt they choose to check themselves against.
 */
export default function AlgorithmBridge({ steps, plan, code, codeNotes }: Props) {
  const [opened, setOpened] = useState<number[]>([]);
  // Blank lines are spacing, not a step to translate. Rendering them produced empty
  // black boxes and pushed every note one row away from the line it describes.
  const lines = code.split("\n").filter((line) => line.trim());
  const toggle = (index: number) =>
    setOpened((list) => (list.includes(index) ? list.filter((x) => x !== index) : [...list, index]));

  return (
    <>
      {/* Two lists on purpose: the hands-on steps are how the rule was found, and only
          some of them become instructions. Showing the narrowing is the point — it is
          also why the editor scaffold has fewer comments than this step has steps. */}
      <div className="algorithm-plan">
        <div className="plan-head">
          <span>해결 순서 · 알고리즘</span>
          <h3>손으로 해 본 일에서, 컴퓨터에게 시킬 일만 골라내요</h3>
        </div>
        <div className="plan-columns">
          <div className="plan-column hands">
            <h4>내가 손으로 해 본 일</h4>
            <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
          <i className="plan-arrow" aria-hidden="true">→</i>
          <div className="plan-column machine">
            <h4>컴퓨터에게 시킬 일 · 수도코드</h4>
            <ol>{plan.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
        </div>
        <p className="plan-note">
          규칙을 찾으려고 직접 해 본 일은 코드가 되지 않아요. 규칙을 찾은 뒤 <b>컴퓨터에게 시킬 일</b>만
          남긴 것이 <b>수도코드</b>이고, 코드 확인 단계의 편집기에도 이 순서가 그대로 들어가 있어요.
        </p>
      </div>

      <div className="mini-code-bridge">
        <h3>한 줄씩 코드로 바꿔 볼까요?</h3>
        <p className="bridge-guide">설명을 먼저 읽고 “나라면 어떻게 쓸까?”를 생각한 뒤, 눌러서 확인해 보세요.</p>
        {lines.map((line, index) => {
          const open = opened.includes(index);
          return (
            <button
              key={`${line}-${index}`}
              type="button"
              className={open ? "revealed" : ""}
              aria-expanded={open}
              onClick={() => toggle(index)}
            >
              <code className={open ? "" : "masked"}>{open ? line : `${index + 1}번째 줄 열기`}</code>
              <span>→</span>
              <p>{codeNotes?.[index] || "앞에서 찾은 규칙을 코드로 옮긴 부분이에요."}</p>
            </button>
          );
        })}
        <div className="bridge-count">{opened.length} / {lines.length}줄 확인함</div>
      </div>
    </>
  );
}
