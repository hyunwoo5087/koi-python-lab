import type { Problem } from '../types'

/**
 * 기본 제공 문제입니다.
 * 문제 유형마다 가장 알맞은 과정 증거를 붙였습니다.
 * - 조건·규칙: 핵심 조건 선택 + 해결 순서 배열 + 오류 찾기
 * - 경로: 경로 그리기
 * - 상태 변화: 상태 추적
 * - 패턴: 패턴 표시
 * - 네트워크: 네트워크 조작
 */
export const problems: Problem[] = [
  {
    id: 'waterpark-01',
    version: 3,
    title: '워터파크 입장',
    category: '조건·규칙',
    ctElements: ['abstraction', 'algorithm', 'evaluation'],
    dokLevel: 2,
    stem: '입장 규칙을 읽고 안젤라와 프레드가 워터파크에 들어갈 수 있는지 판단하세요.',
    rules: [
      '8세 이상은 혼자 입장할 수 있습니다.',
      '8세 미만은 11세보다 나이가 많은 보호자와 함께 입장해야 합니다.',
      '안젤라는 12세, 프레드는 6세이며 두 사람은 함께 입장합니다.',
    ],
    visual: { type: 'waterpark' },
    choices: [
      { id: 'A', text: '안젤라와 프레드 모두 입장할 수 있다.' },
      { id: 'B', text: '안젤라만 입장할 수 있다.' },
      { id: 'C', text: '프레드만 입장할 수 있다.' },
      { id: 'D', text: '두 사람 모두 입장할 수 없다.' },
    ],
    correctAnswer: 'A',
    explanation:
      '안젤라는 8세 이상이라 혼자 입장할 수 있습니다. 프레드는 8세 미만이지만 11세보다 나이가 많은 안젤라와 함께 있으므로 입장할 수 있습니다.',
    hints: [
      '두 사람을 한꺼번에 판단하지 말고, 한 사람씩 규칙을 통과시켜 보세요.',
      '규칙에는 나이 기준이 두 개 나옵니다. 각각 누구에게 적용되는 기준인지 구분해 보세요.',
      '8세 미만인 사람에게는 보호자 조건이 하나 더 붙습니다. 그 조건의 기준 나이를 다시 읽어 보세요.',
    ],
    choiceProbes: [
      {
        choiceId: 'D',
        question:
          '두 사람 모두 입장할 수 없다면, 8세 이상인 사람도 막는 규칙이 있어야 합니다. 그런 규칙이 실제로 있나요?',
      },
      {
        choiceId: 'B',
        question:
          '안젤라만 들어갈 수 있다면 프레드를 막는 이유가 무엇인가요? 보호자 조건을 다시 확인해 보세요.',
      },
      {
        choiceId: 'C',
        question: '프레드만 들어갈 수 있다면, 12세인 안젤라를 막는 규칙은 어느 것인가요?',
      },
      {
        choiceId: 'A',
        question:
          '두 사람 모두 들어갈 수 있다고 보았다면, 프레드에게 적용된 조건을 규칙 번호로 말할 수 있나요?',
      },
    ],
    processSteps: [
      {
        id: 'conditions',
        type: 'multi_select',
        question: '입장 가능 여부를 판단하는 데 필요한 정보를 모두 고르세요.',
        instruction: '문제 해결에 직접 쓰이는 정보와 장식 정보를 구분해 봅니다.',
        items: [
          { id: 'angela_age', text: '안젤라의 나이' },
          { id: 'fred_age', text: '프레드의 나이' },
          { id: 'together', text: '두 사람이 함께 입장하는지' },
          { id: 'clothes', text: '두 사람의 옷 색깔' },
          { id: 'weather', text: '오늘의 날씨' },
        ],
        correct: ['angela_age', 'fred_age', 'together'],
        ctElement: 'abstraction',
      },
      {
        id: 'decision-order',
        type: 'step_order',
        question: '입장 여부를 판단하는 순서가 되도록 항목을 배열하세요.',
        instruction: '위·아래 버튼을 눌러 판단 절차를 바꿀 수 있습니다.',
        items: [
          { id: 'check_companion', text: '8세 미만인 사람에게 동행자가 있는지 확인한다.' },
          { id: 'check_age', text: '각 사람의 나이가 8세 이상인지 확인한다.' },
          { id: 'check_guardian_age', text: '동행자의 나이가 11세보다 많은지 확인한다.' },
        ],
        correct: ['check_age', 'check_companion', 'check_guardian_age'],
        ctElement: 'algorithm',
      },
      {
        id: 'debug-statement',
        type: 'error_spot',
        question: '다음 잘못된 설명을 가장 정확하게 바로잡은 문장을 고르세요.',
        instruction: '잘못된 설명: “프레드는 8세보다 어리므로 누구와 함께 가도 입장할 수 없다.”',
        items: [
          {
            id: 'fix_guardian',
            text: '8세 미만이어도 11세보다 나이가 많은 보호자와 함께라면 입장할 수 있다.',
          },
          { id: 'fix_anyone', text: '8세 미만은 나이에 관계없이 아무와 함께 가면 입장할 수 있다.' },
          { id: 'fix_alone', text: '프레드는 6세이므로 혼자 입장할 수 있다.' },
          { id: 'fix_weather', text: '날씨가 맑으므로 프레드도 입장할 수 있다.' },
        ],
        correct: ['fix_guardian'],
        maxSelections: 1,
        ctElement: 'evaluation',
      },
    ],
    transfer: {
      stem: '수영장에서는 9세 이상이면 혼자 입장할 수 있고, 9세 미만은 14세보다 나이가 많은 보호자와 함께 입장해야 합니다. 13세 민지와 7세 준호가 함께 왔습니다. 누가 입장할 수 있나요?',
      choices: [
        { id: 'A', text: '민지와 준호 모두 입장할 수 있다.' },
        { id: 'B', text: '민지만 입장할 수 있다.' },
        { id: 'C', text: '준호만 입장할 수 있다.' },
        { id: 'D', text: '둘 다 입장할 수 없다.' },
      ],
      correctAnswer: 'B',
      explanation:
        '민지는 9세 이상이므로 입장할 수 있지만, 민지는 14세보다 나이가 많지 않으므로 준호의 보호자 조건을 충족하지 못합니다.',
    },
  },
  {
    id: 'route-01',
    version: 3,
    title: '배달 로봇의 짧은 길',
    category: '경로·최적화',
    ctElements: ['decomposition', 'algorithm', 'evaluation'],
    dokLevel: 3,
    stem: '배달 로봇이 S에서 G까지 갑니다. × 칸을 지나지 않고 갈 때 가장 적은 이동 횟수는 몇 번인가요?',
    rules: [
      '로봇은 위·아래·왼쪽·오른쪽으로 한 칸씩 이동합니다.',
      '× 표시된 칸은 지나갈 수 없습니다.',
      '한 칸 움직이는 것을 이동 1번으로 셉니다.',
    ],
    visual: { type: 'grid', alt: 'S에서 G까지 가는 7×6 격자입니다. × 칸은 지나갈 수 없습니다.' },
    choices: [
      { id: 'A', text: '11번' },
      { id: 'B', text: '13번' },
      { id: 'C', text: '15번' },
      { id: 'D', text: 'G에 도착할 수 없다.' },
    ],
    correctAnswer: 'A',
    explanation:
      '오른쪽으로 6번, 위로 5번만 움직여도 막힌 칸을 피할 수 있어 11번이 최소입니다. 되돌아가는 이동이 필요하지 않습니다.',
    hints: [
      '가로로 몇 칸, 세로로 몇 칸을 움직여야 하는지 먼저 세어 보세요.',
      '되돌아가지 않고 오른쪽과 위쪽으로만 갈 수 있다면 이동 횟수는 항상 같습니다.',
      '막힌 칸이 오른쪽·위쪽만 쓰는 길을 완전히 막고 있는지 확인해 보세요.',
    ],
    choiceProbes: [
      {
        choiceId: 'D',
        question:
          '도착할 수 없다고 보았다면, 막힌 칸들이 위아래로 완전히 이어져 격자를 가로막고 있어야 합니다. 정말 그런가요?',
      },
      {
        choiceId: 'B',
        question: '13번이 필요하다면 어딘가에서 되돌아가야 합니다. 되돌아가지 않는 길이 정말 없나요?',
      },
    ],
    processSteps: [
      {
        id: 'route-draw',
        type: 'path_draw',
        question: 'S에서 G까지 가장 짧은 경로를 직접 그려 보세요.',
        instruction: '칸을 순서대로 누르면 경로가 이어집니다. 마지막 칸을 다시 누르면 한 칸 지워집니다.',
        items: [],
        correct: [
          '1,1',
          '2,1',
          '3,1',
          '4,1',
          '5,1',
          '6,1',
          '7,1',
          '7,2',
          '7,3',
          '7,4',
          '7,5',
          '7,6',
        ],
        path: {
          width: 7,
          height: 6,
          start: '1,1',
          goal: '7,6',
          blocked: ['3,6', '3,5', '2,3', '3,3', '5,3', '5,2'],
          optimalMoves: 11,
        },
        ctElement: 'algorithm',
      },
      {
        id: 'route-check',
        type: 'multi_select',
        question: '내가 그린 경로가 가장 짧다고 판단할 때 확인해야 할 내용을 모두 고르세요.',
        items: [
          { id: 'reaches_goal', text: '도착점까지 실제로 이어지는가' },
          { id: 'avoids_blocks', text: '막힌 칸을 지나지 않는가' },
          { id: 'no_backtrack', text: '되돌아가는 이동이 없는가' },
          { id: 'pretty_shape', text: '경로 모양이 보기 좋은가' },
          { id: 'diagonal', text: '대각선으로 지나가는 부분이 있는가' },
        ],
        correct: ['reaches_goal', 'avoids_blocks', 'no_backtrack'],
        ctElement: 'evaluation',
      },
    ],
    transfer: {
      stem: '가로 5칸, 세로 4칸 격자에서 왼쪽 아래에서 오른쪽 위까지 갑니다. 막힌 칸이 없고 위·아래·왼쪽·오른쪽으로만 움직인다면 가장 적은 이동 횟수는 몇 번인가요?',
      choices: [
        { id: 'A', text: '6번' },
        { id: 'B', text: '7번' },
        { id: 'C', text: '9번' },
        { id: 'D', text: '20번' },
      ],
      correctAnswer: 'B',
      explanation: '오른쪽으로 4번, 위로 3번 움직이면 되므로 4 + 3 = 7번입니다.',
    },
  },
  {
    id: 'robot-01',
    version: 3,
    title: '로봇 명령 실행',
    category: '상태 변화',
    ctElements: ['algorithm', 'evaluation'],
    dokLevel: 2,
    stem: '로봇은 (2,1)에서 북쪽을 보고 시작합니다. 명령을 순서대로 실행했을 때 최종 위치를 고르세요.',
    rules: [
      '명령: ① 앞으로 2칸 ② 오른쪽 회전 ③ 앞으로 1칸 ④ 왼쪽 회전 ⑤ 앞으로 1칸',
      '회전은 제자리에서 방향만 바꿉니다.',
      '위치는 (가로, 세로)로 적습니다.',
    ],
    visual: { type: 'robot' },
    choices: [
      { id: 'A', text: '(4, 3)' },
      { id: 'B', text: '(3, 4)' },
      { id: 'C', text: '(2, 4)' },
      { id: 'D', text: '(4, 2)' },
    ],
    correctAnswer: 'B',
    explanation:
      '북쪽으로 2칸 이동해 (2,3), 오른쪽으로 돌아 동쪽으로 1칸 이동해 (3,3), 왼쪽으로 돌아 북쪽으로 1칸 이동해 (3,4)에 도착합니다.',
    hints: [
      '머릿속으로 위치와 방향을 함께 기억하려 하지 말고, 종이에 두 값을 따로 적어 보세요.',
      '회전 명령은 위치를 바꾸지 않습니다. 회전과 이동을 구분해 표시해 보세요.',
      '명령 다섯 개 중 위치가 바뀌는 명령은 몇 개인지 세어 보세요.',
    ],
    processSteps: [
      {
        id: 'robot-trace',
        type: 'state_trace',
        question: '명령을 하나씩 실행할 때마다 로봇의 상태를 골라 보세요.',
        instruction: '위치와 방향을 함께 봅니다. 앞 단계를 고치면 뒤 단계도 다시 확인하세요.',
        items: [],
        correct: ['r1-b', 'r2-c', 'r3-a', 'r4-b', 'r5-c'],
        states: {
          stages: [
            {
              id: 'r1',
              label: '① 앞으로 2칸 실행 후',
              options: [
                { id: 'r1-a', text: '(2,2) 북쪽을 봄' },
                { id: 'r1-b', text: '(2,3) 북쪽을 봄' },
                { id: 'r1-c', text: '(4,1) 동쪽을 봄' },
              ],
              correctId: 'r1-b',
            },
            {
              id: 'r2',
              label: '② 오른쪽 회전 실행 후',
              options: [
                { id: 'r2-a', text: '(3,3) 동쪽을 봄' },
                { id: 'r2-b', text: '(2,3) 서쪽을 봄' },
                { id: 'r2-c', text: '(2,3) 동쪽을 봄' },
              ],
              correctId: 'r2-c',
            },
            {
              id: 'r3',
              label: '③ 앞으로 1칸 실행 후',
              options: [
                { id: 'r3-a', text: '(3,3) 동쪽을 봄' },
                { id: 'r3-b', text: '(2,4) 북쪽을 봄' },
                { id: 'r3-c', text: '(3,3) 북쪽을 봄' },
              ],
              correctId: 'r3-a',
            },
            {
              id: 'r4',
              label: '④ 왼쪽 회전 실행 후',
              options: [
                { id: 'r4-a', text: '(3,3) 서쪽을 봄' },
                { id: 'r4-b', text: '(3,3) 북쪽을 봄' },
                { id: 'r4-c', text: '(3,4) 북쪽을 봄' },
              ],
              correctId: 'r4-b',
            },
            {
              id: 'r5',
              label: '⑤ 앞으로 1칸 실행 후',
              options: [
                { id: 'r5-a', text: '(4,3) 동쪽을 봄' },
                { id: 'r5-b', text: '(3,3) 북쪽을 봄' },
                { id: 'r5-c', text: '(3,4) 북쪽을 봄' },
              ],
              correctId: 'r5-c',
            },
          ],
        },
        ctElement: 'algorithm',
      },
    ],
    transfer: {
      stem: '로봇이 동쪽을 보고 (1,1)에서 시작합니다. 앞으로 2칸 → 왼쪽 회전 → 앞으로 2칸을 실행하면 어디에 도착하나요?',
      choices: [
        { id: 'A', text: '(3,3)' },
        { id: 'B', text: '(1,3)' },
        { id: 'C', text: '(3,1)' },
        { id: 'D', text: '(2,3)' },
      ],
      correctAnswer: 'A',
      explanation: '동쪽으로 두 칸 이동해 (3,1), 왼쪽으로 돌아 북쪽으로 두 칸 이동해 (3,3)에 도착합니다.',
    },
  },
  {
    id: 'pattern-01',
    version: 3,
    title: '타일 무늬의 규칙',
    category: '패턴·일반화',
    ctElements: ['pattern', 'abstraction', 'generalization'],
    dokLevel: 2,
    stem: '타일이 일정한 규칙으로 반복됩니다. 열 번째 자리에 올 타일을 고르세요.',
    rules: ['무늬: ● ▲ ▲ ● ▲ ▲ ● ▲ ▲ …'],
    visual: { type: 'pattern' },
    choices: [
      { id: 'A', text: '●' },
      { id: 'B', text: '▲' },
      { id: 'C', text: '■' },
      { id: 'D', text: '규칙이 없다.' },
    ],
    correctAnswer: 'A',
    explanation:
      '가장 작은 반복 단위는 “● ▲ ▲”로 3칸입니다. 10 = 3 × 3 + 1이므로 열 번째는 단위의 첫 칸과 같습니다.',
    hints: [
      '앞에서부터 길이 1, 2, 3인 덩어리를 차례로 잡아 보세요.',
      '잡은 덩어리를 계속 이어 붙였을 때 전체 무늬와 똑같아지는지 확인해 보세요.',
      '단위의 길이를 알면, 몇 번째 칸인지를 그 길이로 나눈 나머지만 보면 됩니다.',
    ],
    processSteps: [
      {
        id: 'pattern-unit',
        type: 'pattern_mark',
        question: '반복되는 가장 작은 단위를 직접 표시하세요.',
        instruction: '이어진 칸만 표시할 수 있습니다. 끝 칸을 다시 누르면 한 칸씩 줄어듭니다.',
        items: [],
        correct: ['0', '1', '2'],
        pattern: {
          tokens: ['●', '▲', '▲', '●', '▲', '▲', '●', '▲', '▲'],
          unitLength: 3,
        },
        ctElement: 'pattern',
      },
      {
        id: 'pattern-rule',
        type: 'multi_select',
        question: '표시한 단위로 먼 자리의 타일을 알아내려면 무엇이 필요한가요?',
        items: [
          { id: 'unit_length', text: '반복 단위의 길이' },
          { id: 'position_mod', text: '몇 번째 자리인지를 단위 길이로 나눈 나머지' },
          { id: 'unit_order', text: '단위 안에서 타일이 놓인 순서' },
          { id: 'total_count', text: '전체 타일의 개수' },
          { id: 'tile_color', text: '타일의 색깔' },
        ],
        correct: ['unit_length', 'position_mod', 'unit_order'],
        ctElement: 'generalization',
      },
    ],
    transfer: {
      stem: '새 무늬가 “■ ○ ○ ○ ■ ○ ○ ○ …”로 이어집니다. 열세 번째 자리에 올 도형은 무엇인가요?',
      choices: [
        { id: 'A', text: '■' },
        { id: 'B', text: '○' },
        { id: 'C', text: '▲' },
        { id: 'D', text: '알 수 없다.' },
      ],
      correctAnswer: 'A',
      explanation: '반복 단위가 4칸이고 13 = 4 × 3 + 1이므로 단위의 첫 칸인 ■입니다.',
    },
  },
  {
    id: 'network-01',
    version: 3,
    title: '마을 통신망',
    category: '네트워크·관계',
    ctElements: ['decomposition', 'evaluation', 'generalization'],
    dokLevel: 3,
    stem: '여섯 마을이 통신선으로 연결되어 있습니다. 하나의 통신선만 끊겼을 때 전체 통신망이 둘로 나뉘는 선을 고르세요.',
    rules: [
      'A-B-C는 삼각형으로 연결되고 D-E-F도 삼각형으로 연결됩니다.',
      '두 삼각형은 C-D 선 하나로만 서로 연결됩니다.',
    ],
    visual: { type: 'network' },
    choices: [
      { id: 'A', text: 'A-B' },
      { id: 'B', text: 'B-C' },
      { id: 'C', text: 'C-D' },
      { id: 'D', text: 'D-E' },
    ],
    correctAnswer: 'C',
    explanation:
      '삼각형 안의 선은 하나가 끊겨도 다른 두 선으로 돌아갈 수 있습니다. 두 삼각형을 잇는 선은 하나뿐이므로 그 선이 끊기면 통신망이 둘로 나뉩니다.',
    hints: [
      '선을 하나 지웠다고 생각하고, 남은 선만으로 두 마을을 이을 수 있는지 손가락으로 따라가 보세요.',
      '삼각형처럼 고리를 이루는 부분에서는 한 선이 끊겨도 돌아가는 길이 남습니다.',
      '고리에 속하지 않는 선이 몇 개인지 세어 보세요.',
    ],
    processSteps: [
      {
        id: 'bridge-pick',
        type: 'network_select',
        question: '끊기면 통신망이 둘로 나뉘는 연결을 직접 눌러 고르세요.',
        instruction: '선을 눌러 표시하고, 다시 누르면 해제됩니다.',
        items: [],
        correct: ['C-D'],
        network: {
          nodes: [
            { id: 'A', x: 14, y: 24 },
            { id: 'B', x: 14, y: 76 },
            { id: 'C', x: 38, y: 50 },
            { id: 'D', x: 66, y: 50 },
            { id: 'E', x: 90, y: 24 },
            { id: 'F', x: 90, y: 76 },
          ],
          edges: [
            { id: 'A-B', from: 'A', to: 'B' },
            { id: 'B-C', from: 'B', to: 'C' },
            { id: 'C-A', from: 'C', to: 'A' },
            { id: 'C-D', from: 'C', to: 'D' },
            { id: 'D-E', from: 'D', to: 'E' },
            { id: 'E-F', from: 'E', to: 'F' },
            { id: 'F-D', from: 'F', to: 'D' },
          ],
          target: 'edge',
        },
        ctElement: 'decomposition',
      },
      {
        id: 'bridge-test',
        type: 'error_spot',
        question: '어떤 연결이 중요한지 확인하는 가장 좋은 방법은 무엇인가요?',
        items: [
          {
            id: 'remove_test',
            text: '선을 하나 지운 뒤 양쪽 마을 사이에 다른 경로가 남는지 확인한다.',
          },
          { id: 'count_nodes', text: '마을의 개수만 센다.' },
          { id: 'look_length', text: '선의 화면상 길이만 비교한다.' },
          { id: 'choose_center', text: '그림 중앙에 있는 선을 고른다.' },
        ],
        correct: ['remove_test'],
        maxSelections: 1,
        ctElement: 'evaluation',
      },
    ],
    transfer: {
      stem: '두 개의 섬 묶음이 다리 하나로만 연결되어 있습니다. 그 다리를 제거했을 때 어떤 일이 생기나요?',
      choices: [
        { id: 'A', text: '모든 섬 사이의 이동이 더 빨라진다.' },
        { id: 'B', text: '두 섬 묶음 사이를 오갈 수 없게 된다.' },
        { id: 'C', text: '아무 변화가 없다.' },
        { id: 'D', text: '모든 섬이 하나로 합쳐진다.' },
      ],
      correctAnswer: 'B',
      explanation: '두 묶음을 잇는 유일한 다리가 사라지면 묶음 사이의 연결이 끊깁니다.',
    },
  },
]
