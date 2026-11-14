# Aurelia Google Drive PDF 연결

## 이 패키지의 범위
현재 제공된 텍스트 코드의 HTML/JS/CSS 전체와 Drive 확장 기능입니다. 이미지, 뉴스 데이터, GitHub workflow는 텍스트 첨부에 없어서 포함하지 않았습니다. 기존 프로젝트를 삭제하지 말고 합쳐 덮어쓰세요. 기존 js/config.js는 덮어쓰지 않도록 패키지에서 제외했습니다.

## 제공 기능
- 관리자 화면 아래 접을 수 있는 ‘Google Drive PDF · 과목 암호 관리’ 영역 추가. 기존 6탭은 유지.
- 과정/학년/학기/과목 선택, 과목별 4자리 암호 설정 및 변경. 0으로 시작 가능.
- PDF 100MiB까지 Drive로 직접 전송하여 Vercel 함수의 본문 용량 제한을 피함.
- 학생 과목 화면에 PDF 목록 표시, 서버에서 암호 확인 후 Drive 열기 링크 표시.
- 관리자가 등록 자료 삭제 시 Drive 휴지통 이동. 휴지통을 비워야 실제 저장 용량이 회수됩니다.
- 기존 학습 링크와 이미지 게시물 기능은 유지. 이번 별도 PDF 목록에는 제목/파일 수정 기능은 없습니다. 필요하면 삭제 후 재등록합니다.

## 주의
파일은 ‘링크를 아는 모든 사용자 읽기’로 공개됩니다. 과목 암호는 Aurelia 입구만 보호하며, 열람 후 공유된 Drive URL은 암호 없이 열립니다. 공개하면 안 되는 자료에는 사용하지 마세요.
암호 자체/해시/Drive 파일 ID는 공개 DB 조회에서 분리했습니다. 제목/설명/과목 정보는 공개입니다. 과목별 암호는 학년·학기까지 구분됩니다.
4자리는 강력한 인증 수단이 아닙니다. 서버는 IP+과목 기준 10분 10회로 제한합니다. 공유 네트워크 사용자는 제한을 함께 받을 수 있습니다.
Drive 업로드 URL은 임시 쓰기 권한이므로 다른 사람에게 공유하지 마세요. 업로드 중 창을 닫거나 등록 마무리가 실패하면 Drive에 미등록 파일이 남을 수 있습니다. 운영자가 주기적으로 정리해야 합니다. 업로드를 강제로 중단하는 기능은 없습니다.
Google 정책/학교 계정 정책이 ‘누구나 읽기’를 금지하면 등록이 실패합니다. Drive 전체 계정 용량 한도를 늘리는 코드는 아닙니다.

## 1. SQL 실행
Supabase SQL Editor에서 drive-update.sql만 실행하세요. 기존 server-setup.sql 등은 재실행할 필요 없습니다. 기존 로그인과 관리자 app_metadata.role=admin을 사용합니다.

## 2. Google 계정 연결
이 단계는 사용자가 직접 해야 하며, 코드가 대신 계정을 연결하지 않습니다.
1) Google Cloud Console에서 프로젝트 생성/선택 → Google Drive API 활성화.
2) Google Auth Platform(OAuth 동의 화면) 설정. 개인 계정이면 외부 사용자, 테스트 상태면 자신을 테스트 사용자로 추가.
3) OAuth 클라이언트 생성 → 웹 애플리케이션. 아래 Google OAuth Playground를 사용할 경우 승인된 리디렉션 URI에 https://developers.google.com/oauthplayground 를 등록.
4) https://developers.google.com/oauthplayground 에서 톱니바퀴 → Use your own OAuth credentials → 본인의 클라이언트 ID/시크릿 입력. OAuth flow server-side, Access type offline 사용.
5) Drive 권한 https://www.googleapis.com/auth/drive 를 선택하여 폴더 소유자 계정으로 승인. 이 범위는 넓은 권한이므로 Aurelia 전용 Google 계정 사용을 권장합니다. 다른 사용자에게 서비스로 제공하려면 Google의 동의/검증 요건을 별도 확인해야 합니다.
6) Exchange authorization code for tokens → Refresh token을 본인 Vercel 환경변수에 저장. 토큰/시크릿은 채팅이나 GitHub에 올리지 마세요.
7) 외부 앱이 테스트 상태이면 Drive 권한 리프레시 토큰이 단기간(통상 7일) 후 만료될 수 있습니다. 지속 운영 시 게시 상태와 계정 정책 확인이 필요합니다. 재인증/철회 시 새 토큰으로 교체하세요.
저장 대상 폴더: https://drive.google.com/drive/folders/1Ivgq9raj_BjSLxnmubtiASV3C0b6BjX-
현재 구현은 이 폴더 바로 아래에 PDF를 저장합니다. 과목 분류는 DB로 처리하며 과목별 하위 폴더 자동 생성은 포함하지 않았습니다.

