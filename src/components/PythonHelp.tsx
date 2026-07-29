import { useMemo, useState } from "react";
import { pythonPhrases } from "../data/pythonPhrases";

/**
 * 수도코드를 파이썬으로 옮기는 자리에서 문법을 찾아보는 사전.
 *
 * 문제의 정답이 아니라 표현만 담습니다. "무엇을 하고 싶은가"로 검색하게 만든 건,
 * 파이썬 이름(if, for, range…)을 아직 모르는 학생이 출발점으로 삼을 수 있는 말이
 * 자기 알고리즘에 쓴 우리말뿐이기 때문입니다.
 */
export default function PythonHelp() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return pythonPhrases;
    return pythonPhrases
      .map((group) => ({
        ...group,
        phrases: group.phrases.filter((phrase) =>
          `${phrase.want} ${phrase.code} ${phrase.note}`.toLowerCase().includes(keyword)
        ),
      }))
      .filter((group) => group.phrases.length > 0);
  }, [query]);

  const total = groups.reduce((sum, group) => sum + group.phrases.length, 0);

  return (
    <div className={`python-help ${open ? "open" : ""}`}>
      <button type="button" className="python-help-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <b>파이썬으로 어떻게 쓸까?</b>
          <small>내 순서를 코드로 옮길 때 찾아보세요</small>
        </span>
        <i aria-hidden="true">{open ? "닫기 ▲" : "열기 ▼"}</i>
      </button>

      {open && (
        <div className="python-help-body">
          <label className="phrase-search">
            <span className="sr-only">하고 싶은 일로 찾기</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 반복, 나머지, 입력, 조건…"
            />
          </label>

          {total === 0 && <p className="phrase-empty">찾는 말이 없어요. “입력”, “반복”, “나머지”처럼 짧게 적어 보세요.</p>}

          {groups.map((group) => (
            <section key={group.title} className="phrase-group">
              <h4><span aria-hidden="true">{group.icon}</span> {group.title}</h4>
              {group.phrases.map((phrase) => (
                <div key={phrase.want} className="phrase-row">
                  <p className="phrase-want">{phrase.want}</p>
                  <pre><code>{phrase.code}</code></pre>
                  <p className="phrase-note">{phrase.note}</p>
                </div>
              ))}
            </section>
          ))}

          <p className="phrase-footer">
            여기 있는 건 표현일 뿐이에요. 어떤 표현을 어떤 차례로 쓸지는 내가 찾은 해결 순서가 정해 줘요.
          </p>
        </div>
      )}
    </div>
  );
}
