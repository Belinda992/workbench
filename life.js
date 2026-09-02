/* ============ 生活记录模块 ============
   依赖 app.js 中的全局：$, $$, store, toast
*/

const LS = {
  ex: "wb_life_exercise",
  wt: "wb_life_weight",
  st: "wb_life_study",
  jr: "wb_life_journal",
  xm: "wb_life_xiaoman",
  ms: "wb_life_milestone",
  focus: "wb_life_focus",
};

// 小满记录分栏字段
const XM_FIELDS = [
  ["yuwen", "📖 语文"],
  ["math", "🔢 数学"],
  ["english", "🔤 英语"],
  ["sport", "🏃 运动"],
  ["art", "🎨 艺术"],
  ["special", "✨ 特别记录"],
  ["words", "💌 今天想对小满说的话"],
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ========== 补录：可切换"正在记录的日期" ========== */
let curLifeDate = todayStr();   // 元气日常（运动 / 体重 / 学习 / 日记）
let curXmDate = todayStr();     // 小满成长（每日记录 / 里程碑）

// 日期加减天数，返回 YYYY-MM-DD
function shiftDate(d, delta) {
  const [y, m, dd] = String(d).split("-").map(Number);
  const dt = new Date(y, m - 1, dd);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
// 日期的友好叫法
function dateLabel(d) {
  const t = todayStr();
  if (d === t) return "今天";
  if (d === shiftDate(t, -1)) return "昨天";
  if (d === shiftDate(t, -2)) return "前天";
  if (d === shiftDate(t, 1)) return "明天";
  const p = String(d).split("-");
  return `${+p[1]}月${+p[2]}日`;
}
// 排序：日期倒序，同一天按录入时间倒序
const byDateDesc = (a, b) =>
  String(b.date || "").localeCompare(String(a.date || "")) || (b.ts || 0) - (a.ts || 0);

// 日期选择条：绑定前后翻页 / 快捷按钮 / 手动选日期
function bindDatePick(opts) {
  const { view, inputId, prevId, nextId, get, set } = opts;
  const input = document.getElementById(inputId);
  if (!input) return;
  const root = document.querySelector(`#${view} .date-pick`);
  input.value = get();
  input.addEventListener("change", () => {
    if (input.value) set(input.value);
    else input.value = get();
  });
  document.getElementById(prevId).addEventListener("click", () => set(shiftDate(get(), -1)));
  document.getElementById(nextId).addEventListener("click", () => set(shiftDate(get(), 1)));
  root.querySelectorAll(".dp-quick").forEach((b) =>
    b.addEventListener("click", () => set(shiftDate(todayStr(), +b.dataset.d)))
  );
}

// 最近一次有记录的非当前日期（元气日常，用于引导找回历史记录）
function recentLifeRecordDate() {
  const keys = [LS.ex, LS.wt, LS.st, LS.jr];
  const dates = new Set();
  keys.forEach((k) => {
    const v = store.get(k, null);
    if (Array.isArray(v)) v.forEach((e) => e.date && dates.add(e.date));
    else if (v && typeof v === "object") Object.keys(v).forEach((d) => dates.add(d));
  });
  return [...dates].sort((a, b) => b.localeCompare(a)).find((d) => d !== curLifeDate) || null;
}

// 更新元气日常日期选择条的状态提示
function syncLifeDateUI() {
  const el = document.getElementById("lifeDate");
  if (el) el.value = curLifeDate;
  const hint = document.getElementById("lifeDateHint");
  if (hint) {
    if (curLifeDate === todayStr()) {
      const r = recentLifeRecordDate();
      hint.textContent = r ? `📌 你最近一次记录在 ${dateLabel(r)}（${r}），点上方「${dateLabel(r)}」可查看/补录` : "";
    } else {
      hint.textContent = `补录 ${dateLabel(curLifeDate)}（${curLifeDate}）`;
    }
  }
  const jt = document.getElementById("jrHeadTitle");
  if (jt) jt.textContent = curLifeDate === todayStr() ? "当日日记" : `${dateLabel(curLifeDate)}日记`;
  const jh = document.getElementById("jrHeadHint");
  if (jh) jh.textContent = curLifeDate === todayStr() ? "模板式" : `补录 ${curLifeDate}`;
}

// 最近一次有记录的非当前日期（用于引导用户找回历史记录）
function recentXmRecordDate() {
  const list = store.get(LS.xm, []);
  const dates = [...new Set(list.map((x) => x.date))].sort((a, b) => b.localeCompare(a));
  return dates.find((d) => d !== curXmDate) || null;
}

// 更新小满日期选择条的状态提示
function syncXmDateUI() {
  const el = document.getElementById("xmDate");
  if (el) el.value = curXmDate;
  const has = store.get(LS.xm, []).some((x) => x.date === curXmDate);
  const hint = document.getElementById("xmDateHint");
  if (hint) {
    if (has) {
      hint.textContent = `已有记录，保存会更新`;
    } else {
      const r = recentXmRecordDate();
      hint.textContent = r
        ? `这天还没有记录 · 📌 你最近一次记录在 ${dateLabel(r)}（${r}），点上方「${dateLabel(r)}」可查看/补录`
        : `这天还没有记录`;
    }
  }
  const ht = document.getElementById("xmHeadTitle");
  if (ht) ht.textContent = curXmDate === todayStr() ? "今日记录" : `${dateLabel(curXmDate)}记录`;
  const hh = document.getElementById("xmHeadHint");
  if (hh) hh.textContent = curXmDate === todayStr() ? "记录小满的一天" : `补录 ${curXmDate}`;
  const sb = document.getElementById("xmSaveBtn");
  if (sb) sb.textContent = has ? "更新这条记录" : "保存记录";
}

// 切换元气日常的记录日期
function setLifeDate(d) {
  curLifeDate = d;
  syncLifeDateUI();
  renderChips();
  loadJournal();
  renderEx(); renderWt(); renderSt();
}

// 切换小满的记录日期
function setXmDate(d) {
  curXmDate = d;
  syncXmDateUI();
  loadXmForm();
  renderXmChip();
  renderXm();
}

// 工具：转义 + 下载
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function downloadFile(name, content, mime = "text/html;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function downloadText(name, content, mime = "text/markdown;charset=utf-8") {
  downloadFile(name, content, mime);
}

// 上传图片 -> 压缩后的 dataURL（控制在 localStorage 容量内）
function fileToDataURL(file, maxW = 1000, q = 0.72) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", q));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

// ---------- 今日状态 chips ----------
function renderChips() {
  const t = curLifeDate;
  const ex = store.get(LS.ex, []).some((e) => e.date === t);
  const wt = store.get(LS.wt, []).some((e) => e.date === t);
  const st = store.get(LS.st, []).some((e) => e.date === t);
  const jr = !!store.get(LS.jr, {})[t];
  const chips = [["运动", ex], ["体重", wt], ["学习", st], ["日记", jr]];
  const isToday = t === todayStr();
  $("#todayChips").innerHTML =
    chips.map(([n, done]) => `<span class="chip ${done ? "chip-on" : "chip-off"}">${done ? "✅" : "⬜"} ${n}</span>`).join("") +
    (isToday ? "" : `<span class="chip chip-note">📌 正在补录 ${dateLabel(t)}</span>`);
}

// ---------- 1. 运动打卡 ----------
let exPhotoData = null;
$("#exPhoto").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  exPhotoData = await fileToDataURL(f);
  const prev = $("#exPreview");
  prev.src = exPhotoData;
  prev.style.display = "block";
});
$("#exForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const feeling = $("#exFeeling").value.trim();
  const entry = { date: curLifeDate, type: $("#exType").value, photo: exPhotoData, feeling, ts: Date.now() };
  const list = store.get(LS.ex, []);
  list.push(entry);
  store.set(LS.ex, list);
  e.target.reset();
  exPhotoData = null;
  $("#exPreview").style.display = "none";
  renderEx(); renderChips();
  toast("运动打卡已保存 🧘");
});
function renderEx() {
  const list = store.get(LS.ex, []).slice().sort(byDateDesc).slice(0, 8);
  $("#exList").innerHTML = list.map((e) => `
    <div class="entry${e.date === curLifeDate ? " today" : ""}">
      ${e.photo ? `<img class="entry-photo" src="${e.photo}" alt="训练照"/>` : ""}
      <div class="entry-body">
        <div class="entry-meta">${e.date} · ${e.type}</div>
        <div class="entry-text">${e.feeling || "（无感受）"}</div>
      </div>
      <button class="entry-del" data-k="${e.ts}">✕</button>
    </div>`).join("") || '<div class="muted">还没有打卡记录</div>';
  $$("#exList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.ex, store.get(LS.ex, []).filter((x) => x.ts !== +b.dataset.k));
      renderEx(); renderChips();
    })
  );
}

