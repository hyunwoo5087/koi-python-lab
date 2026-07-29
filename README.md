# KOI Python Lab — Vite React 소스 사본

현재 공개된 KOI Python Lab 12번 배포본을 바탕으로 만든 **독립적인 편집용 소스 사본**입니다. 이 폴더를 수정하거나 GitHub에 올려도 기존 배포 사이트는 바뀌지 않습니다.

## 배포된 사이트

<https://hyunwoo5087.github.io/koi-python-lab/>

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 자동으로 빌드해서 GitHub Pages에 올립니다.

## 바로 실행하기

Node.js 20.19 이상 또는 22.12 이상을 준비한 뒤 프로젝트 폴더에서 실행합니다.

```bash
npm install
npm run dev
```

터미널에 표시된 주소(기본값 `http://localhost:5173`)를 브라우저에서 엽니다.

배포용 파일 확인:

```bash
npm run build
npm run preview
```

## 포함된 기능

- A~O 총 15개 문제
- 요구 찾기 → 작은 예 → 핵심 질문 → 규칙 발견 → 해결 전략 → 코드 확인의 6단계 학습 흐름
- 다이아몬드, 가로등, 퍼즐, 감귤나무, 케이크, 비밀번호 등 문제별 시각화와 조작 활동
- 브라우저 안에서 Python 코드를 실행하는 Skulpt 실행기
- 소스 코드 문자열이 아닌 여러 테스트 입력의 출력으로 판정하는 검사기
- 변수 이름이나 풀이 순서가 다른 정답 코드 인정
- 문법 오류, 들여쓰기, 입력 부족, 변수 이름, 실행 시간 초과 안내
- 브라우저 `localStorage`에 문제 완료 상태만 저장
- 학생이 입력한 Python 코드는 서버나 데이터베이스로 전송하지 않음

## 프로젝트 구조

```text
KOI-Python-Lab-Vite/
├─ public/
│  └─ assets/puzzle-piece.png
├─ src/
│  ├─ components/
│  │  ├─ CodePractice.tsx          # 코드 입력·검사 결과 화면
│  │  └─ GeneralStrategyExplorer.tsx
│  ├─ data/
│  │  ├─ problems.ts               # 15개 문제의 문장·예시 코드·질문
│  │  ├─ guides.ts                 # 문제별 해결 전략과 변수 설명
│  │  └─ codeTests.ts              # 문제별 복수 테스트 입력·정답·힌트
│  ├─ interactions/
│  │  ├─ problems/A.tsx ~ O.tsx    # 문제별 인터랙션 진입 파일
│  │  ├─ ProblemInteraction.tsx    # A~M 공통 시각화 구현
│  │  ├─ CakeSimulator.tsx         # N 케이크 자르기
│  │  ├─ ButtonInteractions.tsx    # O 비밀번호 버튼
│  │  └─ registry.tsx              # 문제 ID와 인터랙션 연결
│  ├─ lib/pythonRunner.ts           # 브라우저 Python 실행 로직
│  ├─ App.tsx                       # 전체 학습 화면과 단계 이동
│  ├─ main.tsx
│  └─ styles.css
├─ DESIGN.md                        # Stitch 및 UI 개선용 디자인 기준
├─ stitch/PROJECT_CONTEXT.md        # Google Stitch 입력용 간단 설명
├─ .github/workflows/build.yml      # GitHub 자동 타입 검사·빌드
├─ package.json
├─ vite.config.ts
└─ .gitignore
```

## 문제를 수정하거나 추가하는 위치

### 문제 문장과 예시 코드

`src/data/problems.ts`를 수정합니다. 문제 객체의 `id`는 A~O 인터랙션 및 테스트와 연결되므로 기존 ID를 바꿀 때는 관련 파일도 함께 수정합니다.

### 정답 검사값

`src/data/codeTests.ts`에서 문제별 테스트를 수정합니다. 검사기는 학생 코드와 예시 코드가 같은지 비교하지 않습니다. 학생 코드를 각 `input`으로 실행한 뒤 출력이 `expected`와 같은지 확인합니다.

각 문제에 다음 유형을 포함하는 것이 좋습니다.

1. 문제에 나온 예제
2. 가장 작은 입력 또는 경곗값
3. 홀수·짝수, 자정 통과 등 규칙이 달라지는 입력
4. 단순히 예제만 출력하는 코드가 실패할 숨은 입력

### 문제별 그림과 조작 활동

- A~M: `src/interactions/ProblemInteraction.tsx`
- N: `src/interactions/CakeSimulator.tsx`
- O: `src/interactions/ButtonInteractions.tsx`
- 문제별 진입점: `src/interactions/problems/`

퍼즐 조각 이미지는 `public/assets/puzzle-piece.png`에 있습니다. `public` 안의 파일은 `/assets/puzzle-piece.png`처럼 루트 경로로 사용합니다.

### Python 실행기

`src/lib/pythonRunner.ts`가 Skulpt를 동적으로 불러와 학생 코드를 브라우저에서 실행합니다. 실행 결과만 화면 상태에 사용되며 별도 서버 API는 없습니다.

## GitHub에 올리기

ZIP을 풀고 프로젝트 폴더에서 다음을 실행합니다.

```bash
git init
git add .
git commit -m "Initial KOI Python Lab Vite source"
git branch -M main
git remote add origin <새 GitHub 저장소 주소>
git push -u origin main
```

`node_modules`와 `dist`는 `.gitignore`에 포함되어 있으므로 GitHub에 올라가지 않습니다.


## GitHub 자동 검사

`main` 또는 `stitch-redesign` 브랜치에 코드를 올리거나 Pull Request를 만들면 GitHub Actions가 다음 작업을 자동으로 확인합니다.

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`

초록색 체크가 표시되면 의존성 설치, TypeScript 검사, Vite 빌드가 모두 통과한 것입니다.

## Google Stitch에서 활용하기

Stitch에서 화면을 새로 설계하거나 수정할 때 `stitch/PROJECT_CONTEXT.md`의 내용을 프로젝트 설명으로 사용하고, 완성된 디자인을 이 프로젝트의 React 컴포넌트와 CSS에 반영합니다. 데이터·검사기·Python 실행 로직은 디자인 파일과 분리되어 있어 화면을 바꿔도 학습 기능을 유지할 수 있습니다.

## 주의 사항

- 이 검사기는 학습용 복수 테스트 검사기입니다. KOISTUDY 공식 채점의 모든 비공개 테스트를 대신하지는 않습니다.
- `public`의 파일명이나 경로를 바꾸면 React 코드의 `/assets/...` 경로도 함께 바꿉니다.
- 외부 웹 글꼴을 사용하지 않고 운영체제의 한글 글꼴을 우선 사용하므로 오프라인 개발에서도 글자가 깨지지 않습니다.

## Stitch 이미지 기반 UI 사본

`stitch/reference-final.png`를 참고한 반응형 UI가 적용되어 있습니다. 홈 대시보드, A~O 문제 지도, STEP 2 학습 인터랙션, STEP 6 코드·테스트 화면이 실제 문제 데이터 및 기존 판정 로직과 연결됩니다. 구현 범위와 검증 내용은 `stitch/IMPLEMENTATION_NOTES.md`를 참고하세요.
