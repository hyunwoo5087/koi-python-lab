# Supabase 설정 체크리스트 — v0.6.0

손으로 하는 자세한 절차는 [MANUAL_SETUP_KO.md](MANUAL_SETUP_KO.md)를 보세요.
이 문서는 짧은 체크리스트입니다.

## 1. 준비

- [ ] Node.js 20.19 이상 또는 22.12 이상 설치
- [ ] Supabase Dashboard에서 새 프로젝트 생성 (무료 플랜으로 충분, 지역은 Seoul 권장)
- [ ] **Settings → API** 에서 Project URL 확인
- [ ] **Settings → API Keys** 에서 Publishable key(`sb_publishable_...`) 확인

> `sb_secret_...` 와 `service_role` 키는 브라우저 앱에 쓰지 않습니다.
> 실수로 넣었다면 Supabase에서 그 키를 곧바로 폐기(revoke)하세요.

## 2. 설정

프로젝트 폴더에서 다음 한 줄을 실행합니다.

```
npm run setup:supabase
```

Windows에서 `setup-supabase-easy.cmd`를 두 번 눌러도 같은 스크립트가 실행됩니다.

스크립트가 하는 일:

- [ ] Project Ref와 Publishable key 입력 받기 (대시보드 주소를 붙여 넣어도 인식)
- [ ] `.env.local` 만들기
- [ ] `supabase/schema.sql` 을 클립보드에 복사
- [ ] SQL Editor 열기
- [ ] 붙여넣기 + Run 을 마친 뒤 연결 확인

## 3. 스키마 실행

- [ ] Supabase Dashboard → **SQL Editor** → **New query**
- [ ] `Ctrl+V` 로 붙여넣기
- [ ] 오른쪽 아래 **Run**
- [ ] `Success. No rows returned` 확인

`schema.sql`은 여러 번 실행해도 안전합니다.
이미 저장된 과제와 학생 제출 기록은 지워지지 않습니다.

## 4. 확인

```
npm run verify:supabase
```

`[성공] Supabase 백엔드에 연결되었습니다. 스키마 0.6.0` 이 나오면 됩니다.

앱 안에서도 확인할 수 있습니다.

- [ ] `npm run dev` 실행
- [ ] **교사 대시보드 → 서버 배포** 로 이동
- [ ] 화면 아래 **연결 진단** 의 8단계가 모두 초록색인지 확인

## 5. 교사·학생 흐름

- [ ] 서버 배포 화면에서 **교사 계정 만들기** → 로그인
- [ ] **문제 제작·관리** 에서 낼 문제를 공개 상태로 두기
- [ ] 서버 배포에서 과제 코드(예: `DEOKGYE-6A`)와 이름을 정하고 **게시**
- [ ] 다른 브라우저에서 **학생 평가 시작** → 이름 → 과제 코드 → **과제 코드로 시작**
- [ ] 학생 완료 화면에 "서버 제출이 완료되었습니다" 확인
- [ ] 교사 화면에서 **서버 기록 새로고침** → 제출이 표에 나타나는지 확인

> 교사 계정 만들기 후 인증 메일을 기다려야 한다면,
> Supabase의 **Authentication → Sign In / Providers → Email** 에서
> `Confirm email` 을 잠시 끄면 수업 준비가 빨라집니다.

## 6. 막혔을 때

| 증상 | 확인할 곳 |
| --- | --- |
| 배치 파일이 안 열림 | [MANUAL_SETUP_KO.md](MANUAL_SETUP_KO.md) 1번 |
| `Supabase 환경 변수가 설정되지 않았습니다` | `.env.local` 이름이 `.env.local.txt` 가 아닌지 |
| `.env.local`을 고쳤는데 반영되지 않음 | 개발 서버를 껐다가 다시 켜기 |
| `get_backend_status` 를 찾을 수 없음 | 3번 스키마 실행 |
| `Invalid API key` | 키가 같은 프로젝트의 값인지 |
| 그 밖의 모든 경우 | 앱의 **연결 진단** 화면 |

## 7. ZIP이 Windows에 의해 차단된 경우

1. ZIP 파일 우클릭 → **속성**
2. 아래쪽 **차단 해제** 체크 → 적용
3. 다시 압축 해제