// ---------- 2. 体重记录 ----------
$("#wtForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const kg = parseFloat($("#wtKg").value);
  if (!kg) return;
  const list = store.get(LS.wt, []);
  list.push({ date: curLifeDate, kg, note: $("#wtNote").value.trim(), ts: Date.now() });
  store.set(LS.wt, list);
  e.target.reset();
  renderWt(); renderChips();
  toast("体重已记录 ⚖️");
});
function renderWt() {
  const asc = store.get(LS.wt, []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.ts || 0) - (b.ts || 0));
  const recent = asc.slice(-7);
  $("#wtChart").innerHTML = recent.length
    ? miniLine(recent.map((r) => r.kg))
    : '<div class="muted">暂无数据</div>';
  const list = asc.slice().reverse().slice(0, 8);
  $("#wtList").innerHTML = list.map((r) => `
    <div class="entry${r.date === curLifeDate ? " today" : ""}">
      <div class="entry-body">
        <div class="entry-meta">${r.date}</div>
        <div class="entry-text">${r.kg} kg ${r.note ? "· " + r.note : ""}</div>
      </div>
      <button class="entry-del" data-k="${r.ts}">✕</button>
    </div>`).join("") || '<div class="muted">还没有记录</div>';
  $$("#wtList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.wt, store.get(LS.wt, []).filter((x) => x.ts !== +b.dataset.k));
      renderWt(); renderChips();
    })
  );
}
function miniLine(data) {
  const w = 520, h = 140, pad = 20;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1 || 1);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
  const pts = data.map((v, i) => [pad + i * stepX, y(v)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#2e9e5e"/>
    <text x="${p[0]}" y="${p[1] - 8}" font-size="10" fill="#1f2430" text-anchor="middle">${data[i]}</text>`).join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="min-width:480px">
    <path d="${path}" fill="none" stroke="#2e9e5e" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}</svg>`;
}

// ---------- 3. 学习 · 番茄钟 ----------
const pomo = { mode: "work", remain: 25 * 60, running: false, iv: null };
function loadFocus() {
  let f = store.get(LS.focus, { date: "", min: 0 });
  if (f.date !== todayStr()) { f = { date: todayStr(), min: 0 }; store.set(LS.focus, f); }
  return f;
}
function renderPomo() {
  const m = String(Math.floor(pomo.remain / 60)).padStart(2, "0");
  const s = String(pomo.remain % 60).padStart(2, "0");
  $("#pomoTime").textContent = m + ":" + s;
  $("#pomoMode").textContent = pomo.mode === "work" ? "专注" : "休息";
  $("#pomoMode").className = "pomo-mode " + (pomo.mode === "work" ? "m-work" : "m-break");
  $("#pomoToggle").textContent = pomo.running ? "暂停" : "开始";
  $("#pomoFocus").textContent = loadFocus().min;
}
function pomoStep() {
  pomo.remain--;
  if (pomo.remain <= 0) {
    if (pomo.mode === "work") {
      const f = loadFocus(); f.min += 25; store.set(LS.focus, f);
      pomo.mode = "break"; pomo.remain = 5 * 60;
      toast("专注完成，休息一下 🍵");
    } else {
      pomo.mode = "work"; pomo.remain = 25 * 60;
      toast("休息结束，继续加油 💪");
    }
  }
  renderPomo();
}
$("#pomoToggle").addEventListener("click", () => {
  pomo.running = !pomo.running;
  if (pomo.running) pomo.iv = setInterval(pomoStep, 1000);
  else clearInterval(pomo.iv);
  renderPomo();
});
$("#pomoReset").addEventListener("click", () => {
  clearInterval(pomo.iv); pomo.running = false; pomo.mode = "work"; pomo.remain = 25 * 60;
  renderPomo();
});
$("#stForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const book = $("#stBook").value.trim();
  const minutes = parseInt($("#stMin").value) || 0;
  if (!book && !minutes) return;
  const list = store.get(LS.st, []);
  list.push({ date: curLifeDate, book: book || "（未命名）", minutes, feeling: $("#stFeeling").value.trim(), ts: Date.now() });
  store.set(LS.st, list);
  e.target.reset();
  renderSt(); renderChips();
  toast("阅读记录已保存 📚");
});
function renderSt() {
  const list = store.get(LS.st, []).slice().sort(byDateDesc).slice(0, 8);
  $("#stList").innerHTML = list.map((s) => `
    <div class="entry${s.date === curLifeDate ? " today" : ""}">
      <div class="entry-body">
        <div class="entry-meta">${s.date} · ${s.minutes} 分钟</div>
        <div class="entry-text"><b>${s.book}</b>${s.feeling ? "<br>" + s.feeling : ""}</div>
      </div>
      <button class="entry-del" data-k="${s.ts}">✕</button>
    </div>`).join("") || '<div class="muted">还没有阅读记录</div>';
  $$("#stList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.st, store.get(LS.st, []).filter((x) => x.ts !== +b.dataset.k));
      renderSt(); renderChips();
    })
  );
}

