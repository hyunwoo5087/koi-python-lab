import type { Problem } from '../types'

/**
 * 일괄 등록 예시 묶음입니다.
 * 교사가 실제 비버 문제를 올릴 때 참고할 수 있도록
 * 새 과정 증거 유형을 하나씩 사용한 문제를 담았습니다.
 */
export const starterPack: Problem[] = [
  {
    id: 'pack-warehouse-path',
    version: 1,
    title: '창고 로봇의 지름길',
    category: '경로·최적화',
    ctElements: ['algorithm', 'evaluation'],
    dokLevel: 3,
    stem: '창고 로봇이 S에서 물건이 있는 G까지 갑니다. 선반(×)을 지나지 않고 갈 때 가장 적은 이동 횟수는 몇 번인가요?',
    rules: [
      '로봇은 위·아래·왼쪽·오른쪽으로 한 칸씩 이동합니다.',
      '× 칸에는 선반이 있어 지나갈 수 없습니다.',
    ],
    visual: { type: 'grid', alt: 'S에서 G까지 가는 5×5 창고 격자입니다.' },
    choices: [
      { id: 'A', text: '8번' },
      { id: 'B', text: '10번' },
      { id: 'C', text: '12번' },
      { id: 'D', text: '도착할 수 없다.' },
    ],
    correctAnswer: 'A',
    explanation:
      '오른쪽으로 4번, 위로 4번만 움직이면 되므로 8번이 최소입니다. 선반을 피해도 되돌아갈 필요가 없습니다.',
    hints: [
      '가로로 몇 칸, 세로로 몇 칸을 가야 하는지 먼저 세어 보세요.',
      '되돌아가는 이동이 필요한 경우에만 최소 횟수가 늘어납니다.',
    ],
    choiceProbes: [
      {
        choiceId: 'D',
        question: '도착할 수 없다면 선반이 격자를 완전히 가로막아야 합니다. 정말 그런가요?',
      },
    ],
    processSteps: [
      {
        id: 'pack-path-1',
        type: 'path_draw',
        question: 'S에서 G까지 가장 짧은 경로를 그려 보세요.',
        instruction: '칸을 순서대로 눌러 경로를 이으세요.',
        items: [],
        correct: ['1,1', '2,1', '3,1', '4,1', '5,1', '5,2', '5,3', '5,4', '5,5'],
        path: {
          width: 5,
          height: 5,
          start: '1,1',
          goal: '5,5',
          blocked: ['2,3', '3,3', '2,5'],
          optimalMoves: 8,
        },
        ctElement: 'algorithm',
      },
    ],
    transfer: {
      stem: '막힌 칸이 없는 가로 6칸, 세로 3칸 격자에서 왼쪽 아래에서 오른쪽 위까지 가려면 최소 몇 번 이동해야 하나요?',
      choices: [
        { id: 'A', text: '7번' },
        { id: 'B', text: '8번' },
        { id: 'C', text: '9번' },
        { id: 'D', text: '18번' },
      ],
      correctAnswer: 'A',
      explanation: '오른쪽으로 5번, 위로 2번 움직이면 되므로 5 + 2 = 7번입니다.',
    },
    origin: 'custom',
    isActive: false,
  },
  {
    id: 'pack-cup-swap',
    version: 1,
    title: '컵 바꾸기 놀이',
    category: '상태 변화',
    ctElements: ['algorithm', 'evaluation'],
    dokLevel: 2,
    stem: '왼쪽부터 빨강, 파랑, 노랑 컵이 놓여 있습니다. 지시를 순서대로 따랐을 때 마지막 배치를 고르세요.',
    rules: [
      '지시 ①: 1번과 2번 자리의 컵을 바꿉니다.',
      '지시 ②: 2번과 3번 자리의 컵을 바꿉니다.',
      '지시 ③: 1번과 3번 자리의 컵을 바꿉니다.',
    ],
    visual: { type: 'none' },
    choices: [
      { id: 'A', text: '빨강, 노랑, 파랑' },
      { id: 'B', text: '파랑, 노랑, 빨강' },
      { id: 'C', text: '빨강, 파랑, 노랑' },
      { id: 'D', text: '노랑, 빨강, 파랑' },
    ],
    correctAnswer: 'A',
    explanation:
      '① 뒤에는 파랑·빨강·노랑, ② 뒤에는 파랑·노랑·빨강이 됩니다. ③에서 1번과 3번을 바꾸면 빨강·노랑·파랑이 됩니다.',
    hints: [
      '세 자리를 표로 그리고 지시마다 한 줄씩 새로 적어 보세요.',
      '바뀌지 않는 자리도 반드시 그대로 옮겨 적어야 헷갈리지 않습니다.',
    ],
    processSteps: [
      {
        id: 'pack-cup-trace',
        type: 'state_trace',
        question: '지시를 하나씩 따를 때마다 컵 배치를 골라 보세요.',
        instruction: '왼쪽부터 1번, 2번, 3번 자리입니다.',
        items: [],
        correct: ['c1-b', 'c2-c', 'c3-a'],
        states: {
          stages: [
            {
              id: 'c1',
              label: '지시 ① 뒤의 배치',
              options: [
                { id: 'c1-a', text: '빨강, 파랑, 노랑' },
                { id: 'c1-b', text: '파랑, 빨강, 노랑' },
                { id: 'c1-c', text: '노랑, 파랑, 빨강' },
              ],
              correctId: 'c1-b',
            },
            {
              id: 'c2',
              label: '지시 ② 뒤의 배치',
              options: [
                { id: 'c2-a', text: '파랑, 빨강, 노랑' },
                { id: 'c2-b', text: '빨강, 노랑, 파랑' },
                { id: 'c2-c', text: '파랑, 노랑, 빨강' },
              ],
              correctId: 'c2-c',
            },
            {
              id: 'c3',
              label: '지시 ③ 뒤의 배치',
              options: [
                { id: 'c3-a', text: '빨강, 노랑, 파랑' },
                { id: 'c3-b', text: '노랑, 빨강, 파랑' },
                { id: 'c3-c', text: '파랑, 노랑, 빨강' },
              ],
              correctId: 'c3-a',
            },
          ],
        },
        ctElement: 'algorithm',
      },
    ],
    transfer: {
      stem: '왼쪽부터 가, 나, 다 카드가 있습니다. 1번과 2번을 바꾼 뒤 다시 1번과 2번을 바꾸면 배치는 어떻게 되나요?',
      choices: [
        { id: 'A', text: '가, 나, 다 (처음과 같다)' },
        { id: 'B', text: '나, 가, 다' },
        { id: 'C', text: '다, 나, 가' },
        { id: 'D', text: '알 수 없다.' },
      ],
      correctAnswer: 'A',
      explanation: '같은 두 자리를 두 번 바꾸면 원래 상태로 돌아옵니다.',
    },
    origin: 'custom',
    isActive: false,
  },
  {
    id: 'pack-bead-pattern',
    version: 1,
    title: '구슬 팔찌의 반복',
    category: '패턴·일반화',
    ctElements: ['pattern', 'generalization'],
    dokLevel: 2,
    stem: '구슬이 일정한 규칙으로 이어집니다. 스무 번째 구슬은 무엇인가요?',
    rules: ['구슬: ○ ○ ● ◆ ○ ○ ● ◆ ○ ○ ● ◆ …'],
    visual: { type: 'none' },
    choices: [
      { id: 'A', text: '○' },
      { id: 'B', text: '●' },
      { id: 'C', text: '◆' },
      { id: 'D', text: '규칙이 없다.' },
    ],
    correctAnswer: 'C',
    explanation:
      '반복 단위는 “○ ○ ● ◆”로 4칸입니다. 20 = 4 × 5로 딱 나누어지므로 스무 번째는 단위의 마지막 칸인 ◆입니다.',
    hints: [
      '반복 단위의 길이를 먼저 정하세요.',
      '자리 번호를 단위 길이로 나눈 나머지를 보면 단위 안의 몇 번째인지 알 수 있습니다.',
      '나머지가 0이면 단위의 마지막 칸입니다.',
    ],
    processSteps: [
      {
        id: 'pack-bead-unit',
        type: 'pattern_mark',
        question: '반복되는 가장 작은 단위를 표시하세요.',
        instruction: '이어진 칸만 표시할 수 있습니다.',
        items: [],
        correct: ['0', '1', '2', '3'],
        pattern: {
          tokens: ['○', '○', '●', '◆', '○', '○', '●', '◆', '○', '○', '●', '◆'],
          unitLength: 4,
        },
        ctElement: 'pattern',
      },
    ],
    transfer: {
      stem: '“△ △ △ ★”가 반복되는 무늬에서 열두 번째 도형은 무엇인가요?',
      choices: [
        { id: 'A', text: '★' },
        { id: 'B', text: '△' },
        { id: 'C', text: '○' },
        { id: 'D', text: '알 수 없다.' },
      ],
      correctAnswer: 'A',
      explanation: '단위가 4칸이고 12는 4로 나누어지므로 단위의 마지막 칸인 ★입니다.',
    },
    origin: 'custom',
    isActive: false,
  },
  {
    id: 'pack-school-network',
    version: 1,
    title: '학교 와이파이 중계기',
    category: '네트워크·관계',
    ctElements: ['decomposition', 'evaluation'],
    dokLevel: 3,
    stem: '교실들이 중계기로 연결되어 있습니다. 중계기 한 대가 고장 났을 때 연결이 둘로 나뉘는 곳은 어디인가요?',
    rules: [
      'A, B, C는 서로 삼각형으로 연결되어 있습니다.',
      'C와 D가 연결되고, D는 E와도 연결됩니다.',
      '중계기가 고장 나면 그 중계기에 붙은 모든 연결이 함께 끊깁니다.',
    ],
    visual: { type: 'none' },
    choices: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'C' },
      { id: 'C', text: 'E' },
      { id: 'D', text: '어느 것이 고장 나도 나뉘지 않는다.' },
    ],
    correctAnswer: 'B',
    explanation:
      'A는 삼각형 안에 있어 빠져도 B와 C가 남습니다. E는 끝에 붙어 있어 빠져도 나머지가 이어집니다. C가 빠지면 A·B 묶음과 D·E 묶음을 잇는 길이 사라집니다.',
    hints: [
      '중계기를 하나 지운 그림을 그려 보고, 남은 연결만으로 모든 교실이 이어지는지 확인해 보세요.',
      '삼각형 안의 지점과 끝에 매달린 지점은 지워도 나머지가 이어집니다.',
    ],
    processSteps: [
      {
        id: 'pack-network-pick',
        type: 'network_select',
        question: '고장 나면 연결이 둘로 나뉘는 중계기를 눌러 고르세요.',
        instruction: '지점을 눌러 표시하고, 다시 누르면 해제됩니다.',
        items: [],
        correct: ['C'],
        network: {
          nodes: [
            { id: 'A', x: 15, y: 25 },
            { id: 'B', x: 15, y: 75 },
            { id: 'C', x: 45, y: 50 },
            { id: 'D', x: 72, y: 50 },
            { id: 'E', x: 92, y: 50 },
          ],
          edges: [
            { id: 'A-B', from: 'A', to: 'B' },
            { id: 'A-C', from: 'A', to: 'C' },
            { id: 'B-C', from: 'B', to: 'C' },
            { id: 'C-D', from: 'C', to: 'D' },
            { id: 'D-E', from: 'D', to: 'E' },
          ],
          target: 'node',
        },
        ctElement: 'decomposition',
      },
      {
        id: 'pack-network-reason',
        type: 'error_spot',
        question: '중계기의 중요도를 판단하는 올바른 방법을 고르세요.',
        items: [
          { id: 'n-remove', text: '그 중계기를 지운 뒤 나머지가 서로 이어지는지 확인한다.' },
          { id: 'n-count', text: '연결선이 가장 많은 중계기를 고른다.' },
          { id: 'n-center', text: '그림에서 가장 가운데 있는 중계기를 고른다.' },
          { id: 'n-name', text: '이름이 앞에 오는 중계기를 고른다.' },
        ],
        correct: ['n-remove'],
        maxSelections: 1,
        ctElement: 'evaluation',
      },
    ],
    transfer: {
      stem: '건물 두 채가 통로 한 개로만 이어져 있고, 그 통로 가운데에 안내실이 있습니다. 안내실을 닫으면 어떤 일이 생기나요?',
      choices: [
        { id: 'A', text: '두 건물 사이를 오갈 수 없게 된다.' },
        { id: 'B', text: '이동이 더 빨라진다.' },
        { id: 'C', text: '아무 변화가 없다.' },
        { id: 'D', text: '건물이 하나로 합쳐진다.' },
      ],
      correctAnswer: 'A',
      explanation: '두 건물을 잇는 유일한 길이 막히면 건물 사이의 이동이 끊깁니다.',
    },
    origin: 'custom',
    isActive: false,
  },
]
