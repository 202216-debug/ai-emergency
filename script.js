const resultBox = document.getElementById("result");
const judgeBtn = document.getElementById("judge-btn");
const textInput = document.getElementById("symptom-text");
let lastText = "";     // 마지막으로 판정한 증상 (추가 질문 때 함께 보내요)
let mode = "text";     // 지금 선택된 입력 방식: "text"(직접 입력) 또는 "list"(부위별 선택)

// ===== 결과 화면 보여주기 (직접 입력, 부위별 선택, 추가 질문이 같이 사용) =====
function showResult(level, reason, options) {
  let html = "";

  if (level === "red") {
    html =
      '<p class="result-badge">위험</p>' +
      "<h3>즉시 119 신고 필요</h3>" +
      '<p class="result-desc">생명이 위험할 수 있는 증상입니다. 직접 운전하여 이동하지 마십시오.</p>' +
      '<a class="action-btn" href="tel:119">119 전화 연결' +
      '<span class="btn-sub">누르면 전화 앱으로 연결됩니다</span></a>';
  } else if (level === "yellow") {
    html =
      '<p class="result-badge">주의</p>' +
      "<h3>응급실 진료 권장</h3>" +
      '<p class="result-desc">신속한 진료가 필요할 수 있습니다. 가까운 응급실을 확인하십시오.</p>' +
      '<a class="action-btn" href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank">가까운 응급실 찾기' +
      '<span class="btn-sub">중앙응급의료센터(E-Gen) · "내 현위치로 이동"을 누르면 주변 응급실 표시</span></a>';
  } else if (level === "green") {
    html =
      '<p class="result-badge">일반</p>' +
      "<h3>일반 진료 권장</h3>" +
      '<p class="result-desc">응급실보다 동네 병원 진료 또는 비대면 진료가 적합해 보입니다. 증상이 악화되면 다시 판정하거나 119에 신고하십시오.</p>' +
      '<a class="action-btn" href="https://www.e-gen.or.kr/egen/search_hospital.do" target="_blank">진료 중인 병원 찾기' +
      '<span class="btn-sub">중앙응급의료센터(E-Gen) 사이트가 새 창으로 열립니다</span></a>' +
      '<a class="action-btn action-btn-sub" href="https://www.e-gen.or.kr/egen/search_pharmacy.do" target="_blank">문 연 약국 찾기</a>';
  } else if (options && options.length > 0) {
    // AI가 추가 질문을 보내 줬을 때: 확인 항목 + 자유 입력칸
    html =
      '<p class="result-badge">확인 필요</p>' +
      "<h3>추가 정보 필요</h3>" +
      '<p class="result-desc">현재 정보만으로는 판단이 어렵습니다. 해당하는 항목을 모두 선택하십시오.</p>' +
      '<div class="follow-up">' +
      '<p class="follow-label">확인 항목</p>';
    options.forEach(function (option) {
      html += '<label><input type="checkbox" class="follow-option"><span>' + option + "</span></label>";
    });
    html +=
      '<textarea id="follow-text" rows="2" placeholder="기타 증상 입력 (선택)"></textarea>' +
      '<button id="follow-btn" type="button">다시 판정</button>' +
      '<p class="follow-hint">해당 항목이 없으면 그대로 누르십시오</p>' +
      "</div>";
  } else {
    html =
      '<p class="result-badge">확인 필요</p>' +
      "<h3>판단 불가</h3>" +
      '<p class="result-desc">부위별 선택에서 해당 증상을 선택하십시오. 걱정되는 경우 119에 전화하면 의료 상담을 받을 수 있습니다.</p>' +
      '<button class="link-btn" id="goto-list" type="button">부위별 선택으로 이동</button>';
  }

  html += '<p class="reason">판정 근거: ' + reason + "</p>";

  resultBox.className = "result result-" + level;
  resultBox.innerHTML = html;

  // 방금 그린 버튼들에 동작 연결하기
  const followBtn = document.getElementById("follow-btn");
  if (followBtn) {
    followBtn.addEventListener("click", followUp);
  }
  const gotoList = document.getElementById("goto-list");
  if (gotoList) {
    gotoList.addEventListener("click", function () {
      setMode("list");
      document.getElementById("panel-list").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===== AI 판정을 실행하는 공통 함수 =====
async function runAnalysis(text, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "분석 중...";
  judgeBtn.disabled = true;

  lastText = text;
  const answer = await analyzeSymptoms(text);
  showResult(answer.level, answer.reason, answer.options);

  button.disabled = false;
  button.textContent = label;
  judgeBtn.disabled = false;
}

// ===== 입력 방식 전환 (직접 입력 / 부위별 선택) =====
function setMode(newMode) {
  mode = newMode;
  document.querySelectorAll(".mode-btn").forEach(function (btn) {
    const active = btn.dataset.mode === newMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.getElementById("panel-text").hidden = newMode !== "text";
  document.getElementById("panel-list").hidden = newMode !== "list";
}

document.querySelectorAll(".mode-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    setMode(btn.dataset.mode);
  });
});

// ===== 부위 탭 전환 =====
document.querySelectorAll(".part-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    const part = tab.dataset.part;
    document.querySelectorAll(".part-tab").forEach(function (t) {
      t.classList.toggle("is-active", t === tab);
    });
    document.querySelectorAll(".group").forEach(function (group) {
      group.hidden = group.dataset.part !== part;
    });
  });
});