## 3. Vercel 환경변수
프로젝트 Settings → Environment Variables에서 아래 이름으로 설정. Production/Preview 환경에 맞게 지정 후 재배포하세요.
SUPABASE_URL = 현재 Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY = 서버 전용 service_role 키 (공개 키 아님)
GOOGLE_CLIENT_ID = Google OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET = Google OAuth 클라이언트 시크릿
GOOGLE_REFRESH_TOKEN = 위에서 받은 refresh token
PIN_PEPPER = 비밀번호 생성기로 만든 충분히 긴 임의 문자열(32자 이상 권장). 변경하면 기존 과목 암호를 모두 재설정해야 합니다.
비밀 키는 js/config.js에 절대 넣지 마세요. .env 파일도 Git에 올리지 마세요.

## 4. 배포
패키지 내용물을 기존 프로젝트 루트에 합쳐 덮어쓰기. api/drive.js는 index.html과 같은 루트의 api 폴더에 있어야 합니다. Vercel Root Directory도 이 프로젝트 폴더로 맞추세요. 기존 package.json이 있다면 덮어쓰지 않습니다. 이 코드는 Node 내장 기능만 사용합니다. 기존 package.json에 type: module이 있으면 이 CommonJS API와 호환 조정이 필요합니다.
새 js/drive-pdf.js는 index.html의 맨 마지막 스크립트로 연결되어 있습니다. GitHub 업로드 후 Vercel 재배포.
Live Server만으로는 /api/drive가 실행되지 않습니다. Vercel 배포 URL에서 테스트하세요. 기존 vercel.json의 모든 경로 rewrite가 API를 가로채지 않는지 확인하세요.

## 5. 검증 순서
관리자 로그인 → Google Drive 관리 펼치기 → 대상 과목/학년/학기 선택 → 4자리 암호 저장 → 작은 PDF 등록 → Drive 폴더 확인 → 학생 과목 화면 → 틀린 암호/올바른 암호 테스트 → 다른 과목 PDF 확인 → 삭제/휴지통 확인.
미리보기는 성공 시 표시된 ‘PDF 열기’를 한번 더 눌러 새 탭으로 엽니다(팝업 차단 방지).

## 6. 유지관리
대용량 업로드 실패 시 Google API 제한/공유 정책/저장 용량과 CORS 응답을 확인합니다. 업로드는 단일 PUT으로 현재 일시중지/재개 UI는 없습니다.
aurelia_drive_pending 중 오래된 완료되지 않은 행, aurelia_drive_attempts의 오래된 카운터는 운영자가 주기적으로 정리하세요. 민감한 로그는 남기지 마세요.

## 검증 범위
로컬 JS 문법/패키지 참조/암호 해시 및 제한 함수 설계 검사만 완료. 실제 Google OAuth, Drive 업로드 CORS, Supabase RLS, Vercel API의 통합 테스트는 사용자 계정 연결 전이므로 미완료입니다.
