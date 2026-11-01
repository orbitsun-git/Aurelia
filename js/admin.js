// 관리자 보안 비밀번호 (실무에서는 Supabase Auth 활용 권장)
const ADMIN_PASSWORD = "admin1234!";

// 관리자 로그인 모달 열기
function openAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

// 관리자 로그인 모달 닫기
function closeAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// 관리자 암호 인증 확인
function verifyAdmin() {
  const input = document.getElementById("admin-pass-input").value;
  if (input === ADMIN_PASSWORD) {
    sessionStorage.setItem("isAdmin", "true");
    alert("관리자로 성공적으로 인증되었습니다.");
    closeAdminModal();
    location.reload();
  } else {
    alert("비밀번호가 올바르지 않습니다.");
  }
}

// 관리자 로그아웃 (필요시 호출)
function logoutAdmin() {
  sessionStorage.removeItem("isAdmin");
  alert("관리자 모드가 해제되었습니다.");
  location.reload();
}
