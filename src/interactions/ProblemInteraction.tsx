import { useState } from "react";
import type { CSSProperties } from "react";
import type { Problem } from "../data/problems";

// public/ assets must be prefixed with the deploy base (e.g. /koi-python-lab/ on GitHub Pages).
const puzzlePiece = `${import.meta.env.BASE_URL}assets/puzzle-piece.png`;

function RangeControl({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(value:number)=>void}) {
  return <label className="range-control"><span>{label}</span><b>{value}</b><input aria-label={label} type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}/></label>
}

function DiamondTiling({size,pivot}:{size:number;pivot:number}) {
  const width=size*60, height=104;
  const triangles:{id:string;points:string;group:number}[]=[];
  let group=0;
  const groups:Record<string,number>={};
  groups[`ta${pivot}`]=group; groups[`ba${pivot}`]=group++;
  for(let i=0;i<pivot;i++) {
    groups[`ta${i}`]=group; groups[`tb${i}`]=group++;
    groups[`ba${i}`]=group; groups[`bb${i}`]=group++;
  }
  for(let i=pivot+1;i<size;i++) {
    groups[`ta${i}`]=group; groups[`tb${i-1}`]=group++;
    groups[`ba${i}`]=group; groups[`bb${i-1}`]=group++;
  }
  for(let i=0;i<size;i++) {
    triangles.push({id:`ta${i}`,points:`${60*i},52 ${60*i+30},0 ${60*i+60},52`,group:groups[`ta${i}`]});
    triangles.push({id:`ba${i}`,points:`${60*i},52 ${60*i+30},104 ${60*i+60},52`,group:groups[`ba${i}`]});
    if(i<size-1) {
      triangles.push({id:`tb${i}`,points:`${60*i+30},0 ${60*i+90},0 ${60*i+60},52`,group:groups[`tb${i}`]});
      triangles.push({id:`bb${i}`,points:`${60*i+30},104 ${60*i+90},104 ${60*i+60},52`,group:groups[`bb${i}`]});
    }
  }
  const colors=["#ef5b62","#5662e8","#54bd70","#f4bd45","#9b65cf","#38a7a0","#f08a5d","#4a90d9","#e9688a"];
  return <svg className="diamond-svg" viewBox={`-3 -3 ${width+6} ${height+6}`} role="img" aria-label={`정삼각형 ${4*size-2}개를 다이아몬드로 묶은 ${pivot+1}번째 방법`}>
    {triangles.map(t=><polygon key={t.id} points={t.points} fill={colors[t.group%colors.length]} stroke="#2f3b46" strokeWidth="1.5"/>)}
  </svg>
}

function makeLampEdges(width:number,height:number) {
  const path:number[]=[];
  for(let row=0;row<height;row++) {
    const cols=Array.from({length:width},(_,i)=>row%2===0?i:width-1-i);
    cols.forEach(col=>path.push(row*width+col));
  }
  const edges:[number,number][]=[];
  for(let i=0;i+1<path.length;i+=2) edges.push([path[i],path[i+1]]);
  if(path.length===1) edges.push([path[0],path[0]]);
  if(path.length%2===1&&path.length>1) edges.push([path[path.length-2],path[path.length-1]]);
  return edges;
}

function puzzleStartTurns(width:number,height:number) {
  if(height===1) return Array(width).fill(3);
  if(width===1) return Array(height).fill(0);
  if(width===2&&height===2) return [3,0,2,1];
  return Array.from({length:width*height},(_,i)=>i%4);
}

function puzzleMatches(width:number,height:number,turns:number[]) {
  const hollow=(index:number)=>(2+(turns[index]||0))%4;
  let matched=0;
  for(let row=0;row<height;row++) for(let col=0;col<width;col++) {
    const here=row*width+col;
    if(col<width-1) {
      const right=here+1;
      if((hollow(here)===1)!==(hollow(right)===3)) matched++;
    }
    if(row<height-1) {
      const below=here+width;
      if((hollow(here)===2)!==(hollow(below)===0)) matched++;
    }
  }
  return matched;
}

