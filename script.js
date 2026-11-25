const resultBox = document.getElementById("result");
let lastText = "";   // 마지막으로 판정한 증상 (추가 질문 때 함께 보내요)

// ===== 결과 화면 보여주기 (체크리스트, 텍스트 입력, 추가 질문이 같이 사용) =====
function showResult(level, reason, options) {
  let html = "";

  if (level === "red") {
    html =
      "<h2>🚨 지금 바로 119에 연락하세요</h2>" +
      "<p>생명이 위험할 수 있는 증상입니다. 직접 운전해서 이동하지 마세요.</p>" +
      '<a class="action-btn" href="tel:119"> 119 전화 걸기' +
      '<span class="btn-sub">누르면 119 전화 앱으로 연결됩니다.</span></a>';
  } else if (level === "yellow") {
    html =
      "<h2>⚠️ 응급실 방문을 권장합니다</h2>" +
      "<p>빠른 진료가 필요할 수 있습니다. 가까운 응급실을 확인하세요.</p>" +
      '<a class="action-btn" href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank"> 가까운 응급실 찾기' +
      '<span class="btn-sub">중앙응급의료센터 사이트가 새 창으로 열립니다. "내 현위치로 이동"을 누르면 가까운 응급실이 떠요.</span></a>';
    } else if (level === "green") {
    html =
      "<h2> 응급실보다는 일반 진료를 권장합니다</h2>" +
      "<p>지금 문을 연 동네 병원이나 비대면 진료로 충분해 보입니다. 증상이 심해지면 다시 판정하거나 119에 전화하세요.</p>" +
      '<a class="action-btn" href="https://www.e-gen.or.kr/egen/search_hospital.do" target="_blank"> 지금 문 연 병원 찾기' +
      '<span class="btn-sub">중앙응급의료센터 사이트가 새 창으로 열립니다.</span></a>' +
      '<a class="action-btn action-btn-sub" href="https://www.e-gen.or.kr/egen/search_pharmacy.do" target="_blank"> 문 연 약국 찾기</a>';
  } else {
    html = "<h2> 증상을 판단하기 어려워요</h2>";

    if (options && options.length > 0) {
      // AI가 추가 질문을 보내 줬을 때: 선택지 + 자유 입력칸
      html += "<p>정확히 판단하려면 조금 더 알려 주세요. 해당하는 것을 모두 골라 주세요.</p>";
      html += '<div class="follow-up">';
      options.forEach(function (option) {
        html += '<label><input type="checkbox" class="follow-option"> ' + option + "</label>";
      });
      html +=
        '<textarea id="follow-text" rows="2" placeholder="그 밖에 더 알려 줄 내용이 있으면 적어 주세요 (선택)"></textarea>' +
        '<button id="follow-btn">다시 판정하기</button>' +
        "</div>";
    } else {
      html += "<p>아래 보기에서 해당하는 증상을 골라 주세요. 걱정된다면 119에 전화해 의료 상담을 받을 수 있어요.</p>";
    }
  }

  html += '<p class="reason">판정 근거: ' + reason + "</p>";

  resultBox.className = "result result-" + level;
  resultBox.innerHTML = html;

  // 방금 그린 "다시 판정하기" 버튼에 동작 연결하기
  const followBtn = document.getElementById("follow-btn");
  if (followBtn) {
    followBtn.addEventListener("click", followUp);
  }

  resultBox.scrollIntoView({ behavior: "smooth" });
}

// ===== AI 판정을 실행하는 공통 함수 =====
async function runAnalysis(text, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "분석 중...";

  lastText = text;
  const answer = await analyzeSymptoms(text);
  showResult(answer.level, answer.reason, answer.options);

  button.disabled = false;
  button.textContent = label;
}

// ===== 방법 1: 직접 입력한 텍스트로 판정 =====
const textInput = document.getElementById("symptom-text");
const analyzeBtn = document.getElementById("analyze-btn");

analyzeBtn.addEventListener("click", function () {
  const text = textInput.value.trim();

  if (text === "") {
    alert("증상을 입력해 주세요.");
    return;
  }

  runAnalysis(text + getPatientInfo(), analyzeBtn);
});

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

// ===== 방법 2: 체크리스트로 판정 =====
const checkBtn = document.getElementById("check-btn");

checkBtn.addEventListener("click", function () {
  // .group 안의 체크박스만 세기 (추가 질문 체크박스는 제외)
  const checked = document.querySelectorAll('.group input[type="checkbox"]:checked');

  if (checked.length === 0) {
    alert("증상을 하나 이상 선택해 주세요.");
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
    showResult("red", "체크한 항목 중 위험 신호가 있습니다.");
  } else if (hasYellow) {
    showResult("yellow", "체크한 항목 중 주의 증상이 있습니다.");
  } else {
    showResult("green", "일반 증상만 체크했습니다.");
  }
});

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

function applyLargeText(on) {
  document.body.classList.toggle("large-text", on);
  fontToggle.textContent = on ? "기본 글씨로 보기" : "큰 글씨로 보기";
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
  const on = !document.body.classList.contains("large-text");
  applyLargeText(on);
  try {
    localStorage.setItem("largeText", on ? "on" : "off");
  } catch (error) {
    // 저장에 실패해도 지금 화면에는 적용됨
  }
});