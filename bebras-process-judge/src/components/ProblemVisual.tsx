import type { Problem, VisualSpec } from '../types'
import { PathDrawBoard } from './process/PathDrawBoard'

export function ProblemVisual({
  visual,
  problem,
}: {
  visual: VisualSpec
  /** 'grid' 그림을 쓸 때 격자를 찾기 위해 넘깁니다. */
  problem?: Problem
}) {
  if (visual.type === 'none') return null
  if (visual.type === 'grid') {
    const board = problem?.processSteps.find((step) => step.path)?.path
    if (!board) return <div className="visual-placeholder">격자 정보가 있는 과정 문항이 없습니다.</div>
    return (
      <figure className="grid-problem-visual">
        <PathDrawBoard board={board} cells={[]} onChange={() => undefined} readOnly />
        <figcaption>{visual.alt ?? 'S에서 G까지 가는 격자입니다. × 칸은 지나갈 수 없습니다.'}</figcaption>
      </figure>
    )
  }
  if (visual.type === 'custom') {
    return visual.src ? (
      <figure className="custom-problem-visual">
        <img src={visual.src} alt={visual.alt || '문제 그림'} />
      </figure>
    ) : (
      <div className="visual-placeholder">등록된 문제 그림이 없습니다.</div>
    )
  }
  if (visual.type === 'waterpark') return <WaterparkVisual />
  if (visual.type === 'route') return <RouteVisual />
  if (visual.type === 'robot') return <RobotVisual />
  if (visual.type === 'pattern') return <PatternVisual />
  return <NetworkVisual />
}

function WaterparkVisual() {
  return (
    <svg className="problem-visual" viewBox="0 0 720 300" role="img" aria-label="워터파크 입구와 안젤라, 프레드">
      <defs>
        <linearGradient id="waterSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dff5ff" />
          <stop offset="1" stopColor="#f8fcff" />
        </linearGradient>
      </defs>
      <rect width="720" height="300" rx="24" fill="url(#waterSky)" />
      <circle cx="650" cy="55" r="28" fill="#ffd65a" />
      <path d="M0 230 Q130 190 260 230 T520 225 T720 220 V300 H0Z" fill="#99e1d9" />
      <path d="M350 238 C390 180 438 151 486 147 C535 143 575 163 613 213" fill="none" stroke="#1aa8d5" strokeWidth="22" strokeLinecap="round" />
      <path d="M350 238 C390 180 438 151 486 147 C535 143 575 163 613 213" fill="none" stroke="#e9fbff" strokeWidth="5" strokeDasharray="9 10" />
      <rect x="55" y="75" width="230" height="155" rx="18" fill="#ffffff" stroke="#2a73c5" strokeWidth="5" />
      <rect x="87" y="103" width="165" height="49" rx="12" fill="#1d4ed8" />
      <text x="169" y="135" textAnchor="middle" fontSize="21" fontWeight="800" fill="white">WATER PARK</text>
      <rect x="125" y="164" width="88" height="66" fill="#dbeafe" stroke="#2a73c5" strokeWidth="4" />
      <line x1="169" y1="164" x2="169" y2="230" stroke="#2a73c5" strokeWidth="3" />
      <g transform="translate(330 86)">
        <circle cx="45" cy="42" r="29" fill="#f1c49f" />
        <path d="M18 41 Q21 4 47 8 Q78 10 76 43 Q63 25 47 27 Q30 30 18 41" fill="#713f2d" />
        <rect x="19" y="74" width="55" height="82" rx="20" fill="#2563eb" />
        <line x1="29" y1="154" x2="23" y2="206" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
        <line x1="65" y1="154" x2="72" y2="206" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
        <line x1="18" y1="96" x2="0" y2="145" stroke="#f1c49f" strokeWidth="12" strokeLinecap="round" />
        <line x1="75" y1="96" x2="95" y2="139" stroke="#f1c49f" strokeWidth="12" strokeLinecap="round" />
        <rect x="5" y="214" width="87" height="34" rx="12" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
        <text x="49" y="237" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1e3a8a">안젤라 12세</text>
      </g>
      <g transform="translate(470 122)">
        <circle cx="38" cy="34" r="24" fill="#f2c49f" />
        <path d="M14 35 Q16 7 38 8 Q61 8 62 36 Q48 21 36 23 Q25 24 14 35" fill="#5b3b28" />
        <rect x="15" y="60" width="46" height="64" rx="17" fill="#ef4444" />
        <line x1="23" y1="122" x2="20" y2="165" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
        <line x1="54" y1="122" x2="61" y2="165" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
        <rect x="0" y="174" width="78" height="31" rx="11" fill="#ffffff" stroke="#ef4444" strokeWidth="3" />
        <text x="39" y="196" textAnchor="middle" fontSize="17" fontWeight="800" fill="#991b1b">프레드 6세</text>
      </g>
    </svg>
  )
}

