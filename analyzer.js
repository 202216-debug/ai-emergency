
const RED_KEYWORDS = ["숨이", "호흡", "가슴", "흉통", "마비", "힘이 빠", "말이 어눌",
                      "의식", "기절", "쓰러", "경련", "발작", "피가 멈추지"];
const YELLOW_KEYWORDS = ["고열", "39도", "40도", "배가 너무", "심한 복통", "토했", "토할", "구토",
                         "머리를 부딪", "부러"];
const GREEN_KEYWORDS = ["콧물", "기침", "목이 아", "미열", "설사", "멍", "긁"];

// 텍스트 안에 들어 있는 키워드만 골라내는 함수
function findKeywords(text, keywords) {
  const found = [];
  keywords.forEach(function (word) {
    if (text.includes(word)) {
      found.push(word);
    }
  });
  return found;
}

// AI가 생각하는 시간을 흉내 내는 함수 (ms = 1000분의 1초)
function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ★ 핵심 판정 함수 ★
async function analyzeSymptoms(text) {
  await wait(1000);   // 진짜 AI처럼 1초 기다리기

  const red = findKeywords(text, RED_KEYWORDS);
  if (red.length > 0) {
    return { level: "red", reason: "위험 신호 표현 발견: " + red.join(", ") };
  }

  const yellow = findKeywords(text, YELLOW_KEYWORDS);
  if (yellow.length > 0) {
    return { level: "yellow", reason: "주의 증상 표현 발견: " + yellow.join(", ") };
  }

  const green = findKeywords(text, GREEN_KEYWORDS);
  if (green.length > 0) {
    return { level: "green", reason: "일반 증상 표현 발견: " + green.join(", ") };
  }

  return { level: "unknown", reason: "판단할 수 있는 표현을 찾지 못했습니다." };
}