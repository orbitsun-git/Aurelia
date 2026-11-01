// 파일 위치: js/config.js
(function () {
  "use strict";

  const semester = "2학년 2학기";

  window.SUBJECT_CONFIG = {
    reading: {
      name: "독서와작문",
      emoji: "📖",
      mascot: "🍀 클로버",
      desc: "",
      semester
    },
    english2: {
      name: "영어2",
      emoji: "🔤",
      mascot: "🍀 클로버",
      desc: "",
      semester
    },
    calculus2: {
      name: "미적분2",
      emoji: "∫",
      mascot: "🍀 클로버",
      desc: "",
      semester
    },
    genetics: {
      name: "생물의유전",
      emoji: "🧬",
      mascot: "🍀 클로버",
      desc: "",
      semester
    },
    chemistry: {
      name: "화학",
      emoji: "⚗️",
      mascot: "🍀 클로버",
      desc: "",
      semester
    },
    ethics: {
      name: "현대사회와윤리",
      emoji: "⚖️",
      mascot: "🍀 클로버",
      desc: "",
      semester
    }
  };

  const semesters = [
    "1학년 1학기",
    "1학년 2학기",
    "2학년 1학기",
    "2학년 2학기",
    "3학년 1학기",
    "3학년 2학기"
  ];

  // 브라우저에 저장된 추가 과목을 검사합니다.
  window.validGoldSubjects = function (data) {
    const result = {};

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return result;
    }

    Object.entries(data).forEach(([id, item]) => {
      if (!/^custom_[a-z0-9_]+$/.test(id)) return;

      if (
        !item ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        item.name.length > 40
      ) {
        return;
      }

      if (!semesters.includes(item.semester)) return;

      result[id] = {
        name: item.name.trim(),
        semester: item.semester,
        emoji:
          typeof item.emoji === "string"
            ? item.emoji.slice(0, 16)
            : "📚",
        mascot: "🍀 클로버",
        desc: ""
      };
    });

    return result;
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem("gold-class-custom-subjects-v1") || "{}"
    );

    Object.assign(
      window.SUBJECT_CONFIG,
      window.validGoldSubjects(saved)
    );
  } catch (error) {
    console.warn("저장된 추가 과목을 불러오지 못했습니다.", error);
  }

  // 기존 메인 화면과의 호환용입니다.
  // 실제 영상·자료 업로드에는 Supabase 관리자 로그인이 필요합니다.
  window.ADMIN_PASSWORD = "admin1234!";

  const sdk = window.supabaseSDK || window.supabase;

  if (!sdk || typeof sdk.createClient !== "function") {
    console.error(
      "Supabase 라이브러리를 불러오지 못했습니다. 인터넷 연결과 HTML의 CDN 스크립트를 확인하세요."
    );
    return;
  }

  window.supabaseSDK = sdk;

  const SUPABASE_URL =
    "https://yzpajsjptweyenjpmhxh.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_HZWY61WcmlS7L7dgF92WZw_-yA-qa9K";

  window.supabase = sdk.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
})();