// ---------- 4. 当日日记 ----------
function loadJournal() {
  const all = store.get(LS.jr, {});
  const t = curLifeDate;
  const j = all[t] || {};
  $("#jrSpecial").value = j.special || "";
  $("#jrGrat").value = j.grat || "";
  $("#jrAch").value = j.ach || "";
  $("#jrRef").value = j.ref || "";
  $("#jrWords").value = j.words || "";
}
$("#jrSave").addEventListener("click", () => {
  const all = store.get(LS.jr, {});
  all[curLifeDate] = {
    special: $("#jrSpecial").value.trim(),
    grat: $("#jrGrat").value.trim(),
    ach: $("#jrAch").value.trim(),
    ref: $("#jrRef").value.trim(),
    words: $("#jrWords").value.trim(),
  };
  store.set(LS.jr, all);
  renderChips();
  const s = $("#jrSaved");
  s.textContent = "已保存 ✓ " + new Date().toLocaleTimeString("zh-CN");
  setTimeout(() => (s.textContent = ""), 2500);
  toast(curLifeDate === todayStr() ? "今日日记已保存 📔" : dateLabel(curLifeDate) + "日记已补录 📔");
});

// 日记回顾导出（周 / 月）
function exportJournal(range) {
  const all = store.get(LS.jr, {});
  const now = new Date();
  let startStr;
  if (range === "week") {
    const dow = (now.getDay() + 6) % 7; // 周一=0
    const d = new Date(now); d.setDate(now.getDate() - dow);
    startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } else {
    startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }
  const keys = Object.keys(all).filter((k) => k >= startStr).sort();
  if (!keys.length) { toast("该区间还没有日记哦"); return; }
  const LABELS = [["special", "今日微光"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["words", "对自己说的话"]];
  let html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>日记回顾</title>
<style>body{font-family:-apple-system,"PingFang SC",sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1f2430;line-height:1.7}h1{font-size:22px}hr{border:none;border-top:1px solid #e8ebf2;margin:18px 0}.date{color:#8a93a6;font-size:13px;margin-bottom:6px}.lab{color:#2e9e5e;font-weight:600;margin-right:6px}.sec{margin:4px 0}</style></head><body>
<h1>${range === "week" ? "本周" : "本月"}日记回顾</h1>`;
  keys.forEach((k) => {
    html += `<div class="date">${k}</div>`;
    LABELS.forEach(([f, lab]) => {
      if (all[k][f]) html += `<div class="sec"><span class="lab">${lab}：</span>${escapeHtml(all[k][f]).replace(/\n/g, "<br>")}</div>`;
    });
    html += `<hr>`;
  });
  html += `</body></html>`;
  downloadFile(`日记回顾_${range === "week" ? "本周" : "本月"}_${todayStr()}.html`, html);
  toast("已导出回顾文件 ⬇️");
}
$("#jrWeek").addEventListener("click", () => exportJournal("week"));
$("#jrMonth").addEventListener("click", () => exportJournal("month"));

// ---------- 5. 小满成长手账 ----------
let xmPhotoData = null;
let msPhotoData = null;
$("#xmPhoto").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  xmPhotoData = await fileToDataURL(f);
  const prev = $("#xmPreview");
  prev.src = xmPhotoData;
  prev.style.display = "block";
});
$("#xmForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const rec = {
    date: curXmDate,
    mood: $("#xmMood").value,
    photo: xmPhotoData,
    yuwen: $("#xmYuwen").value.trim(),
    math: $("#xmMath").value.trim(),
    english: $("#xmEnglish").value.trim(),
    sport: $("#xmSport").value.trim(),
    art: $("#xmArt").value.trim(),
    special: $("#xmSpecial").value.trim(),
    words: $("#xmWords").value.trim(),
    ts: Date.now(),
  };
  if (!XM_FIELDS.some(([k]) => rec[k])) return;
  const list = store.get(LS.xm, []);
  // 一天只保留一条：这天已有记录就更新，没有才新增（补录/修改都不会产生重复）
  const existing = list.filter((x) => x.date === curXmDate).sort((a, b) => b.ts - a.ts)[0];
  if (existing) {
    Object.assign(existing, {
      mood: rec.mood,
      yuwen: rec.yuwen, math: rec.math, english: rec.english,
      sport: rec.sport, art: rec.art, special: rec.special, words: rec.words,
    });
    if (rec.photo) existing.photo = rec.photo;   // 没重新选照片就保留原来的
  } else {
    list.push(rec);
  }
  store.set(LS.xm, list);
  renderXm(); renderChips(); renderXmChip(); syncXmDateUI();
  toast(existing
    ? dateLabel(curXmDate) + "记录已更新 👧"
    : (curXmDate === todayStr() ? "小满今日记录已保存 👧" : dateLabel(curXmDate) + "记录已补录 👧"));
});
// 把选中日期已有的记录回填到表单（这天还没记录就把表单清空）
function loadXmForm() {
  const list = store.get(LS.xm, []).filter((x) => x.date === curXmDate).sort((a, b) => b.ts - a.ts);
  const rec = list[0] || {};
  $("#xmMood").value = rec.mood || "😊 开心";
  $("#xmYuwen").value = rec.yuwen || "";
  $("#xmMath").value = rec.math || "";
  $("#xmEnglish").value = rec.english || "";
  $("#xmSport").value = rec.sport || "";
  $("#xmArt").value = rec.art || "";
  $("#xmSpecial").value = rec.special || "";
  $("#xmWords").value = rec.words || "";
  xmPhotoData = null;
  const prev = $("#xmPreview");
  if (rec.photo) { prev.src = rec.photo; prev.style.display = "block"; }
  else { prev.style.display = "none"; prev.removeAttribute("src"); }
}

function renderXm() {
  const list = store.get(LS.xm, []).slice().sort(byDateDesc);
  $("#xmList").innerHTML = list.map((x) => {
    let body = "";
    XM_FIELDS.forEach(([k, lab]) => {
      if (x[k]) body += `<div class="entry-text"><b>${lab}：</b>${escapeHtml(x[k]).replace(/\n/g, "<br>")}</div>`;
    });
    if (!body && x.content) body = `<div class="entry-text">${escapeHtml(x.content).replace(/\n/g, "<br>")}</div>`;
    const head = x.title ? `<b>${escapeHtml(x.title)}</b><br>` : "";
    return `<div class="entry${x.date === curXmDate ? " today" : ""}">
      ${x.photo ? `<img class="entry-photo" src="${x.photo}" alt="照片"/>` : ""}
      <div class="entry-body">
        <div class="entry-meta">${x.date} · ${x.mood}</div>
        ${head}${body || '<div class="entry-text muted">(空)</div>'}
      </div>
      <button class="entry-del" data-k="${x.ts}">✕</button>
    </div>`;
  }).join("") || '<div class="muted">还没有记录</div>';
  $$("#xmList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.xm, store.get(LS.xm, []).filter((y) => y.ts !== +b.dataset.k));
      renderXm(); renderChips();
    })
  );
}

// 里程碑照片
$("#msPhoto").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  msPhotoData = await fileToDataURL(f);
  const prev = $("#msPreview");
  prev.src = msPhotoData;
  prev.style.display = "block";
});

// 小满今日状态
function renderXmChip() {
  const t = curXmDate;
  const done = store.get(LS.xm, []).some((e) => e.date === t);
  const el = $("#xmTodayChip");
  if (el) el.innerHTML =
    `<span class="chip ${done ? "chip-on" : "chip-off"}">${done ? "✅" : "⬜"} ${dateLabel(t)}小满记录</span>` +
    (t === todayStr() ? "" : `<span class="chip chip-note">📌 正在补录 ${dateLabel(t)}</span>`);
}

// ---------- 成长里程碑时间线 ----------
$("#msForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#msTitle").value.trim();
  const desc = $("#msDesc").value.trim();
  if (!title) return;
  const list = store.get(LS.ms, []);
  list.push({ date: curXmDate, title, desc, photo: msPhotoData, ts: Date.now() });
  store.set(LS.ms, list);
  e.target.reset();
  msPhotoData = null;
  $("#msPreview").style.display = "none";
  renderMilestone();
  toast("里程碑已添加 🌟");
});
function renderMilestone() {
  const list = store.get(LS.ms, []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  $("#msTimeline").innerHTML = list.map((m) => `
    <div class="tl-item">
      <span class="tl-dot"></span>
      <div class="tl-date">${m.date}</div>
      <div class="tl-title">${escapeHtml(m.title)}</div>
      ${m.desc ? `<div class="tl-desc">${escapeHtml(m.desc)}</div>` : ""}
      ${m.photo ? `<img class="entry-photo" src="${m.photo}" alt="里程碑照片"/>` : ""}
    </div>`).join("") || '<div class="muted">还没有里程碑</div>';
}

// ---------- 数据导出 ----------
// 生活记录主题 → Markdown
function exportLifeMarkdown() {
  const L = [`# 生活记录导出 · ${todayStr()}\n`];
  const ex = store.get(LS.ex, []).slice().reverse();
  L.push(`## 🧘 运动打卡（${ex.length} 条）`);
  ex.forEach((e) => L.push(`- **${e.date} · ${e.type}**：${e.feeling || "（无感受）"}`));
  const wt = store.get(LS.wt, []).slice().reverse();
  L.push(`\n## ⚖️ 体重记录（${wt.length} 条）`);
  wt.forEach((r) => L.push(`- ${r.date}：${r.kg} kg${r.note ? "（" + r.note + "）" : ""}`));
  const st = store.get(LS.st, []).slice().reverse();
  L.push(`\n## 🍅 学习 · 阅读（${st.length} 条）`);
  st.forEach((s) => L.push(`- **${s.date} · ${s.minutes} 分钟**：${s.book}${s.feeling ? "\n  - " + s.feeling : ""}`));
  const jr = store.get(LS.jr, {});
  const jkeys = Object.keys(jr).sort();
  const JL = [["special", "今日微光"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["words", "对自己说的话"]];
  L.push(`\n## 📔 日记（${jkeys.length} 天）`);
  jkeys.forEach((k) => {
    L.push(`\n### ${k}`);
    JL.forEach(([f, lab]) => { if (jr[k][f]) L.push(`- **${lab}**：${jr[k][f]}`); });
  });
  downloadText(`生活记录_${todayStr()}.md`, L.join("\n"));
  toast("已导出生活记录 ⬇️");
}

// 小满成长主题 → Markdown
function exportXmMarkdown() {
  const L = [`# 小满成长手账导出 · ${todayStr()}\n`];
  const xm = store.get(LS.xm, []).slice().sort((a, b) => b.ts - a.ts);
  L.push(`## 📅 今日记录（${xm.length} 条）`);
  xm.forEach((x) => {
    L.push(`\n### ${x.date} · ${x.mood}`);
    XM_FIELDS.forEach(([k, lab]) => { if (x[k]) L.push(`- **${lab}**：${x[k]}`); });
  });
  const ms = store.get(LS.ms, []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  L.push(`\n## 🌟 成长里程碑（${ms.length} 条）`);
  ms.forEach((m) => L.push(`- **${m.date}**：${m.title}${m.desc ? "（" + m.desc + "）" : ""}`));
  downloadText(`小满成长_${todayStr()}.md`, L.join("\n"));
  toast("已导出小满数据 ⬇️");
}

// 全部数据 → JSON 备份
function exportAllJson() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("wb_")) data[k] = store.get(k, null);
  }
  const keys = Object.keys(data).length;
  if (!keys) { toast("还没有任何数据哦"); return; }
  downloadText(`工作台备份_${todayStr()}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
  toast(`已备份 ${keys} 项数据 ⬇️`);
}

$("#btnExportLife").addEventListener("click", exportLifeMarkdown);
$("#btnExportXm").addEventListener("click", exportXmMarkdown);
$("#btnBackupAll").addEventListener("click", exportAllJson);

// 初始化
bindDatePick({
  view: "view-life", inputId: "lifeDate", prevId: "lifePrevDay",
  nextId: "lifeNextDay", get: () => curLifeDate, set: setLifeDate,
});
bindDatePick({
  view: "view-xiaoman", inputId: "xmDate", prevId: "xmPrevDay",
  nextId: "xmNextDay", get: () => curXmDate, set: setXmDate,
});

renderChips();
renderEx();
renderWt();
renderSt();
renderPomo();
loadJournal();
renderXm();
renderXmChip();
renderMilestone();
syncLifeDateUI();
syncXmDateUI();
loadXmForm();
