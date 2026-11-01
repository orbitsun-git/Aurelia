# 🌟 Gold Class AI 학습 지원 플랫폼

과목별 귀여운 동물 마스코트와 함께하는 프리미엄 화이트 & 골드 테마 학습 웹 사이트입니다. 
유튜브 강의 시청, 학습 자료 다운로드, 학생 소통 커뮤니티, 그리고 AI 오답 노트/질문 해설 기능을 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)
- **Frontend:** HTML5, CSS3 (Custom Gold & White Theme), Vanilla JavaScript
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Storage)
- **AI Helper:** Simulated AI Problem Solving Module

---

## 📂 파일 구조
```text
learning-platform/
├── index.html                 # 메인 과목 선택 페이지
├── subject.html               # 세부 과목 페이지 (강의, 자료, AI, 댓글)
├── css/
│   └── style.css              # 화이트 & 골드 테마 디자인
├── js/
│   ├── config.js              # Supabase 및 과목 설정
│   ├── main.js                # 메인 페이지 로직
│   ├── subject.js             # 세부 과목 및 커뮤니티 로직
│   ├── admin.js               # 관리자 인증 모듈
│   └── ai-helper.js           # AI 문제 풀이 해설 모듈
└── supabase/
    └── schema.sql             # 데이터베이스 및 RLS 보안 설정 SQL
