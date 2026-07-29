import { useState } from "react";

export default function CakeSimulator() {
  const [example,setExample]=useState(0);
  const cases=[
    {label:"1–3과 2–4",first:"1–3",second:"2–4",lines:["l13","l24"],meet:true,note:"위↕아래 선과 왼쪽↔오른쪽 선이 가운데에서 만나요."},
    {label:"1–2와 3–4",first:"1–2",second:"3–4",lines:["l12","l34"],meet:false,note:"두 선이 케이크의 서로 다른 가장자리에 있어 만나지 않아요."},
    {label:"1–4와 2–3",first:"1–4",second:"2–3",lines:["l14","l23"],meet:false,note:"이번에도 두 선이 서로 다른 가장자리에 있어 만나지 않아요."}
  ];
  const current=cases[example];
  return <div className="cake-sim">
    <div className="cake-options">{cases.map((item,i)=><button key={item.label} className={i===example?"active":""} onClick={()=>setExample(i)}><span>그림 {i+1}</span><b>{item.label}</b></button>)}</div>
    <div className="cake-work">
      <div className="cake-board" aria-label={`${current.label}, ${current.meet?"두 선이 만남":"두 선이 만나지 않음"}`}>
        <div className="cake-circle">
          <span className="cake-point p1">1</span><span className="cake-point p2">2</span><span className="cake-point p3">3</span><span className="cake-point p4">4</span>
          {current.lines.map((line,i)=><i key={line} className={`cake-line ${line} line-${i+1}`}/>)}
          {current.meet&&<b className="meet-dot">만남!</b>}
        </div>
      </div>
      <div className={`cake-result ${current.meet?"yes":"no"}`}><span>{current.meet?"✓ 가운데에서 만나요":"× 만나지 않아요"}</span><p>{current.note}</p><div><b>첫 번째 선</b><em>{current.first}</em><b>두 번째 선</b><em>{current.second}</em></div></div>
    </div>
    <div className="cake-observe"><b>세 그림을 차례로 눌러 보세요.</b><p>두 선이 만나는 그림과 만나지 않는 그림은 무엇이 다른가요? 선의 길이보다 <strong>점들이 놓인 순서</strong>를 살펴보세요.</p></div>
  </div>
}
