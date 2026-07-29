import { useState } from "react";

export function ButtonSimulator() {
  const sequence=[1,3,2,1,2,3,1];
  const notes=[
    "첫째 자리에서 1은 틀림 → 1번 누르고 초기화",
    "첫째 자리에서 3도 틀림 → 1번 누르고 초기화",
    "첫째 자리 정답은 2! 다음 자리로 진행",
    "둘째 자리를 시험하려고 2부터 다시 누른 뒤 1을 누름 → 틀려서 초기화",
    "알아낸 첫째 자리 2를 다시 누름",
    "둘째 자리 정답 3! 다음 자리로 진행",
    "남은 버튼 1을 눌러 비밀번호 완성!"
  ];
  const [step,setStep]=useState(0);
  const [message,setMessage]=useState("아래의 ‘최악 순서’를 보며 1부터 눌러 보세요.");
  const currentAttempt=step<=0?[]:step<=2?[]:step===3?[2]:step===4?[]:sequence.slice(4,step);
  function press(value:number){
    if(step>=sequence.length) return;
    if(value!==sequence[step]) {
      setMessage(`지금은 ${sequence[step]}을 눌러 보세요. 최악의 경우를 한 단계씩 따라가는 중이에요.`);
      return;
    }
    setMessage(notes[step]);
    setStep(step+1);
  }
  return <div className="button-sim">
    <div className="sim-top">
      <div><span>숨은 비밀번호</span><strong>2 · 3 · 1</strong></div>
      <div><span>지금까지 누른 횟수</span><strong>{step} / 7</strong></div>
    </div>
    <div className="attempt-row"><span>현재 시도</span>
      <div>{[0,1,2].map(i=><b key={i} className={currentAttempt[i]?"filled":""}>{currentAttempt[i]||"?"}</b>)}</div>
    </div>
    <div className="sim-buttons">{[1,2,3].map(x=><button key={x} onClick={()=>press(x)} disabled={step===7}>{x}</button>)}</div>
    <p className="sim-message">{step===7?"🎉 총 7번! 틀린 버튼만 센 것이 아니라, 다시 누른 앞자리도 모두 셌어요.":message}</p>
    <div className="sequence-strip"><span>최악 순서</span>{sequence.map((x,i)=><b key={i} className={i<step?"passed":i===step?"now":""}>{x}</b>)}</div>
    <div className="candidate-cards">
      <div><span>첫째 자리</span><b>후보 3개</b><em>정답 전 최대 2개 틀림</em></div>
      <div className={step>=3?"focus":""}><span>둘째 자리</span><b>후보 2개</b><em>정답 전 최대 1개 틀림</em></div>
      <div><span>셋째 자리</span><b>후보 1개</b><em>틀릴 수 없음</em></div>
    </div>
    <button className="sim-reset" onClick={()=>{setStep(0);setMessage("아래의 ‘최악 순서’를 보며 1부터 눌러 보세요.")}}>처음부터 다시 하기</button>
  </div>
}

