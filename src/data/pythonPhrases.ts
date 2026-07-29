export type PythonPhrase = {
  /** 학생이 수도코드에 쓴 말 */
  want: string;
  code: string;
  note: string;
};

export type PhraseGroup = {
  title: string;
  icon: string;
  phrases: PythonPhrase[];
};

/**
 * 수도코드 한 줄을 파이썬으로 어떻게 쓰는지 찾아보는 표.
 *
 * 문제별 정답이 아니라 표현 사전입니다. "무엇을 하고 싶은가"에서 출발해
 * 코드 모양을 찾도록 돼 있어, 파이썬 문법을 모르는 학생도 자기 알고리즘을
 * 옮겨 볼 수 있습니다. 15개 문제의 정답 코드에 실제로 쓰인 표현만 담았습니다.
 */
export const pythonPhrases: PhraseGroup[] = [
  {
    title: "값 받기",
    icon: "⌨",
    phrases: [
      { want: "수 하나를 입력받고 싶어요", code: "n = int(input())", note: "input()은 글자로 받아요. int(...)로 감싸야 계산할 수 있는 수가 돼요." },
      { want: "한 줄에 있는 수 두 개를 받고 싶어요", code: "a, b = map(int, input().split())", note: "split()이 띄어쓰기에서 자르고, map(int, ...)가 하나씩 수로 바꿔 줘요." },
      { want: "수 네 개도 같은 방법으로", code: "a, b, c, d = map(int, input().split())", note: "왼쪽 이름 개수와 들어오는 수의 개수를 맞추면 돼요." },
      { want: "글자 그대로 받고 싶어요", code: "s = input()", note: "계산하지 않고 그대로 보여 줄 때는 int()가 필요 없어요." },
    ],
  },
  {
    title: "보여 주기",
    icon: "🖥",
    phrases: [
      { want: "답을 화면에 보여 주고 싶어요", code: "print(answer)", note: "괄호 안의 값을 한 줄로 보여 줘요." },
      { want: "두 값을 한 줄에 나란히", code: "print(jars, money)", note: "쉼표로 나누면 사이에 띄어쓰기가 하나 들어가요." },
      { want: "정해진 글자를 보여 주고 싶어요", code: 'print("YES")', note: "글자는 반드시 따옴표로 감싸요. 따옴표가 없으면 이름으로 착각해요." },
    ],
  },
  {
    title: "계산하기",
    icon: "🧮",
    phrases: [
      { want: "더하기·빼기·곱하기", code: "a + b    a - b    a * b", note: "곱하기는 ×가 아니라 *를 써요." },
      { want: "몇 묶음인지 알고 싶어요 (몫)", code: "a // b", note: "빗금 두 개예요. 10 // 3은 3이 돼요." },
      { want: "묶고 남은 수 (나머지)", code: "a % b", note: "10 % 3은 1이에요." },
      { want: "남으면 하나 더 세고 싶어요 (올림)", code: "(a + b - 1) // b", note: "5개씩 담을 때는 (n + 4) // 5. 조금이라도 남으면 하나가 더 세어져요." },
      { want: "제곱하고 싶어요", code: "a ** 2", note: "별표 두 개가 거듭제곱이에요. a * a와 같아요." },
      { want: "소수점 자리를 줄이고 싶어요", code: "round(a / b, 2)", note: "둘째 자리까지 반올림해요." },
      { want: "두 수 중 작은 값·큰 값", code: "min(a, b)    max(a, b)", note: "어느 쪽이 작은지 직접 비교하지 않아도 돼요." },
    ],
  },
  {
    title: "경우를 나누기",
    icon: "🔀",
    phrases: [
      { want: "조건이 맞을 때만 하고 싶어요", code: "if score >= 90:\n    print(\"A\")", note: "끝에 콜론(:)을 찍고, 다음 줄은 반드시 네 칸 들여써요." },
      { want: "아니면 다른 것을 하고 싶어요", code: "if 조건:\n    ...\nelse:\n    ...", note: "else에는 조건을 쓰지 않아요. 위가 아닐 때 전부예요." },
      { want: "경우가 셋 이상이에요", code: "if 조건1:\n    ...\nelif 조건2:\n    ...\nelse:\n    ...", note: "위에서부터 차례로 검사하고, 맞는 걸 찾으면 나머지는 건너뛰어요." },
      { want: "두 조건이 모두 맞아야 해요", code: "if width == 2 and height == 2:", note: "and는 둘 다 참일 때만 참이에요. 하나만 맞아도 될 때는 or를 써요." },
      { want: "값이 같은지 / 다른지", code: "a == b    a != b", note: "= 하나는 값을 넣는 것, == 두 개가 같은지 묻는 거예요." },
      { want: "두 수 사이에 있는지", code: "start < c < end", note: "파이썬은 이렇게 이어서 쓸 수 있어요." },
    ],
  },
  {
    title: "여러 번 반복하기",
    icon: "🔁",
    phrases: [
      { want: "1부터 N까지 반복하고 싶어요", code: "for i in range(1, N + 1):\n    print(i)", note: "range(1, N+1)은 1부터 N까지예요. 끝 숫자는 포함하지 않아서 +1을 해요." },
      { want: "같은 글자를 여러 번", code: 'print("*" * 5)', note: "문자열에 수를 곱하면 그만큼 반복돼요. 반복문 없이도 돼요." },
      { want: "줄마다 개수를 늘리고 싶어요", code: 'for i in range(1, N + 1):\n    print("*" * i)', note: "i가 1, 2, 3…으로 바뀌니 별 개수도 함께 늘어나요." },
    ],
  },
  {
    title: "값을 모으기",
    icon: "📦",
    phrases: [
      { want: "값을 상자에 넣어 두고 싶어요", code: "answer = 0", note: "=는 오른쪽 값을 왼쪽 이름표의 상자에 넣는다는 뜻이에요." },
      { want: "계속 더해서 모으고 싶어요", code: "answer += 10", note: "answer = answer + 10과 같아요. 모으기 전에 먼저 상자를 만들어 둬야 해요." },
      { want: "참·거짓을 상자에 담고 싶어요", code: "c_inside = start < c < end", note: "비교 결과인 True나 False가 그대로 담겨요. 나중에 if에서 쓸 수 있어요." },
    ],
  },
];