// 부위마다 고른 개수를 탭에 표시 (다른 부위에서 고른 것도 잊지 않게)
document.querySelectorAll(".group").forEach(function (group) {
  group.addEventListener("change", function () {
    const count = group.querySelectorAll('input[type="checkbox"]:checked').length;
    const tab = document.querySelector('.part-tab[data-part="' + group.dataset.part + '"]');
    tab.querySelector(".count").textContent = count > 0 ? count : "";
  });
});

// ===== 하단 "응급도 판정" 버튼: 선택된 방식에 맞는 판정 실행 =====
judgeBtn.addEventListener("click", function () {
  if (mode === "text") {
    judgeByText();
  } else {
    judgeByList();
  }
});

// 방식 1: 직접 입력한 문장으로 AI 판정
function judgeByText() {
  const text = textInput.value.trim();

  if (text === "") {
    alert("증상을 입력하십시오.");
    textInput.focus();
    return;
  }

  runAnalysis(text + getPatientInfo(), judgeBtn);
}

// 방식 2: 부위별 선택 목록으로 규칙 판정
function judgeByList() {
  // .group 안의 체크박스만 세기 (추가 질문 체크박스는 제외)
  const checked = document.querySelectorAll('.group input[type="checkbox"]:checked');

  if (checked.length === 0) {
    alert("증상을 하나 이상 선택하십시오.");
    return;
  }

  let hasRed = false;
  let hasYellow = false;

  checked.forEach(function (box) {
    if (box.value === "red") {
      hasRed = true;
    }
    if (box.value === "yellow") {
      hasYellow = true;
    }
  });

  if (hasRed) {
    showResult("red", "선택한 항목 중 위험 신호가 있습니다.");
  } else if (hasYellow) {
    showResult("yellow", "선택한 항목 중 주의 증상이 있습니다.");
  } else {
    showResult("green", "일반 증상만 선택했습니다.");
  }
}

// ===== 추가 질문에 답하고 다시 판정 =====
function followUp() {
  const yes = [];
  const no = [];

  document.querySelectorAll(".follow-option").forEach(function (box) {
    const optionText = box.parentElement.textContent.trim();
    if (box.checked) {
      yes.push(optionText);
    } else {
      no.push(optionText);
    }
  });

  const extra = document.getElementById("follow-text").value.trim();

  // 처음 증상 + 고른 것 + 고르지 않은 것 + 자유 입력을 합쳐서 다시 보내기
  let combined = lastText + "\n\n[추가 확인]";
  if (yes.length > 0) {
    combined += "\n해당함: " + yes.join(" / ");
  }
  if (no.length > 0) {
    combined += "\n해당하지 않음: " + no.join(" / ");
  }
  if (extra !== "") {
    combined += "\n추가 설명: " + extra;
  }

  runAnalysis(combined, document.getElementById("follow-btn"));
}

// ===== 환자 정보를 글로 정리하기 =====
function getPatientInfo() {
  const age = document.getElementById("age-group").value;
  const conditions = [];
  document.querySelectorAll(".condition:checked").forEach(function (box) {
    conditions.push(box.parentElement.textContent.trim());
  });

  // 아무것도 입력하지 않았으면 빈 글자
  if (age === "" && conditions.length === 0) {
    return "";
  }

  let info = "\n\n[환자 정보]";
  if (age !== "") {
    info += "\n연령대: " + age;
  }
  if (conditions.length > 0) {
    info += "\n기저질환·상태: " + conditions.join(", ");
  }
  return info;
}

// ===== 큰 글씨 모드 =====
const fontToggle = document.getElementById("font-toggle");
const fontToggleLabel = document.getElementById("font-toggle-label");

function applyLargeText(on) {
  // html 글자 크기를 키우면 rem으로 쓴 모든 글자와 여백이 함께 커져요
  document.documentElement.classList.toggle("large-text", on);
  fontToggleLabel.textContent = on ? "기본 글씨" : "글씨 크게";
}

// 지난번에 큰 글씨를 켰는지 브라우저 메모장에서 꺼내 보기
let savedLarge = false;
try {
  savedLarge = localStorage.getItem("largeText") === "on";
} catch (error) {
  // 저장 기능을 쓸 수 없는 브라우저면 그냥 기본 글씨로
}
applyLargeText(savedLarge);

fontToggle.addEventListener("click", function () {
  const on = !document.documentElement.classList.contains("large-text");
  applyLargeText(on);
  try {
    localStorage.setItem("largeText", on ? "on" : "off");
  } catch (error) {
    // 저장에 실패해도 지금 화면에는 적용됨
  }
});