export function ButtonRuleExplorer() {
  const [size,setSize]=useState(3);
  const [focus,setFocus]=useState(2);
  const rows=Array.from({length:size-1},(_,i)=>{
    const position=i+1;
    const wrong=size-position;
    return {position,wrong,presses:position,extra:position*wrong};
  });
  const total=size+rows.reduce((sum,row)=>sum+row.extra,0);
  const totals=Array.from({length:5},(_,i)=>{
    const value=i+2;
    const answer=value+Array.from({length:value-1},(_,j)=>(j+1)*(value-j-1)).reduce((a,b)=>a+b,0);
    return {value,answer};
  });
  const active=rows.find(row=>row.position===Math.min(focus,size-1))||rows[0];
  const n3Example=active.position===2&&size===3;
  return <div className="rule-explorer">
    <div className="rule-intro">
      <div><span>규칙 실험실</span><h3>버튼 수를 바꾸면 무엇이 달라질까요?</h3><p>표의 한 줄을 눌러 실제로 어떤 버튼을 누르는지 살펴보세요.</p></div>
      <label>버튼 수 n <strong>{size}</strong><input aria-label="버튼 수 n" type="range" min="2" max="6" value={size} onChange={e=>{const value=+e.target.value;setSize(value);setFocus(Math.min(focus,value-1))}}/></label>
    </div>
    <div className="why-candidates">
      <b>왜 {active.wrong}번까지 틀릴 수 있을까요?</b>
      <p>버튼 {size}개 중 앞자리 정답 {active.position-1}개를 이미 찾았어요. 시험할 후보는 <strong>{size-(active.position-1)}개</strong>가 남습니다. 가장 오래 걸리는 경우에는 정답을 맨 마지막에 누르므로, 그전에 오답 후보 <strong>{active.wrong}개</strong>를 모두 눌러 볼 수 있어요.</p>
      <div className="candidate-line">
        {Array.from({length:size},(_,i)=><span key={i} className={i<active.position-1?"known":i===size-1?"answer":""}>{i<active.position-1?"찾은 정답":i===size-1?"마지막 정답":"시험할 오답"}</span>)}
      </div>
    </div>
    <div className="rule-layout">
      <div className="position-table">
        <div className="table-head"><b>찾는 자리</b><b>정답 전 틀림</b><b>한 번에 누름</b><b>그 자리 누름</b></div>
        {rows.map(row=><button key={row.position} className={active.position===row.position?"active":""} onClick={()=>setFocus(row.position)}>
          <span>{row.position}번째</span><span>{size}−{row.position}={row.wrong}번</span><span>{row.position}개</span><strong>{row.wrong}×{row.position}={row.extra}</strong>
        </button>)}
        <div className="finish-row"><span>마지막 성공</span><span>틀림 없음</span><span>{size}개</span><strong>{size}</strong></div>
      </div>
      <div className="press-example">
        <span>{active.position}번째 자리에서 한 번 틀리면</span>
        <div>{Array.from({length:active.position},(_,i)=><b key={i} className={i===active.position-1?"wrong-press":""}>{i===active.position-1?"✕":"✓"}</b>)}</div>
        <p>{active.position-1>0?<>이미 알아낸 앞자리 <strong>{active.position-1}개</strong>를 다시 누르고, 틀린 후보 <strong>1개</strong>를 누릅니다.</>:<>앞자리가 없으므로 틀린 후보 <strong>1개</strong>만 누릅니다.</>}</p>
        <em>{n3Example?"예: 첫째 자리 2를 다시 누르고, 둘째 자리 후보 1을 시험 → [2, 1]":"✓는 이미 알아낸 버튼, ✕는 이번에 시험한 틀린 버튼"}</em>
      </div>
    </div>
    <div className="formula-result">
      <span>n={size}의 최악 횟수</span>
      <div>{rows.map((row,i)=><span key={row.position}>{i>0&&<i>＋</i>}({row.position}×{row.wrong})</span>)}<i>＋</i><span className="finish">{size}</span><b>＝ {total}번</b></div>
      <small>각 자리에서 실패한 누름을 모두 더하고, 마지막에 성공하는 {size}번을 더해요.</small>
    </div>
    <div className="pattern-strip"><b>n을 바꾸며 관찰한 결과</b><div>{totals.map(item=><button key={item.value} className={item.value===size?"active":""} onClick={()=>{setSize(item.value);setFocus(Math.min(focus,item.value-1))}}><span>n={item.value}</span><strong>{item.answer}번</strong></button>)}</div><p>횟수가 일정하게 더해지는 단순 규칙은 아니에요. 그래서 <b>각 자리의 실패 횟수</b>를 따로 계산해 모두 더합니다.</p></div>
    <div className="code-bridge">
      <h3>방금 찾은 규칙을 코드와 연결해 볼까요?</h3>
      <div className="code-link-row"><code>answer = n</code><span>→</span><p>마지막에 비밀번호를 완성하며 누르는 <b>{size}번</b>을 먼저 넣어요.</p></div>
      <div className="code-link-row"><code>for position in range(1, n):</code><span>→</span><p>시험할 자리를 <b>1번째부터 {size-1}번째까지</b> 하나씩 살펴봐요.</p></div>
      <div className="code-link-row active"><code>wrong = n - position</code><span>→</span><p>{active.position}번째 자리에서는 <b>{size}−{active.position}={active.wrong}번</b>까지 틀릴 수 있어요.</p></div>
      <div className="code-link-row active"><code>answer += position * wrong</code><span>→</span><p><b>{active.position}개씩 × {active.wrong}번 = {active.extra}번</b>을 전체에 더해요.</p></div>
      <div className="code-link-row"><code>print(answer)</code><span>→</span><p>모두 더한 최악의 횟수 <b>{total}</b>을 출력해요.</p></div>
    </div>
  </div>
}
