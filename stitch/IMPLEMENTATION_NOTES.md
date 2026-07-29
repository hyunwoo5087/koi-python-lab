# Stitch 이미지 기반 구현 메모

이 사본은 `stitch/reference-final.png`의 홈·문제 학습·코드 확인 화면을 참고하여 기존 React 프로젝트에 직접 구현한 버전입니다.

## 구현한 화면

- 앱 첫 진입 시 홈 및 전체 문제 지도
- A~O 15개 문제 카드와 완료·진행 중·시작 전 상태
- 데스크톱 고정 문제 지도와 모바일 드로어
- 문제 화면의 6단계 상단 내비게이션
- STEP 2 인터랙션 + 학생 생각 기록 패널
- STEP 6 코드 편집기 + 대표 실행 + 전체 테스트 판정
- 모바일 1열 카드, 세로형 코드 결과 배치

## 유지한 핵심 기능

- `src/data/problems.ts`의 15개 문제 데이터
- `src/data/codeTests.ts`의 복수 테스트 기반 판정
- `src/lib/pythonRunner.ts`의 브라우저 내부 Python 실행
- `src/interactions/registry.tsx`의 문제별 인터랙션 연결
- 여러 형태의 올바른 코드를 인정하는 출력 기반 검사

## 추가 저장 키

- `koi-started`: 시작한 문제 목록
- `koi-stages`: 문제별 도달 단계
- `koi-notes`: STEP 2에서 기록한 학생 생각
- 기존 `koi-progress`: 완료 문제 목록

## 검증 상태

- 전체 TS/TSX 31개 파일의 구문 분석 통과
- 상대 경로 import 누락 없음
- 작업 환경의 내부 npm 저장소에서 프로젝트가 지정한 최신 Vite 패키지를 제공하지 않아 `npm install`과 최종 Vite 빌드는 이 환경에서 실행하지 못함
- 일반 인터넷 연결이 가능한 환경 또는 GitHub Actions에서 `npm ci`, `npm run typecheck`, `npm run build` 실행 필요
