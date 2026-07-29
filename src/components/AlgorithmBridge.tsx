import { useState } from "react";

type Props = {
  /** The plan in plain Korean — this is the pseudocode the student works from. */
  steps: string[];
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
export default function AlgorithmBridge({ steps, code, codeNotes }: Props) {
  const [opened, setOpened] = useState<number[]>([]);
  const lines = code.split("\n");
  const toggle = (index: number) =>
    setOpened((list) => (list.includes(index) ? list.filter((x) => x !== index) : [...list, index]));

  return (
    <>
      <div className="algorithm-plan">
        <div className="plan-head">
          <span>해결 순서 · 알고리즘</span>
          <h3>컴퓨터에게 시킬 일을 차례대로 적으면 이렇게 돼요</h3>
        </div>
        <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <p className="plan-note">
          이 순서가 <b>수도코드</b>예요. 아직 파이썬은 아니지만, 코드로 옮길 준비가 끝난 상태랍니다.
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