export default function ProblemInteraction({p}:{p:Problem}) {
  const [a,setA]=useState(p.id==="H"?75:p.id==="K"?80:3);
  const [b,setB]=useState(p.id==="J"?4:3);
  const [pieceTurns,setPieceTurns]=useState<number[]>([]);
  const [method,setMethod]=useState(0);
  if(p.id==="A") return <div className="hands-lab"><div className="quick-values">{[-7,0,15,99].map(v=><button key={v} className={a===v?"active":""} onClick={()=>setA(v)}>{v}</button>)}</div><div className="value-journey"><div><span>키보드에서 들어온 값</span><b>{a}</b></div><i>→</i><div className="memory-box"><span>n이라는 상자에 보관</span><b>{a}</b></div><i>→</i><div><span>화면에 나온 값</span><b>{a}</b></div></div><p className="lab-coach">어떤 수를 눌러도 들어온 값과 나온 값이 같나요?</p></div>;
  if(p.id==="B") {
    const chosen=Math.min(method,a-1);
    return <div className="hands-lab diamond-lab"><RangeControl label="도형의 길이 n" value={a} min={1} max={6} onChange={value=>{setA(value);setMethod(0)}}/><div className="triangle-count"><span>도형을 이루는 정삼각형</span><b>4×{a}−2 = {4*a-2}개</b><small>삼각형 2개를 붙이면 다이아몬드 1개가 돼요.</small></div><div className="selected-tiling"><span>{chosen+1}번째 채우기 방법</span><DiamondTiling size={a} pivot={chosen}/></div><div className="tiling-tabs">{Array.from({length:a},(_,i)=><button key={i} className={chosen===i?"active":""} onClick={()=>setMethod(i)}><DiamondTiling size={a} pivot={i}/><b>방법 {i+1}</b></button>)}</div><div className="live-rule"><span>도형의 길이</span><b>{a}</b><i>→</i><span>서로 다른 채우기</span><b>{a}가지</b></div><p className="lab-coach">방법 버튼을 차례로 눌러 보세요. 위쪽과 아래쪽 삼각형을 세로로 붙인 자리가 왼쪽에서 오른쪽으로 한 칸씩 움직여요.</p></div>
  }
  if(p.id==="C") {
    const divisor=Math.max(1,b);
    return <div className="hands-lab"><div className="two-controls"><RangeControl label="첫째 수 a" value={a} min={1} max={12} onChange={setA}/><RangeControl label="둘째 수 b" value={divisor} min={1} max={6} onChange={setB}/></div><div className="calc-grid">{[["더하기",a+divisor],["빼기",a-divisor],["곱하기",a*divisor],["몫",Math.floor(a/divisor)],["나머지",a%divisor],["나눗셈",(a/divisor).toFixed(2)]].map(([name,value])=><div key={name}><span>{name}</span><b>{value}</b></div>)}</div><p className="lab-coach">{a}개를 {divisor}개씩 묶으면 {Math.floor(a/divisor)}묶음이고 {a%divisor}개가 남아요.</p></div>
  }
  if(p.id==="D") {
    const total=a*b, edges=makeLampEdges(a,b), lamps=edges.length;
    const coveredBy=Array(total).fill(-1);
    edges.forEach((edge,index)=>edge.forEach(cell=>{if(coveredBy[cell]===-1) coveredBy[cell]=index}));
    return <div className="hands-lab lamp-lab"><div className="two-controls"><RangeControl label="가로 칸" value={a} min={1} max={5} onChange={setA}/><RangeControl label="세로 칸" value={b} min={1} max={5} onChange={setB}/></div><div className="lamp-explain"><span>가로등은 모서리 점이 아니라 <b>두 칸 사이의 선</b>에 놓아요.</span><span className="lamp-dot">●</span><span>가로등 하나가 양쪽 <b>두 칸</b>을 밝혀요.</span></div><div className="park-board" style={{"--park-cols":a,"--park-rows":b} as CSSProperties}><div className="park-cells">{Array.from({length:total},(_,i)=><span key={i} className={`light-group-${coveredBy[i]%6}`}>{i+1}</span>)}</div>{edges.map(([first,second],i)=>{const r1=Math.floor(first/a),c1=first%a,r2=Math.floor(second/a),c2=second%a;const horizontal=r1===r2;const left=horizontal?(Math.min(c1,c2)+1)/a*100:(c1+.5)/a*100;const top=horizontal?(r1+.5)/b*100:(Math.min(r1,r2)+1)/b*100;return <span key={`${first}-${second}`} className={`edge-lamp ${horizontal?"vertical-edge":"horizontal-edge"}`} style={{left:`${left}%`,top:`${top}%`}}>●</span>})}</div><div className="lamp-math"><div><span>전체 칸</span><b>{total}칸</b></div><i>두 칸씩 짝짓기</i><div><span>가장 적은 가로등</span><b>{lamps}개</b></div></div><p className="lab-coach">{total%2?`마지막 한 칸은 이웃 칸과 한 번 더 함께 밝혀야 해서 ${lamps}개가 필요해요.`:"모든 칸을 두 칸씩 짝지어 밝힐 수 있어요."}</p></div>
  }
  if(p.id==="E") {
    const count=Math.ceil(a/2);
    return <div className="hands-lab"><RangeControl label="가장 긴 막대 n" value={a} min={1} max={9} onChange={setA}/><div className="pairing-board">{Array.from({length:a},(_,i)=><span key={i} style={{width:`${45+(i+1)*20}px`}}><b>{i+1}</b></span>)}</div><div className="live-rule"><span>막대 {a}개</span><i>→</i><span>같은 길이로 만들 수 있는 수</span><b>{count}개</b></div><p className="lab-coach">{a%2?"가운데 막대 하나가 남아 그것도 한 개로 세어요.":"막대를 둘씩 짝지을 수 있어요."}</p></div>
  }
  if(p.id==="F") {
    const kg=a, jars=Math.ceil(kg/5), full=Math.floor(kg/5);
    return <div className="hands-lab"><RangeControl label="고추장 무게(kg)" value={kg} min={0} max={25} onChange={setA}/><div className="jar-board">{Array.from({length:jars},(_,i)=>{const amount=Math.min(5,kg-i*5);return <div key={i}><span>🏺</span><b>{amount}kg</b><i style={{height:`${amount/5*100}%`}}/></div>})}</div><div className="split-results"><div><span>담는 데 필요한 항아리</span><b>{jars}개</b></div><div><span>꽉 차서 팔 수 있는 항아리</span><b>{full}개 · {full*150000}원</b></div></div></div>
  }
  if(p.id==="G") {
    // 예전 예시는 100kg과 100억kg이 둘 다 5의 배수라, 두 답이 똑같이 나와 이 문제가 다루는
    // "꽉 찬 것만 판다"는 차이가 보이지 않았습니다. 나머지가 남는 수로 바꾸고, 파이썬 식
    // 대신 5kg씩 담는 실제 상황으로 보여 줍니다. (코드는 해결 전략 단계에서 만나요.)
    const values=[12,103,10000000003], kg=values[Math.min(a,2)];
    const full=Math.floor(kg/5), left=kg%5, jars=full+(left?1:0);
    const seconds=Math.round(full/5);
    return <div className="hands-lab"><div className="quick-values">{values.map((v,i)=><button key={v} className={Math.min(a,2)===i?"active":""} onClick={()=>setA(i)}>{v.toLocaleString()}kg</button>)}</div>
      <div className="jar-fill-story">
        <div><span>5kg씩 꽉 채우면</span><b>{full.toLocaleString()}항아리</b><small>이건 팔 수 있어요</small></div>
        <i>＋</i>
        <div className={left?"leftover":"leftover none"}><span>남는 고추장</span><b>{left}kg</b><small>{left?"덜 찬 항아리 1개가 더 필요해요":"남는 것이 없어요"}</small></div>
        <i>＝</i>
        <div className="total"><span>필요한 항아리</span><b>{jars.toLocaleString()}개</b><small>파는 건 {full.toLocaleString()}개뿐</small></div>
      </div>
      <div className="counting-race">
        <div className="slow"><span>5씩 하나하나 세면</span><b>{full.toLocaleString()}번</b><small>{seconds>60?`1초에 5번 세어도 ${Math.round(seconds/60/60/24/365).toLocaleString()}년 넘게 걸려요`:"셀 수 있어요"}</small></div>
        <i>↔</i>
        <div className="fast"><span>나눗셈으로 구하면</span><b>1번</b><small>수가 아무리 커져도 똑같아요</small></div>
      </div>
      <p className="lab-coach">{left?`${kg.toLocaleString()}kg은 5로 나누어떨어지지 않아요. 남은 ${left}kg 때문에 항아리는 하나 더 필요하지만, 그 항아리는 팔 수 없어요.`:`${kg.toLocaleString()}kg은 5로 딱 나누어떨어져서 필요한 항아리와 파는 항아리가 같아요.`}</p></div>
  }
  if(p.id==="H") {
    const grade=a>=90?"A":a>=70?"B":a>=40?"C":"D";
    return <div className="hands-lab"><RangeControl label="점수" value={a} min={0} max={100} onChange={setA}/><div className="grade-track"><span className={grade==="D"?"on":""}>0~39<b>D</b></span><span className={grade==="C"?"on":""}>40~69<b>C</b></span><span className={grade==="B"?"on":""}>70~89<b>B</b></span><span className={grade==="A"?"on":""}>90~100<b>A</b></span></div><div className="result-bubble"><span>{a}점이 들어간 칸</span><b>{grade} 등급</b></div><p className="lab-coach">점수를 움직여 등급이 바뀌는 경계인 40, 70, 90을 찾아보세요.</p></div>
  }
  if(p.id==="I") {
    const possible=a===1||b===1||(a===2&&b===2);
    const turns=pieceTurns.length===a*b?pieceTurns:puzzleStartTurns(a,b);
    const needed=(a-1)*b+(b-1)*a,available=a*b,matched=puzzleMatches(a,b,turns);
    const changeSize=(setter:(value:number)=>void)=>(value:number)=>{setter(value);setPieceTurns(puzzleStartTurns(setter===setA?value:a,setter===setB?value:b))};
    const rotate=(index:number)=>setPieceTurns(turns.map((turn,i)=>i===index?(turn+1)%4:turn));
    return <div className="hands-lab puzzle-workbench"><div className="piece-anatomy"><img src={puzzlePiece} alt="튀어나온 부분 세 개와 들어간 부분 한 개가 있는 퍼즐 조각"/><div><b>조각 하나를 먼저 관찰해요</b><span>튀어나온 곳(볼록) <strong>3개</strong></span><span>들어간 곳(오목) <strong>1개</strong></span><small>조각을 눌러 90도씩 돌릴 수 있어요.</small></div></div><div className="two-controls"><RangeControl label="가로 칸 수" value={a} min={1} max={5} onChange={changeSize(setA)}/><RangeControl label="세로 칸 수" value={b} min={1} max={5} onChange={changeSize(setB)}/></div><div className="connection-count"><div><span>가지고 있는 조각</span><b>{available}개</b><small>들어간 곳도 {available}개</small></div><i>↔</i><div className={needed>available?"short":""}><span>조각끼리 만나는 곳</span><b>{needed}곳</b><small>{needed>available?`${needed-available}곳이 부족해요`:"들어간 곳으로 이을 수 있어요"}</small></div></div><div className="real-puzzle-board-wrap"><div className="board-title"><span>{a}×{b} 퍼즐판</span><b>조각을 눌러 돌려 보세요</b></div><div className="real-puzzle-board" style={{"--piece-columns":a} as CSSProperties}>{turns.map((turn,i)=><button key={`${a}-${b}-${i}`} aria-label={`${i+1}번 퍼즐 조각 돌리기`} onClick={()=>rotate(i)}><img src={puzzlePiece} alt="" style={{transform:`rotate(${turn*90}deg)`}}/></button>)}</div><div className="match-meter"><span>지금 튀어나온 곳＋들어간 곳이 맞은 연결</span><b>{matched} / {needed}곳</b></div></div><div className={`puzzle-verdict ${possible?"possible":"impossible"}`}><strong>{possible?"YES · 완성할 수 있어요":"NO · 완성할 수 없어요"}</strong><p>{possible?needed<available?"조각끼리 만나는 곳보다 들어간 곳이 더 많아서 연결할 수 있어요.":"들어간 곳을 하나씩 사용하면 모든 연결을 만들 수 있어요.":`연결은 ${needed}곳인데 들어간 곳은 ${available}개뿐이에요.`}</p></div><p className="lab-coach">왜 한 줄과 2×2만 될까요? 조각 수와 ‘조각끼리 만나는 곳’의 수를 비교해 보세요.</p></div>
  }
  if(p.id==="J") {
    const x=a,y=b,d=x*x+y*y,status=d<25?"원 안":d===25?"원 둘레":"원 밖";
    const where=d<25?"is-inside":d===25?"is-edge":"is-outside";
    // 예전에는 원을 div로 그리고 나무를 left/top 퍼센트로 놓았는데, 테두리 5px 때문에
    // 퍼센트의 기준(안쪽 상자)과 눈에 보이는 원의 반지름이 어긋났습니다. 그래서 (1,5)처럼
    // 살짝 바깥인 점이 테두리 한가운데 찍혀 "원 안"처럼 보였습니다. 원과 점을 같은
    // 좌표계에 그리는 SVG로 바꿔, 보이는 위치와 계산 결과가 항상 일치하게 했습니다.
    const grid=[-8,-6,-4,-2,2,4,6,8];
    return <div className="hands-lab"><div className="two-controls"><RangeControl label="나무의 가로 위치 x" value={x} min={0} max={7} onChange={setA}/><RangeControl label="나무의 세로 위치 y" value={y} min={0} max={7} onChange={setB}/></div><div className="tree-legend"><span className="inside-key">초록색 안쪽</span><span className="edge-key">굵은 선 = 원 둘레</span><span className="outside-key">회색 바깥쪽</span></div><div className="tree-lab"><div className="tree-plot">
      <svg className={`tree-svg ${where}`} viewBox="-8.8 -8.8 17.6 17.6" role="img" aria-label={`중심에서 가로 ${x}, 세로 ${y}만큼 떨어진 나무는 ${status}에 있어요`}>
        {grid.map(v=><g key={v}><line className="tree-grid" x1={v} y1={-8.8} x2={v} y2={8.8}/><line className="tree-grid" x1={-8.8} y1={v} x2={8.8} y2={v}/></g>)}
        <circle className="tree-area" cx={0} cy={0} r={5}/>
        <line className="tree-radius" x1={0} y1={0} x2={5} y2={0}/>
        <text className="tree-radius-label" x={2.5} y={1.5} textAnchor="middle">반지름 5</text>
        <line className="tree-distance" x1={0} y1={0} x2={x} y2={-y}/>
        <circle className="tree-origin" cx={0} cy={0} r={0.42}/>
        <text className="tree-origin-label" x={0} y={-0.9} textAnchor="middle">중심</text>
        <text className="tree-icon" x={x} y={-y-0.85} textAnchor="middle">🌳</text>
        <circle className="tree-point" cx={x} cy={-y} r={0.42}/>
      </svg>
    </div><div className="distance-card"><span>중심에서 나무까지와 반지름 비교</span><b>{x}² + {y}² = {d}</b><b>반지름 5² = 25</b><strong className={d<25?"inside":d===25?"on-circle":"outside"}>{status}</strong><small>{d<25?"빨간 점이 굵은 원 안쪽에 있어요.":d===25?"빨간 점이 굵은 원 선 위에 정확히 있어요.":"빨간 점이 굵은 원 선보다 바깥에 있어요."}</small></div></div></div>
  }
  if(p.id==="K") {
    const total=17*60+40+a,hour=Math.floor(total/60)%24,minute=total%60;
    return <div className="hands-lab oven-lab"><RangeControl label="오븐 요리 시간(분)" value={a} min={0} max={180} onChange={setA}/><div className="time-flow"><div><span>오븐 시작</span><b>17:40</b></div><i>🔥 ＋ {a}분</i><div><span>요리 완성</span><b>{String(hour).padStart(2,"0")}:{String(minute).padStart(2,"0")}</b></div></div><p className="lab-coach">오븐 시간이 60분을 넘을 때 끝나는 시각이 어떻게 바뀌는지 살펴보세요.</p></div>
  }
  if(p.id==="L") return <div className="hands-lab"><RangeControl label="N" value={a} min={1} max={8} onChange={setA}/><div className="star-lab"><b>{"★".repeat(2*a-1)}</b><span>2×{a}−1 = {2*a-1}개</span></div><p className="lab-coach">N이 1 커질 때 별은 몇 개 늘어나나요?</p></div>;
  if(p.id==="M") return <div className="hands-lab"><RangeControl label="층 수 N" value={a} min={1} max={7} onChange={setA}/><div className="triangle-lab">{Array.from({length:a},(_,i)=><div key={i}><span>{i+1}층</span><b>{"★".repeat(i+1)}</b></div>)}</div><p className="lab-coach">층 번호와 그 줄의 별 개수를 비교해 보세요.</p></div>;
  return <div/>;
}