function RouteVisual() {
  const blocked = new Set(['2-0', '2-1', '1-3', '2-3', '4-3', '4-4'])
  return (
    <svg className="problem-visual" viewBox="0 0 720 300" role="img" aria-label="장애물이 있는 격자 지도와 세 개의 후보 경로">
      <rect width="720" height="300" rx="24" fill="#f8fafc" />
      <g transform="translate(60 28)">
        {Array.from({ length: 6 }).map((_, y) =>
          Array.from({ length: 7 }).map((__, x) => {
            const key = `${x}-${y}`
            return <rect key={key} x={x * 40} y={y * 40} width="40" height="40" fill={blocked.has(key) ? '#64748b' : '#ffffff'} stroke="#cbd5e1" />
          }),
        )}
        <circle cx="20" cy="220" r="15" fill="#16a34a" />
        <text x="20" y="226" textAnchor="middle" fontSize="16" fontWeight="900" fill="white">S</text>
        <circle cx="260" cy="20" r="15" fill="#dc2626" />
        <text x="260" y="26" textAnchor="middle" fontSize="16" fontWeight="900" fill="white">G</text>
        <polyline points="20,220 60,220 100,220 140,220 140,180 140,140 180,140 220,140 220,100 260,100 260,60 260,20" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
      </g>
      <g transform="translate(390 55)">
        <rect width="270" height="190" rx="18" fill="#ffffff" stroke="#dbeafe" strokeWidth="3" />
        <text x="28" y="45" fontSize="22" fontWeight="800" fill="#1e3a8a">후보 경로 비교</text>
        <text x="30" y="88" fontSize="20" fontWeight="700" fill="#2563eb">A · 8번 이동</text>
        <text x="30" y="124" fontSize="20" fontWeight="700" fill="#7c3aed">B · 10번 이동</text>
        <text x="30" y="160" fontSize="20" fontWeight="700" fill="#ea580c">C · 12번 이동</text>
      </g>
    </svg>
  )
}

function RobotVisual() {
  return (
    <svg className="problem-visual" viewBox="0 0 720 300" role="img" aria-label="로봇 이동 격자와 명령 목록">
      <rect width="720" height="300" rx="24" fill="#f8fafc" />
      <g transform="translate(70 28)">
        {Array.from({ length: 5 }).map((_, y) =>
          Array.from({ length: 5 }).map((__, x) => <rect key={`${x}-${y}`} x={x * 48} y={y * 48} width="48" height="48" fill="#ffffff" stroke="#cbd5e1" />),
        )}
        <circle cx="72" cy="216" r="19" fill="#1d4ed8" />
        <path d="M72 188 L59 207 H85Z" fill="#1d4ed8" />
        <text x="72" y="222" textAnchor="middle" fontSize="15" fontWeight="900" fill="white">R</text>
        <text x="72" y="262" textAnchor="middle" fontSize="16" fontWeight="800" fill="#334155">시작 (2,1)</text>
      </g>
      <g transform="translate(365 42)">
        <rect width="285" height="210" rx="18" fill="#ffffff" stroke="#dbeafe" strokeWidth="3" />
        <text x="25" y="43" fontSize="22" fontWeight="900" fill="#1e3a8a">명령</text>
        {['① 앞으로 2칸', '② 오른쪽 회전', '③ 앞으로 1칸', '④ 왼쪽 회전', '⑤ 앞으로 1칸'].map((text, index) => (
          <text key={text} x="28" y={78 + index * 29} fontSize="18" fontWeight="700" fill={index === 2 ? '#dc2626' : '#334155'}>{text}</text>
        ))}
      </g>
    </svg>
  )
}

function PatternVisual() {
  const sequence = ['●', '▲', '▲', '●', '▲', '▲', '●', '▲', '▲', '?']
  return (
    <svg className="problem-visual" viewBox="0 0 720 300" role="img" aria-label="반복되는 원과 삼각형 타일 무늬">
      <rect width="720" height="300" rx="24" fill="#fffaf0" />
      <text x="360" y="75" textAnchor="middle" fontSize="26" fontWeight="900" fill="#78350f">반복되는 가장 작은 묶음을 찾아보세요</text>
      {sequence.map((shape, index) => (
        <g key={`${shape}-${index}`} transform={`translate(${55 + index * 62} 115)`}>
          <rect width="52" height="70" rx="12" fill={index === sequence.length - 1 ? '#fef3c7' : '#ffffff'} stroke="#f59e0b" strokeWidth="3" />
          <text x="26" y="48" textAnchor="middle" fontSize="34" fontWeight="900" fill={shape === '●' ? '#2563eb' : shape === '▲' ? '#ef4444' : '#92400e'}>{shape}</text>
        </g>
      ))}
      <path d="M55 218 H231" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <path d="M241 218 H417" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <path d="M427 218 H603" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <text x="143" y="248" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e3a8a">?</text>
      <text x="329" y="248" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e3a8a">?</text>
      <text x="515" y="248" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e3a8a">?</text>
    </svg>
  )
}

function NetworkVisual() {
  const nodes = [
    { id: 'A', x: 120, y: 85 },
    { id: 'B', x: 75, y: 205 },
    { id: 'C', x: 205, y: 180 },
    { id: 'D', x: 435, y: 180 },
    { id: 'E', x: 565, y: 85 },
    { id: 'F', x: 610, y: 205 },
  ]
  const edges = [
    ['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'D'],
  ]
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]))
  return (
    <svg className="problem-visual" viewBox="0 0 720 300" role="img" aria-label="두 개의 삼각형 묶음이 하나의 선으로 연결된 통신망">
      <rect width="720" height="300" rx="24" fill="#f8fafc" />
      {edges.map(([a, b]) => {
        const first = byId[a]
        const second = byId[b]
        const bridge = a === 'C' && b === 'D'
        return <line key={`${a}-${b}`} x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={bridge ? '#dc2626' : '#64748b'} strokeWidth={bridge ? 10 : 6} strokeLinecap="round" />
      })}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="30" fill="#2563eb" stroke="#ffffff" strokeWidth="5" />
          <text x={node.x} y={node.y + 8} textAnchor="middle" fontSize="24" fontWeight="900" fill="white">{node.id}</text>
        </g>
      ))}
      <rect x="268" y="205" width="180" height="48" rx="16" fill="#fff1f2" stroke="#fecdd3" />
      <text x="358" y="236" textAnchor="middle" fontSize="18" fontWeight="900" fill="#be123c">두 묶음을 잇는 연결</text>
    </svg>
  )
}
