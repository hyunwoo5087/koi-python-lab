export type CodeTest = {
  name: string;
  input: string;
  expected: string;
  hint: string;
};

export const codeTests: Record<string, CodeTest[]> = {
  A: [
    { name: "양수", input: "15\n", expected: "15", hint: "입력받은 값을 바꾸지 않고 출력했는지 살펴보세요." },
    { name: "0", input: "0\n", expected: "0", hint: "0도 다른 정수와 똑같이 출력해야 해요." },
    { name: "음수", input: "-2147483648\n", expected: "-2147483648", hint: "마이너스 기호까지 그대로 나와야 해요." },
  ],
  B: [
    { name: "가장 작은 도형", input: "1\n", expected: "1", hint: "n=1일 때 채우는 방법은 1가지예요." },
    { name: "문제의 예", input: "2\n", expected: "2", hint: "문제 그림에서 n=2의 답은 2예요." },
    { name: "더 긴 도형", input: "7\n", expected: "7", hint: "찾은 규칙대로 방법 수와 n이 같은지 확인해 보세요." },
  ],
  C: [
    { name: "나머지가 있는 나눗셈", input: "10 3\n", expected: "13\n7\n30\n3\n1\n3.33", hint: "여섯 결과의 순서와 줄바꿈을 확인해 보세요." },
    { name: "나누어떨어지는 수", input: "8 2\n", expected: "10\n6\n16\n4\n0\n4.0", hint: "나머지는 0이고, 나누기 결과는 4.0으로 출력돼요." },
    { name: "또 다른 두 수", input: "5 4\n", expected: "9\n1\n20\n1\n1\n1.25", hint: "//는 몫, %는 나머지예요." },
  ],
  D: [
    { name: "한 칸", input: "1 1\n", expected: "1", hint: "한 칸만 있어도 밝히는 가로등 하나가 필요해요." },
    { name: "짝수 칸", input: "2 3\n", expected: "3", hint: "6칸을 두 칸씩 짝지으면 3묶음이에요." },
    { name: "홀수 칸", input: "3 3\n", expected: "5", hint: "9칸은 4묶음과 남은 1칸이므로 하나를 더 놓아요." },
  ],
  E: [
    { name: "막대 하나", input: "1\n", expected: "1", hint: "막대 하나도 같은 길이 막대 1개로 셀 수 있어요." },
    { name: "짝수 개", input: "4\n", expected: "2", hint: "막대를 두 개씩 짝지어 보세요." },
    { name: "홀수 개", input: "5\n", expected: "3", hint: "두 쌍을 만들고 가운데 막대 하나가 남아요." },
  ],
  F: [
    { name: "딱 맞게 담기", input: "10\n", expected: "2 300000", hint: "항아리 2개가 모두 꽉 차요." },
    { name: "조금 남기", input: "12\n", expected: "3 300000", hint: "담을 항아리는 3개지만 돈은 꽉 찬 2개만 계산해요." },
    { name: "한 항아리보다 적게", input: "4\n", expected: "1 0", hint: "담을 항아리는 필요하지만 아직 팔 수는 없어요." },
  ],
  G: [
    { name: "작은 수 확인", input: "12\n", expected: "3 300000", hint: "큰 수 문제도 작은 수에서 같은 규칙이 맞아야 해요." },
    { name: "딱 나누어지는 큰 수", input: "10000000000\n", expected: "2000000000 300000000000000", hint: "5씩 반복하지 말고 나눗셈으로 한 번에 구해 보세요." },
    { name: "1kg이 남는 큰 수", input: "9999999996\n", expected: "2000000000 299999999850000", hint: "남은 양이 있으면 담을 항아리만 하나 더 필요해요." },
  ],
  H: [
    { name: "A 기준", input: "90\n", expected: "A", hint: "90점도 A에 들어가요." },
    { name: "B 기준", input: "70\n", expected: "B", hint: "70점은 B의 가장 낮은 점수예요." },
    { name: "C 기준", input: "40\n", expected: "C", hint: "40점은 C의 가장 낮은 점수예요." },
    { name: "D 점수", input: "39\n", expected: "D", hint: "어느 기준에도 들어가지 않으면 D예요." },
  ],
  I: [
    { name: "가로 한 줄", input: "1 3\n", expected: "YES", hint: "한 줄 퍼즐판은 완성할 수 있어요." },
    { name: "세로 한 줄", input: "4 1\n", expected: "YES", hint: "조각을 돌릴 수 있으므로 세로 한 줄도 가능해요." },
    { name: "2×2", input: "2 2\n", expected: "YES", hint: "2×2는 특별히 완성할 수 있어요." },
    { name: "더 큰 판", input: "2 3\n", expected: "NO", hint: "한 줄도 2×2도 아니면 필요한 오목한 부분이 부족해요." },
  ],
  J: [
    { name: "원 밖", input: "0 0\n3\n3 3\n", expected: "out", hint: "3²+3²=18은 반지름의 제곱 9보다 커요." },
    { name: "원 둘레", input: "0 0\n5\n3 4\n", expected: "on", hint: "3²+4²와 5²가 모두 25인지 확인해 보세요." },
    { name: "원 안", input: "1 -2\n4\n2 0\n", expected: "in", hint: "중심과 나무의 좌표 차이를 먼저 구해야 해요." },
  ],
  K: [
    { name: "같은 시 안에서", input: "14 30\n20\n", expected: "14 50", hint: "20분을 더해도 다음 시로 넘어가지 않아요." },
    { name: "다음 시로", input: "17 40\n80\n", expected: "19 0", hint: "80분은 1시간 20분이에요." },
    { name: "자정을 지나서", input: "23 50\n20\n", expected: "0 10", hint: "24시는 0시로 바뀌어야 해요." },
  ],
  L: [
    { name: "N=1", input: "1\n", expected: "*", hint: "2×1−1은 1이에요." },
    { name: "문제의 예", input: "3\n", expected: "*****", hint: "2×3−1은 5예요." },
    { name: "N=5", input: "5\n", expected: "*********", hint: "2×5−1은 9예요." },
  ],
  M: [
    { name: "한 층", input: "1\n", expected: "*", hint: "첫째 줄에는 별 1개를 출력해요." },
    { name: "세 층", input: "3\n", expected: "*\n**\n***", hint: "줄 번호와 별 개수가 같아야 해요." },
    { name: "다섯 층", input: "5\n", expected: "*\n**\n***\n****\n*****", hint: "1부터 N까지 모든 줄을 빠뜨리지 않았는지 확인해 보세요." },
  ],
  N: [
    { name: "가운데에서 만남", input: "1 3 2 4\n", expected: "cross", hint: "2와 4는 첫 선 1–3의 서로 다른 쪽에 있어요." },
    { name: "서로 다른 가장자리", input: "1 2 3 4\n", expected: "not cross", hint: "3과 4가 모두 첫 선 1–2의 바깥쪽에 있어요." },
    { name: "번호 순서가 뒤집힌 선", input: "90 10 20 95\n", expected: "cross", hint: "첫 선의 작은 번호와 큰 번호를 먼저 구해 보세요." },
  ],
  O: [
    { name: "버튼 1개", input: "1\n", expected: "1", hint: "틀릴 후보가 없으므로 정답 버튼 한 번만 눌러요." },
    { name: "버튼 2개", input: "2\n", expected: "3", hint: "첫째 자리에서 1번 틀리고, 마지막 성공 때 2번 눌러요." },
    { name: "문제의 예", input: "3\n", expected: "7", hint: "(1×2)+(2×1)+3을 계산해 보세요." },
    { name: "버튼 4개", input: "4\n", expected: "14", hint: "(1×3)+(2×2)+(3×1)+4를 계산해 보세요." },
  ],
};
