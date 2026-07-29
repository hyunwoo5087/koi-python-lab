import { useState } from "react";
import type { Problem } from "../data/problems";
import { strategyGuides } from "../data/guides";

export default function GeneralStrategyExplorer({p}:{p:Problem}) {
  const guide=strategyGuides[p.id];
  const [example,setExample]=useState(0);
  const current=guide.examples[example];
  const lines=p.code.split("\n");
  return <div className="general-explorer">
    <div className="explorer-title"><span>예시·규칙·코드 연결</span><h3>값을 바꾸며 해결 방법을 찾아봐요</h3><p>{guide.why}</p></div>
    <div className="example-tabs">{guide.examples.map((item,i)=><button key={item.label} className={i===example?"active":""} onClick={()=>setExample(i)}><span>예시 {i+1}</span><b>{item.label}</b></button>)}</div>
    <div className="example-work">
      <div className="input-output"><div><span>입력</span><strong>{current.input}</strong></div><i>→</i><div><span>출력</span><strong>{current.output}</strong></div></div>
      <div className="thinking-steps">{current.work.map((work,i)=><div key={work}><span>{i+1}</span><p>{work}</p>{i<current.work.length-1&&<i>↓</i>}</div>)}</div>
    </div>
    <div className="compare-note"><b>세 예시에서 찾을 규칙</b><p>{guide.compare}</p></div>
    <div className="mini-code-bridge"><h3>이 생각이 코드의 어디에 들어갈까요?</h3>{lines.map((line,i)=><button key={`${line}-${i}`}><code>{line}</code><span>→</span><p>{guide.codeNotes[i]||"앞에서 찾은 규칙을 코드로 옮긴 부분이에요."}</p></button>)}</div>
    <div className="self-check"><span>내 말로 설명하기</span><p>“입력에서 무엇을 구하고, 어떤 규칙으로 출력했는지” 코드를 가린 채 설명해 보세요.</p></div>
  </div>
}
