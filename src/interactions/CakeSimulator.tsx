import { useState } from "react";

// 네 점을 시계 방향으로 놓습니다. 1이 위, 2가 오른쪽, 3이 아래, 4가 왼쪽.
const R = 5;
const POINTS = [1, 2, 3, 4].map((id) => {
  const angle = (-90 + (id - 1) * 90) * (Math.PI / 180);
  return { id, x: R * Math.cos(angle), y: R * Math.sin(angle) };
});
const at = (id: number) => POINTS.find((point) => point.id === id)!;

// 두 선분이 실제로 만나는 지점. 네 점이 고르게 놓여 있어 지금은 늘 가운데지만,
// 위치를 바꾸더라도 그림과 판정이 어긋나지 않도록 일반적으로 계산합니다.
function meetingPoint(a: number, b: number, c: number, d: number) {
  const [p1, p2, p3, p4] = [at(a), at(b), at(c), at(d)];
  const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
  const denominator = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denominator) < 1e-9) return null;
  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denominator;
  const u = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / denominator;
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
  return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
}

export default function CakeSimulator() {
  // 예전에는 정해진 그림 3개를 눌러 보기만 했습니다. 네 점으로 만들 수 있는 짝짓기가
  // 정확히 그 3가지라, 학생이 직접 두 점을 이어 같은 3가지에 스스로 닿게 했습니다.
  const [picked, setPicked] = useState<number[]>([]);

  const first = picked.length === 2 ? picked : null;
  const second = first ? POINTS.map((point) => point.id).filter((id) => !first.includes(id)) : null;
  const meet = first && second ? meetingPoint(first[0], first[1], second[0], second[1]) : null;

  // 문제의 규칙 그대로: 첫 선의 두 번호 사이에 둘째 선의 점이 하나만 있으면 만납니다.
  const start = first ? Math.min(...first) : 0;
  const end = first ? Math.max(...first) : 0;
  const inside = second ? second.map((id) => ({ id, between: start < id && id < end })) : [];

  function tap(id: number) {
    if (picked.length >= 2) { setPicked([id]); return; }
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  }

  return (
    <div className="cake-sim">
      <div className="cake-instruction">
        <b>가장자리의 점 두 개를 눌러 첫 번째 선을 그어 보세요.</b>
        <p>남은 두 점은 자동으로 이어져 두 번째 선이 돼요. 세 가지 짝짓기를 모두 시험해 보세요.</p>
      </div>

      <div className="cake-work">
        <div className="cake-board">
          <svg className="cake-svg" viewBox="-7.6 -7.6 15.2 15.2" role="img"
            aria-label={first && second ? `${first[0]}–${first[1]} 선과 ${second[0]}–${second[1]} 선은 ${meet ? "가운데에서 만나요" : "만나지 않아요"}` : "케이크 가장자리의 점 두 개를 골라 첫 번째 선을 그어 보세요"}>
            <circle className="cake-body" cx={0} cy={0} r={R} />
            {first && <line className="cake-chord first" x1={at(first[0]).x} y1={at(first[0]).y} x2={at(first[1]).x} y2={at(first[1]).y} />}
            {second && <line className="cake-chord second" x1={at(second[0]).x} y1={at(second[0]).y} x2={at(second[1]).x} y2={at(second[1]).y} />}
            {meet && <circle className="cake-meet" cx={meet.x} cy={meet.y} r={0.55} />}
            {POINTS.map((point) => (
              <g key={point.id} className={`cake-dot ${picked.includes(point.id) ? "picked" : ""} ${second?.includes(point.id) ? "auto" : ""}`}
                onClick={() => tap(point.id)} role="button" tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tap(point.id); } }}
                aria-label={`${point.id}번 점`}>
                <circle cx={point.x} cy={point.y} r={0.95} />
                <text x={point.x} y={point.y + 0.34} textAnchor="middle">{point.id}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="cake-panel">
          {!first && <div className="cake-waiting">점 두 개를 고르면 결과가 나와요.</div>}
          {first && second && (
            <>
              <div className="cake-lines">
                <div><span>첫 번째 선</span><b>{first[0]}–{first[1]}</b></div>
                <div><span>두 번째 선</span><b>{second[0]}–{second[1]}</b></div>
              </div>
              <div className="between-check">
                <span>첫 선의 두 번호 <b>{start}</b>과 <b>{end}</b> 사이에 있나요?</span>
                {inside.map((item) => (
                  <div key={item.id} className={item.between ? "yes" : "no"}>
                    <b>{item.id}번 점</b><em>{item.between ? "사이에 있어요" : "사이에 없어요"}</em>
                  </div>
                ))}
                <small>{inside.filter((item) => item.between).length === 1 ? "한 점만 사이에 있어요" : "두 점이 모두 같은 쪽에 있어요"}</small>
              </div>
              <div className={`cake-result ${meet ? "yes" : "no"}`}>
                <span>{meet ? "✓ 가운데에서 만나요" : "× 만나지 않아요"}</span>
                <p>{meet
                  ? "둘째 선의 두 점이 첫 선의 서로 다른 쪽에 있어서, 선을 그으면 첫 선을 지나가게 돼요."
                  : "둘째 선의 두 점이 첫 선의 같은 쪽에 있어서, 첫 선을 넘지 않아요."}</p>
              </div>
            </>
          )}
          <button type="button" className="cake-reset" onClick={() => setPicked([])}>다시 고르기</button>
        </div>
      </div>

      <div className="cake-observe">
        <b>세 가지를 모두 해 보았나요?</b>
        <p>만나는 짝짓기와 만나지 않는 짝짓기는 무엇이 다른가요? 선의 길이보다 <strong>점 번호가 사이에 있는지</strong>를 살펴보세요.</p>
      </div>
    </div>
  );
}
