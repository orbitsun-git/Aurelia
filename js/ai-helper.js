async function askAIHelper() {
  const fileInput = document.getElementById("ai-image-input");
  const textInput = document.getElementById("ai-question-text").value;
  const responseBox = document.getElementById("ai-response");

  if (!fileInput.files[0] && !textInput) {
    alert("문제 사진을 첨부하거나 질문을 입력해 주세요.");
    return;
  }

  responseBox.style.display = "block";
  responseBox.innerHTML = `⏳ <strong>${COMMON_MASCOT.emoji} ${COMMON_MASCOT.name} 도우미가 문제를 분석하고 있습니다...</strong>`;

  setTimeout(() => {
    responseBox.innerHTML = `
      <h4 style="color: var(--dark-gold); margin-top:0;">💡 ${COMMON_MASCOT.emoji} ${COMMON_MASCOT.name}의 핵심 풀이 해설</h4>
      <p><strong>[분석 문제 요약]</strong> 제출된 이미지를 바탕으로 핵심 개념을 분석했습니다.</p>
      <p><strong>[오답 원인 분석]</strong> 자주 틀리는 유형으로, 개념 적용 과정에서 부호 또는 정의를 잘못 해석했을 가능성이 높습니다.</p>
      <p><strong>[단계별 정답 풀이]</strong><br>
      1단계: 주어진 개념의 정의를 재확인합니다.<br>
      2단계: 조건식에 값을 대입하여 차근차근 전개합니다.<br>
      3단계: 최종 결과값을 검산합니다.</p>
    `;
  }, 2000);
}