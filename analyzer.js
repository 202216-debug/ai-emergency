// ===============================================
// 증상 판정기
// 1순위: AI 판정 (Vercel 중계 서버 → Claude)
// 2순위: 키워드 판정 (Baseline, AI가 실패했을 때 예비용)
// 약속: 텍스트를 받아서 { level, reason }을 돌려준다
// ===============================================

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

// 예비 판정기: 키워드 규칙 (Baseline)
async function analyzeByKeywords(text) {
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

// ★ 핵심 판정 함수: AI에게 먼저 묻고, 실패하면 키워드 판정으로 ★
async function analyzeSymptoms(text) {
  async function analyzeByKeywords(text) {
  // "해당하지 않음" 줄은 '없는 증상'이므로 키워드 검사에서 빼기
  text = text.split("\n").filter(function (line) {
    return !line.startsWith("해당하지 않음");
  }).join("\n");

  const red = findKeywords(text, RED_KEYWORDS);
  ...
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
      signal: AbortSignal.timeout(20000),   // 20초 안에 답이 없으면 포기
    });

    if (!response.ok) {
      throw new Error("서버 응답 오류: " + response.status);
    }

    const data = await response.json();
    const options = (data.options || []).map(escapeHtml);
    return { level: data.level, reason: "AI 판정 · " + escapeHtml(data.reason), options: options };
  } catch (error) {
    console.warn("AI 판정 실패 → 키워드 판정으로 전환:", error);
    const backup = await analyzeByKeywords(text);
    backup.reason = "키워드 판정 · " + backup.reason;
    backup.options = [];
    return backup;
  }
}

// AI 답변에 HTML 코드가 섞여 와도 화면에서 실행되지 않게 막기
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}