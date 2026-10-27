const resultBox = document.getElementById("result");

// ===== 결과 화면 보여주기 (체크리스트, 텍스트 입력이 같이 사용) =====
function showResult(level, reason) {
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
      "<h2> 비대면 진료를 권장합니다</h2>" +
      "<p>응급실보다는 야간·휴일 비대면 진료나 다음 날 외래 진료가 적합해 보입니다.</p>" +
      '<a class="action-btn" href="#"> 비대면 진료 연결하기' +
      '<span class="btn-sub">데모 버튼입니다.</span></a>';
  } else {
    html =
      "<h2> 증상을 판단하기 어려워요</h2>" +
      "<p>아래 보기에서 해당하는 증상을 골라 주세요. 걱정된다면 119에 전화해 의료 상담을 받을 수 있어요.</p>";
  }

  html += '<p class="reason">판정 근거: ' + reason + "</p>";

  resultBox.className = "result result-" + level;
  resultBox.innerHTML = html;
  resultBox.scrollIntoView({ behavior: "smooth" });
}

// ===== 방법 1: 직접 입력한 텍스트로 판정 =====
const textInput = document.getElementById("symptom-text");
const analyzeBtn = document.getElementById("analyze-btn");

analyzeBtn.addEventListener("click", async function () {
  const text = textInput.value.trim();

  if (text === "") {
    alert("증상을 입력해 주세요.");
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "분석 중...";

  const answer = await analyzeSymptoms(text);
  showResult(answer.level, answer.reason);

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = "판정하기";
});

// ===== 방법 2: 체크리스트로 판정 =====
const checkBtn = document.getElementById("check-btn");

checkBtn.addEventListener("click", function () {
  const checked = document.querySelectorAll('input[type="checkbox"]:checked');

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