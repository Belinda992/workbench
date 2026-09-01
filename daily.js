/* ============ 每日开启：天气提醒 + 正能量话语 ============
   依赖 app.js 中的全局：$、$$、store、toast
*/

// ---------- 每日正能量话语 ----------
const QUOTES = [
  "每一天都是新的开始，慢慢来，比较快。",
  "你不需要很厉害才能开始，但你需要开始才能很厉害。",
  "把平凡的事做好，就是不平凡。",
  "今天的努力，是明天的运气。",
  "照顾好自己，才有力气照顾世界。",
  "心若向阳，无畏悲伤。",
  "小步快跑，也能抵达远方。",
  "允许自己偶尔慢下来，是为了走得更远。",
  "你所热爱的，终将照亮你。",
  "温柔地对待自己，认真地对待生活。",
  "不必追光，你自己就是光。",
  "把日子过成自己喜欢的样子，就是成功。",
  "深呼吸，今天也值得期待。",
  "行动是治愈焦虑最好的药。",
  "你比自己以为的，更有力量。",
  "三餐四季，温柔有序，便是好生活。",
  "种一棵树最好的时间是十年前，其次是现在。",
  "带着善意出发，世界会回以温柔。",
  "忙碌里也要留一点缝隙，让光照进来。",
  "你已经做得很好了，继续就好。",
  "把注意力放在能改变的事上，心就安稳了。",
  "今天的你，比昨天又多懂了一点。",
  "生活明朗，万物可爱。",
  "先成为自己的太阳，再温暖身边的人。",
];

function dailyQuote() {
  // 按天取固定一句，保证当天不变
  const dayIndex = Math.floor(Date.now() / 86400000);
  return QUOTES[dayIndex % QUOTES.length];
}
function renderQuote() {
  const el = $("#dbQuote");
  if (el) el.textContent = dailyQuote();
}
$("#dbQuoteBtn").addEventListener("click", () => {
  $("#dbQuote").textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
});

// ---------- 天气提醒 ----------
// WMO 天气代码 -> 图标 / 文字 / 贴心提醒
function weatherInfo(code) {
  const map = {
    0: ["☀️", "晴"], 1: ["🌤️", "晴间多云"], 2: ["⛅", "多云"], 3: ["☁️", "阴"],
    45: ["🌫️", "雾"], 48: ["🌫️", "雾凇"],
    51: ["🌦️", "毛毛雨"], 53: ["🌦️", "毛毛雨"], 55: ["🌦️", "毛毛雨"],
    56: ["🌧️", "冻毛毛雨"], 57: ["🌧️", "冻毛毛雨"],
    61: ["🌧️", "小雨"], 63: ["🌧️", "中雨"], 65: ["🌧️", "大雨"],
    66: ["🌧️", "冻雨"], 67: ["🌧️", "冻雨"],
    71: ["🌨️", "小雪"], 73: ["🌨️", "中雪"], 75: ["❄️", "大雪"], 77: ["🌨️", "雪粒"],
    80: ["🌦️", "阵雨"], 81: ["🌦️", "阵雨"], 82: ["⛈️", "强阵雨"],
    85: ["🌨️", "阵雪"], 86: ["🌨️", "阵雪"],
    95: ["⛈️", "雷阵雨"], 96: ["⛈️", "雷阵雨伴冰雹"], 99: ["⛈️", "雷阵雨伴冰雹"],
  };
  const info = map[code] || ["🌡️", "未知"];
  let tip = "天气不错，好好享受这一天 ✨";
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) tip = "今天有雨，记得带伞 ☂️";
  else if ([71, 73, 75, 77, 85, 86].includes(code)) tip = "有雪，注意保暖和路滑 🧣";
  else if (code === 0 || code === 1) tip = "天气晴好，适合出门走走 🌿";
  else if (code === 3) tip = "阴天，心情也要亮一点哦";
  else if (code === 45 || code === 48) tip = "有雾，出行注意安全";
  return { emoji: info[0], text: info[1], tip };
}

async function loadWeather() {
  const city = store.get("wb_city", "北京");
  const el = $("#dbWeather");
  const tipEl = $("#dbTip");
  if (el) el.innerHTML = `<span class="w-ico">🌤️</span> 正在获取天气…`;
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&language=zh&count=1&format=json`;
    const geo = await fetch(geoUrl).then((r) => r.json());
    const c = geo.results && geo.results[0];
    if (!c) throw new Error("city not found");
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${c.latitude}&longitude=${c.longitude}&current=temperature_2m,weather_code&timezone=auto`;
    const w = await fetch(wUrl).then((r) => r.json());
    const temp = Math.round(w.current.temperature_2m);
    const { emoji, text, tip } = weatherInfo(w.current.weather_code);
    if (el) el.innerHTML = `<span class="w-ico">${emoji}</span> ${temp}°C · ${text} · ${c.name}`;
    if (tipEl) tipEl.textContent = tip;
  } catch (e) {
    if (el) el.innerHTML = `<span class="w-ico">🌤️</span> ${city}`;
    if (tipEl) tipEl.textContent = "天气暂不可用，祝你今天一切顺利 ✨";
  }
}

// 城市设置（默认北京，可改并记忆）
const cityInput = $("#cityInput");
if (cityInput) {
  cityInput.value = store.get("wb_city", "北京");
  cityInput.addEventListener("change", () => {
    const v = cityInput.value.trim();
    if (v) { store.set("wb_city", v); loadWeather(); }
  });
}

renderQuote();
loadWeather();
