// 교체 위치: js/main.js
(function () {
  "use strict";
  const SEMESTERS = ["1학년 1학기", "1학년 2학기", "2학년 1학기", "2학년 2학기", "3학년 1학기", "3학년 2학기"];
  const SYMBOLS = {
    reading: ["文", "독서·작문", "#fff3e4"],
    english2: ["Aa", "ENGLISH", "#eaf3ff"],
    calculus2: ["∫", "CALCULUS", "#f0ecff"],
    genetics: ["🧬", "GENETICS", "#e8f7ed"],
    chemistry: ["⚗️", "CHEMISTRY", "#e7f5f7"],
    ethics: ["⚖️", "ETHICS", "#fff1e7"]
  };
  let selected = "2학년 2학기";
  try {
    const saved = localStorage.getItem("gold-class-selected-semester");
    if (SEMESTERS.includes(saved)) selected = saved;
  } catch (_) {}
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function customSubjects() {
    try {
      const data = JSON.parse(localStorage.getItem("gold-class-custom-subjects-v1") || "{}");
      return window.validGoldSubjects(data);
    } catch (_) { return {}; }
  }
  function render() {
    const grid = document.getElementById("subject-grid");
    if (!grid) return;
    grid.replaceChildren();
    const config = window.SUBJECT_CONFIG || {};
    Object.entries(config).forEach(([id, item]) => {
      if (item.semester !== selected) return;
      const card = el("a", "subject-card gc-card");
      card.href = "subject.html?id=" + encodeURIComponent(id);
      const preset = SYMBOLS[id];
      const visual = el("div", "gc-symbol");
      visual.style.background = preset ? preset[2] : "#f2f5eb";
      visual.append(el("span", "gc-mark", preset ? preset[0] : item.emoji || "📚"));
      if (preset) visual.append(el("span", "gc-tag", preset[1]));
      card.append(visual, el("div", "card-title", item.name));
      grid.append(card);
    });
    const add = el("button", "gc-add", "+ 과목 추가");
    add.type = "button";
    add.addEventListener("click", () => {
      document.getElementById("gc-add-semester").textContent = selected;
      const dialog = document.getElementById("gc-add-dialog");
      document.getElementById("gc-add-form").reset();
      dialog.showModal();
    });
    grid.append(add);
  }
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("subject-grid");
    if (!grid) return;
    const style = el("style");
    style.textContent = `
      .gc-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}
      .gc-tools label{font-weight:700;color:#705511}
      .gc-tools select{width:auto;min-width:180px;margin:0;padding:10px 14px;background:white;border:1px solid #d6bb68;border-radius:10px;color:#3a3425}
      .gc-card{min-height:180px;justify-content:center;box-sizing:border-box;gap:16px}
      .gc-card .card-title{margin:0;color:#705511}
      .gc-symbol{width:104px;height:104px;border-radius:25px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#564628;gap:4px}
      .gc-mark{font-size:44px;font-weight:700;line-height:1.1}
      .gc-tag{font-size:9px;letter-spacing:1px;font-weight:700}
      .gc-add{min-height:230px;background:#fffdf5;border:2px dashed #ceb260;border-radius:14px;color:#705511;font:inherit;font-weight:700;font-size:19px;cursor:pointer}
      .gc-add:hover{background:#fff5d5}
      #gc-add-dialog{width:min(420px,85vw);border:1px solid #d6bb68;border-radius:18px;padding:26px;color:#2c2c2c}
      #gc-add-dialog::backdrop{background:rgba(0,0,0,.4)}
      .gc-actions{display:flex;gap:10px;justify-content:flex-end}
      .gc-note{font-size:13px;color:#665b42;line-height:1.6}
      .gc-tools select:focus-visible,.gc-add:focus-visible,.gc-card:focus-visible{outline:3px solid #66531e;outline-offset:4px}
    `;
    document.head.append(style);
    // 기존 마스코트 안내 문구를 제거합니다.
    const parent = grid.parentElement;
    Array.from(parent.children).forEach(node => {
      if (node.tagName === "P" && node.textContent.includes("마스코트")) node.remove();
    });
    const tools = el("div", "gc-tools");
    const label = el("label", "", "학년 · 학기");
    label.htmlFor = "gc-semester";
    const select = el("select");
    select.id = "gc-semester";
    SEMESTERS.forEach(name => {
      const option = el("option", "", name);
      option.value = name;
      select.append(option);
    });
    select.value = selected;
    select.addEventListener("change", () => {
      selected = select.value;
      try { localStorage.setItem("gold-class-selected-semester", selected); } catch (_) {}
      render();
    });
    tools.append(label, select);
    parent.prepend(tools);
    const dialog = el("dialog");
    dialog.id = "gc-add-dialog";
    const heading = el("h2", "", "과목 추가");
    const semester = el("p");
    semester.id = "gc-add-semester";
    const form = el("form");
    form.id = "gc-add-form";
    const nameLabel = el("label", "", "과목 이름");
    nameLabel.htmlFor = "gc-subject-name";
    const name = el("input");
    name.id = "gc-subject-name";
    name.required = true;
    name.maxLength = 40;
    name.placeholder = "예: 물리학";
    const iconLabel = el("label", "", "과목 상징");
    iconLabel.htmlFor = "gc-subject-icon";
    const icons = el("select");
    icons.id = "gc-subject-icon";
    ["📚", "📖", "🔤", "∫", "🧬", "⚗️", "⚖️", "🌍", "⚛️", "💻", "🎨", "🎵"].forEach(icon => {
      const option = el("option", "", icon); option.value = icon; icons.append(option);
    });
    const note = el("p", "gc-note", "추가한 과목은 이 브라우저에만 저장됩니다. 다른 기기와 공유되지 않으며, 사이트 데이터를 삭제하면 사라집니다.");
    const actions = el("div", "gc-actions");
    const cancel = el("button", "btn btn-secondary", "취소");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const save = el("button", "btn", "추가하기");
    save.type = "submit";
    actions.append(cancel, save);
    form.append(nameLabel, name, iconLabel, icons, note, actions);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const title = name.value.trim();
      if (!title) { name.focus(); return; }
      const existing = Object.values(window.SUBJECT_CONFIG || {}).some(item => item.semester === selected && item.name === title);
      if (existing) { alert("이 학기에 같은 이름의 과목이 이미 있습니다."); return; }
      const data = customSubjects();
      const id = "custom_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
      const subject = { name: title, semester: selected, emoji: icons.value, mascot: "🍀 클로버", desc: "" };
      data[id] = subject;
      try {
        localStorage.setItem("gold-class-custom-subjects-v1", JSON.stringify(data));
      } catch (_) { alert("브라우저 저장소를 사용할 수 없어 과목을 저장하지 못했습니다."); return; }
      window.SUBJECT_CONFIG[id] = subject;
      dialog.close();
      render();
    });
    dialog.append(heading, semester, form);
    document.body.append(dialog);
    render();
  });
  window.openAdminModal = function () {
    const modal = document.getElementById("admin-modal");
    if (modal) modal.style.display = "flex";
  };
  window.closeAdminModal = function () {
    const modal = document.getElementById("admin-modal");
    if (modal) modal.style.display = "none";
  };
  window.verifyAdmin = function () {
    const input = document.getElementById("admin-pass-input");
    if (!input) return;
    if (!window.ADMIN_PASSWORD || input.value !== window.ADMIN_PASSWORD) {
      alert("암호가 올바르지 않습니다."); return;
    }
    try { sessionStorage.setItem("isAdmin", "true"); }
    catch (_) { alert("브라우저 세션 저장소를 사용할 수 없습니다."); return; }
    alert("관리자로 인증되었습니다.");
    window.closeAdminModal();
    location.reload();
  };
})();
