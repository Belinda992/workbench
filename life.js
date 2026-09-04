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
  ["kg", "🏫 幼儿园课程"],
  ["sport", "🏃 运动"],
  ["art", "🎨 艺术"],
  ["special", "✨ 特别记录"],
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ========== 补录：可切换"正在记录的日期" ========== */
let curLifeDate = todayStr();   // 元气日常（运动 / 体重 / 学习 / 日记）
let curXmDate = todayStr();     // 小满成长（每日记录 / 里程碑）
let lifeShowAll = false;        // 元气日常：是否临时展开全部历史
let xmShowAll = false;          // 小满成长：是否临时展开全部历史

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
  if (ht) ht.textContent = curXmDate === todayStr() ? "成长记录" : `${dateLabel(curXmDate)}成长记录`;
  const sb = document.getElementById("xmSaveBtn");
  if (sb) sb.textContent = has ? "更新这条记录" : "保存记录";
}

// 切换元气日常的记录日期
function setLifeDate(d) {
  curLifeDate = d;
  lifeShowAll = false;          // 切日期回到「只看当天」聚焦模式
  syncLifeDateUI();
  renderChips();
  loadJournal();
  renderEx(); renderWt(); renderSt();
  syncSubjectHint();
}

// 切换小满的记录日期
function setXmDate(d) {
  curXmDate = d;
  xmShowAll = false;            // 切日期回到「只看当天」聚焦模式
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

// ---------- 今日状态 chips（若页面未展示则静默跳过） ----------
function renderChips() {
  const chipEl = $("#todayChips");
  if (!chipEl) return;
  const t = curLifeDate;
  const ex = store.get(LS.ex, []).some((e) => e.date === t);
  const wt = store.get(LS.wt, []).some((e) => e.date === t);
  const st = store.get(LS.st, []).some((e) => e.date === t);
  const jr = !!store.get(LS.jr, {})[t];
  const chips = [["运动", ex], ["体重", wt], ["学习", st], ["日记", jr]];
  const isToday = t === todayStr();
  chipEl.innerHTML =
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
  const all = store.get(LS.ex, []).slice().sort(byDateDesc);
  const isToday = curLifeDate === todayStr();
  const showAll = lifeShowAll || isToday;
  const list = showAll ? all.slice(0, 8) : all.filter((e) => e.date === curLifeDate);
  const banner = document.getElementById("exFocusBanner");
  if (banner) {
    if (!isToday && !lifeShowAll) {
      banner.style.display = "block";
      banner.innerHTML = `🔍 正在查看 <b>${dateLabel(curLifeDate)}（${curLifeDate}）</b> 的运动记录` +
        (list.length ? ` · 共 ${list.length} 条` : ` · <span class="fb-empty">这天还没有运动记录，可在上方补录</span>`) +
        ` <a class="link-btn" data-all="1">查看全部历史</a>`;
      banner.querySelector("[data-all]").addEventListener("click", () => { lifeShowAll = true; renderEx(); });
    } else {
      banner.style.display = "none";
    }
  }
  $("#exList").innerHTML = list.length
    ? list.map((e) => `
    <div class="entry${e.date === curLifeDate ? " today" : ""}">
      ${e.photo ? `<img class="entry-photo" src="${e.photo}" alt="训练照"/>` : ""}
      <div class="entry-body">
        <div class="entry-meta">${e.date} · ${e.type}</div>
        <div class="entry-text">${e.feeling || "（无感受）"}</div>
      </div>
      <button class="entry-del" data-k="${e.ts}">✕</button>
    </div>`).join("")
    : '<div class="muted">还没有打卡记录</div>';
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
  const isToday = curLifeDate === todayStr();
  const showAll = lifeShowAll || isToday;
  const list = showAll ? asc.slice().reverse().slice(0, 8) : asc.filter((r) => r.date === curLifeDate);
  const banner = document.getElementById("wtFocusBanner");
  if (banner) {
    if (!isToday && !lifeShowAll) {
      banner.style.display = "block";
      banner.innerHTML = `🔍 正在查看 <b>${dateLabel(curLifeDate)}（${curLifeDate}）</b> 的体重记录` +
        (list.length ? ` · 共 ${list.length} 条` : ` · <span class="fb-empty">这天还没有体重记录</span>`) +
        ` <a class="link-btn" data-all="1">查看全部历史</a>`;
      banner.querySelector("[data-all]").addEventListener("click", () => { lifeShowAll = true; renderWt(); });
    } else {
      banner.style.display = "none";
    }
  }
  $("#wtList").innerHTML = list.length
    ? list.map((r) => `
    <div class="entry${r.date === curLifeDate ? " today" : ""}">
      <div class="entry-body">
        <div class="entry-meta">${r.date}</div>
        <div class="entry-text">${r.kg} kg ${r.note ? "· " + r.note : ""}</div>
      </div>
      <button class="entry-del" data-k="${r.ts}">✕</button>
    </div>`).join("")
    : '<div class="muted">还没有记录</div>';
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
  const topic = $("#stTopic").value;
  const name = $("#stName").value.trim();
  const period = $("#stPeriod").value.trim();
  const range = $("#stRange").value.trim();
  const output = $("#stOutput").value.trim();
  if (!name && !period && !range && !output) return;
  const list = store.get(LS.st, []);
  list.push({ date: curLifeDate, topic, name, period, range, output, ts: Date.now() });
  store.set(LS.st, list);
  e.target.reset();
  renderSt(); renderChips(); syncSubjectHint();
  toast("学习记录已保存 📚");
});
// 学习记录：自动提示"最近在学的名称"，方便连续学习时快速填入
function syncSubjectHint() {
  const hint = document.getElementById("stSubjectHint");
  if (!hint) return;
  if ($("#stName").value.trim()) { hint.style.display = "none"; return; }
  const recent = store.get(LS.st, []).filter((s) => s.name || s.subject).sort(byDateDesc);
  if (!recent.length) { hint.style.display = "none"; return; }
  const nm = recent[0].name || recent[0].subject;
  const tp = recent[0].topic || "";
  hint.style.display = "block";
  hint.innerHTML = `📌 最近在学：<b>${escapeHtml(nm)}</b>${tp ? `<span class="muted">（${escapeHtml(tp)}）</span>` : ""} <a class="link-btn" data-fill="1">填入</a>`;
  hint.querySelector("[data-fill]").addEventListener("click", () => {
    $("#stName").value = nm;
    if (tp) $("#stTopic").value = tp;
    hint.style.display = "none";
  });
}
function renderSt() {
  const all = store.get(LS.st, []).slice().sort(byDateDesc);
  const isToday = curLifeDate === todayStr();
  const showAll = lifeShowAll || isToday;
  const list = showAll ? all.slice(0, 8) : all.filter((s) => s.date === curLifeDate);
  const banner = document.getElementById("stFocusBanner");
  if (banner) {
    if (!isToday && !lifeShowAll) {
      banner.style.display = "block";
      banner.innerHTML = `🔍 正在查看 <b>${dateLabel(curLifeDate)}（${curLifeDate}）</b> 的学习记录` +
        (list.length ? ` · 共 ${list.length} 条` : ` · <span class="fb-empty">这天还没有学习记录，可在上方补录</span>`) +
        ` <a class="link-btn" data-all="1">查看全部历史</a>`;
      banner.querySelector("[data-all]").addEventListener("click", () => { lifeShowAll = true; renderSt(); });
    } else {
      banner.style.display = "none";
    }
  }
  $("#stList").innerHTML = list.length
    ? list.map((s) => {
        const meta = [s.period, (s.minutes ? s.minutes + " 分钟" : "")].filter(Boolean).join(" · ");
        const lines = [];
        const nm = s.name || s.subject || s.book || "";
        const head = [s.topic ? `<span class="st-topic">${escapeHtml(s.topic)}</span>` : "", nm ? `<b>${escapeHtml(nm)}</b>` : ""].filter(Boolean).join(" ");
        if (head) lines.push(head);
        if (s.range) lines.push(`范围：${escapeHtml(s.range)}`);
        if (s.output) lines.push(escapeHtml(s.output).replace(/\n/g, "<br>"));
        // 兼容旧数据（feeling）
        if (!s.output && s.feeling) lines.push(escapeHtml(s.feeling).replace(/\n/g, "<br>"));
        return `<div class="entry${s.date === curLifeDate ? " today" : ""}">
          <div class="entry-body">
            <div class="entry-meta">${s.date}${meta ? " · " + meta : ""}</div>
            <div class="entry-text">${lines.join("<br>") || "（无内容）"}</div>
          </div>
          <button class="entry-del" data-k="${s.ts}">✕</button>
        </div>`;
      }).join("")
    : '<div class="muted">还没有学习记录</div>';
  $$("#stList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.st, store.get(LS.st, []).filter((x) => x.ts !== +b.dataset.k));
      renderSt(); renderChips();
    })
  );
}

// ---------- 4. 当日日记 ----------
let jrPhotoData = null;
$("#jrPhoto").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  jrPhotoData = await fileToDataURL(f);
  const prev = $("#jrPreview");
  prev.src = jrPhotoData;
  prev.style.display = "block";
});
function loadJournal() {
  const all = store.get(LS.jr, {});
  const t = curLifeDate;
  const j = all[t] || {};
  $("#jrSpecial").value = j.special || "";
  $("#jrGrat").value = j.grat || "";
  $("#jrAch").value = j.ach || "";
  $("#jrRef").value = j.ref || "";
  $("#jrOther").value = j.other || "";
  $("#jrWords").value = j.words || "";
  jrPhotoData = j.photo || null;
  const prev = $("#jrPreview");
  if (jrPhotoData) { prev.src = jrPhotoData; prev.style.display = "block"; }
  else { prev.style.display = "none"; prev.removeAttribute("src"); }
}
$("#jrSave").addEventListener("click", () => {
  const all = store.get(LS.jr, {});
  const rec = {
    special: $("#jrSpecial").value.trim(),
    grat: $("#jrGrat").value.trim(),
    ach: $("#jrAch").value.trim(),
    ref: $("#jrRef").value.trim(),
    other: $("#jrOther").value.trim(),
    words: $("#jrWords").value.trim(),
  };
  if (jrPhotoData) rec.photo = jrPhotoData;
  all[curLifeDate] = rec;
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
  const LABELS = [["special", "星星口袋"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["other", "其他"], ["words", "对自己说的话"]];
  let html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>日记回顾</title>
<style>body{font-family:-apple-system,"PingFang SC",sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1f2430;line-height:1.7}h1{font-size:22px}hr{border:none;border-top:1px solid #e8ebf2;margin:18px 0}.date{color:#8a93a6;font-size:13px;margin-bottom:6px}.lab{color:#2e9e5e;font-weight:600;margin-right:6px}.sec{margin:4px 0}.photo{max-width:240px;border-radius:10px;margin:8px 0;display:block}</style></head><body>
<h1>${range === "week" ? "本周" : "本月"}日记回顾</h1>`;
  keys.forEach((k) => {
    html += `<div class="date">${k}</div>`;
    LABELS.forEach(([f, lab]) => {
      if (all[k][f]) html += `<div class="sec"><span class="lab">${lab}：</span>${escapeHtml(all[k][f]).replace(/\n/g, "<br>")}</div>`;
    });
    if (all[k].photo) html += `<img class="photo" src="${all[k].photo}" alt="日记图片"/>`;
    html += `<hr>`;
  });
  html += `</body></html>`;
  downloadFile(`日记回顾_${range === "week" ? "本周" : "本月"}_${todayStr()}.html`, html);
  toast("已导出回顾文件 ⬇️");
}
$("#jrWeek").addEventListener("click", () => exportJournal("week"));
$("#jrMonth").addEventListener("click", () => exportJournal("month"));

// ---------- 5. 小满成长 ----------
let xmPhotoData = [];
let msPhotoData = [];
function renderXmPreviews() {
  const box = $("#xmPreview");
  if (!box) return;
  box.innerHTML = xmPhotoData.map((src, i) =>
    `<span class="pp-wrap"><img class="pp-img" src="${src}" alt="预览"/><button type="button" class="pp-del" data-i="${i}" title="移除">✕</button></span>`
  ).join("");
  $$("#xmPreview .pp-del").forEach((b) =>
    b.addEventListener("click", () => {
      xmPhotoData.splice(+b.dataset.i, 1);
      renderXmPreviews();
    })
  );
}
$("#xmPhoto").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    if (f) xmPhotoData.push(await fileToDataURL(f));
  }
  renderXmPreviews();
  e.target.value = "";   // 允许再次选择同一张
});
$("#xmForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const rec = {
    date: curXmDate,
    photo: xmPhotoData.slice(),
    yuwen: $("#xmYuwen").value.trim(),
    math: $("#xmMath").value.trim(),
    english: $("#xmEnglish").value.trim(),
    kg: $("#xmKg").value.trim(),
    sport: $("#xmSport").value.trim(),
    art: $("#xmArt").value.trim(),
    special: $("#xmSpecial").value.trim(),
    ts: Date.now(),
  };
  if (!XM_FIELDS.some(([k]) => rec[k]) && xmPhotoData.length === 0) return;
  const list = store.get(LS.xm, []);
  // 一天只保留一条：这天已有记录就更新，没有才新增（补录/修改都不会产生重复）
  const existing = list.filter((x) => x.date === curXmDate).sort((a, b) => b.ts - a.ts)[0];
  if (existing) {
    Object.assign(existing, {
      yuwen: rec.yuwen, math: rec.math, english: rec.english,
      kg: rec.kg, sport: rec.sport, art: rec.art, special: rec.special,
    });
    if (rec.photo.length) existing.photo = rec.photo;   // 没重新选照片就保留原来的
  } else {
    list.push(rec);
  }
  store.set(LS.xm, list);
  renderXm(); renderChips(); renderXmChip(); syncXmDateUI();
  toast(existing
    ? dateLabel(curXmDate) + "记录已更新 👧"
    : (curXmDate === todayStr() ? "小满成长记录已保存 👧" : dateLabel(curXmDate) + "记录已补录 👧"));
});
// 把选中日期已有的记录回填到表单（这天还没记录就把表单清空）
function loadXmForm() {
  const list = store.get(LS.xm, []).filter((x) => x.date === curXmDate).sort((a, b) => b.ts - a.ts);
  const rec = list[0] || {};
  $("#xmYuwen").value = rec.yuwen || "";
  $("#xmMath").value = rec.math || "";
  $("#xmEnglish").value = rec.english || "";
  $("#xmKg").value = rec.kg || "";
  $("#xmSport").value = rec.sport || "";
  $("#xmArt").value = rec.art || "";
  $("#xmSpecial").value = rec.special || "";
  $("#xmWords").value = rec.words || "";
  // 照片：兼容旧版单张 / 新版多张
  xmPhotoData = rec.photo ? (Array.isArray(rec.photo) ? rec.photo.slice() : [rec.photo]) : [];
  renderXmPreviews();
}

// To小满：单独保存「今天想对小满说的话」，与成长记录同属一天
$("#toXmForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const words = $("#xmWords").value.trim();
  if (!words) return;
  const list = store.get(LS.xm, []);
  const existing = list.filter((x) => x.date === curXmDate).sort((a, b) => b.ts - a.ts)[0];
  if (existing) existing.words = words;
  else list.push({ date: curXmDate, words, ts: Date.now() });
  store.set(LS.xm, list);
  renderXm(); renderChips(); renderXmChip(); syncXmDateUI();
  toast("已保存到 To小满 💌");
});

function renderXm() {
  const all = store.get(LS.xm, []).slice().sort(byDateDesc);
  const isToday = curXmDate === todayStr();
  const showAll = xmShowAll || isToday;
  const list = showAll ? all : all.filter((x) => x.date === curXmDate);
  const banner = document.getElementById("xmFocusBanner");
  if (banner) {
    if (!isToday && !xmShowAll) {
      banner.style.display = "block";
      banner.innerHTML = `🔍 正在查看 <b>${dateLabel(curXmDate)}（${curXmDate}）</b> 的小满记录` +
        (list.length ? ` · 共 ${list.length} 条` : ` · <span class="fb-empty">这天还没有记录，可在上方表单补录</span>`) +
        ` <a class="link-btn" data-all="1">查看全部历史</a>`;
      banner.querySelector("[data-all]").addEventListener("click", () => { xmShowAll = true; renderXm(); });
    } else {
      banner.style.display = "none";
    }
  }
  $("#xmList").innerHTML = list.length
    ? list.map((x) => {
    let body = "";
    XM_FIELDS.forEach(([k, lab]) => {
      if (x[k]) body += `<div class="entry-text"><b>${lab}：</b>${escapeHtml(x[k]).replace(/\n/g, "<br>")}</div>`;
    });
    if (!body && x.content) body = `<div class="entry-text">${escapeHtml(x.content).replace(/\n/g, "<br>")}</div>`;
    if (x.words) body += `<div class="entry-text to-xm"><b>💌 To小满：</b>${escapeHtml(x.words).replace(/\n/g, "<br>")}</div>`;
    const head = x.title ? `<b>${escapeHtml(x.title)}</b><br>` : "";
    const photos = x.photo ? (Array.isArray(x.photo) ? x.photo : [x.photo]) : [];
    const photoHtml = photos.map((src) => `<img class="entry-photo" src="${src}" alt="照片"/>`).join("");
    return `<div class="entry${x.date === curXmDate ? " today" : ""}">
      ${photoHtml}
      <div class="entry-body">
        <div class="entry-meta">${x.date}</div>
        ${head}${body || '<div class="entry-text muted">(空)</div>'}
      </div>
      <button class="entry-del" data-k="${x.ts}">✕</button>
    </div>`;
  }).join("")
    : '<div class="muted">还没有记录</div>';
  $$("#xmList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(LS.xm, store.get(LS.xm, []).filter((y) => y.ts !== +b.dataset.k));
      renderXm(); renderChips();
    })
  );
}

// 里程碑照片（支持多张）
function renderMsPreviews() {
  const box = $("#msPreview");
  if (!box) return;
  box.innerHTML = msPhotoData.map((src, i) =>
    `<span class="pp-wrap"><img class="pp-img" src="${src}" alt="预览"/><button type="button" class="pp-del" data-i="${i}" title="移除">✕</button></span>`
  ).join("");
  $$("#msPreview .pp-del").forEach((b) =>
    b.addEventListener("click", () => {
      msPhotoData.splice(+b.dataset.i, 1);
      renderMsPreviews();
    })
  );
}
$("#msPhoto").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const f of files) {
    if (f) msPhotoData.push(await fileToDataURL(f));
  }
  renderMsPreviews();
  e.target.value = "";
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
  list.push({ date: curXmDate, title, desc, photo: msPhotoData.slice(), ts: Date.now() });
  store.set(LS.ms, list);
  e.target.reset();
  msPhotoData = [];
  renderMsPreviews();
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
      ${(() => {
        const photos = m.photo ? (Array.isArray(m.photo) ? m.photo : [m.photo]) : [];
        return photos.map((src) => `<img class="entry-photo" src="${src}" alt="里程碑照片"/>`).join("");
      })()}
    </div>`).join("") || '<div class="muted">还没有里程碑</div>';
}

// ---------- 导出时间段选择 ----------
// 打开选择弹窗，确认后回调 cb(from, to)；from/to 为 YYYY-MM-DD 或 null（不限）
function openRangeExport(title, cb) {
  const m = $("#exportRangeModal");
  if (!m) { cb(null, null); return; }
  const t = $("#exportRangeTitle"); if (t) t.textContent = title || "选择导出时间段";
  const fromI = $("#erFrom"), toI = $("#erTo"), hint = $("#erHint");
  // 默认：全部
  if (fromI) fromI.value = "";
  if (toI) toI.value = "";
  const updHint = () => {
    if (!hint) return;
    const f = fromI && fromI.value, tt = toI && toI.value;
    if (!f && !tt) hint.textContent = "当前选择：全部时间";
    else if (f && !tt) hint.textContent = `当前选择：${f} 起，到今天`;
    else if (!f && tt) hint.textContent = `当前选择：${tt} 及之前`;
    else hint.textContent = `当前选择：${f} 至 ${tt}`;
  };
  updHint();
  if (fromI) fromI.onchange = updHint;
  if (toI) toI.onchange = updHint;
  m.style.display = "flex";

  const ok = $("#erOk"), cancel = $("#erCancel");
  const close = () => {
    m.style.display = "none";
    if (ok) ok.onclick = null;
    if (cancel) cancel.onclick = null;
    $$("#exportRangeModal [data-er]").forEach((b) => (b.onclick = null));
  };
  if (cancel) cancel.onclick = close;
  if (ok) ok.onclick = () => {
    let f = fromI && fromI.value ? fromI.value : null;
    let tt = toI && toI.value ? toI.value : null;
    if (f && tt && f > tt) { const tmp = f; f = tt; tt = tmp; }   // 起止写反了自动纠正
    close();
    cb(f, tt);
  };
  $$("#exportRangeModal [data-er]").forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.er;
      const now = new Date();
      const y = now.getFullYear(), mo = now.getMonth() + 1;
      const pad = (n) => String(n).padStart(2, "0");
      if (k === "all") { fromI.value = ""; toI.value = ""; }
      else if (k === "week") {
        const d = new Date(now); const wd = (d.getDay() + 6) % 7;   // 周一为一周起点
        d.setDate(d.getDate() - wd);
        fromI.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        toI.value = todayStr();
      } else if (k === "month") {
        fromI.value = `${y}-${pad(mo)}-01`;
        toI.value = todayStr();
      } else if (k === "lastmonth") {
        const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
        const last = new Date(py, pm, 0).getDate();
        fromI.value = `${py}-${pad(pm)}-01`;
        toI.value = `${py}-${pad(pm)}-${pad(last)}`;
      }
      updHint();
    };
  });
}
// 日期串是否落在 [from, to] 内
function inRange(d, from, to) {
  const s = String(d || "");
  if (!s) return false;
  if (from && s < from) return false;
  if (to && s > to) return false;
  return true;
}
// 按时间段过滤数组（元素需带 date 字段）
function byRange(arr, from, to) {
  return arr.filter((x) => inRange(x.date, from, to));
}
// 按时间段过滤「日期 → 内容」的对象（日记用）
function keysInRange(obj, from, to) {
  return Object.keys(obj || {}).filter((k) => inRange(k, from, to)).sort();
}
// 时间段后缀文案，用于标题/文件名
function rangeLabel(from, to) {
  if (!from && !to) return "全部";
  if (from && !to) return `${from}起`;
  if (!from && to) return `${to}及之前`;
  return `${from}至${to}`;
}

// ---------- 数据导出 ----------
// 生活记录主题 → Markdown
function exportLifeMarkdown(from, to) {
  const r = rangeLabel(from, to);
  const L = [`# 生活记录导出 · ${r}\n`];
  const ex = byRange(store.get(LS.ex, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  L.push(`## 🧘 运动打卡（${ex.length} 条）`);
  ex.forEach((e) => L.push(`- **${e.date} · ${e.type}**：${e.feeling || "（无感受）"}`));
  const wt = byRange(store.get(LS.wt, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  L.push(`\n## ⚖️ 体重记录（${wt.length} 条）`);
  wt.forEach((w) => L.push(`- ${w.date}：${w.kg} kg${w.note ? "（" + w.note + "）" : ""}`));
  const st = byRange(store.get(LS.st, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  L.push(`\n## 🔵 学习记录（${st.length} 条）`);
  st.forEach((s) => {
    const nm = s.name || s.subject || s.book || "（未命名）";
    const bits = [s.topic ? `【${s.topic}】` : "", nm, s.range ? `范围：${s.range}` : "", s.period ? `时段：${s.period}` : "", s.minutes ? `${s.minutes} 分钟` : ""].filter(Boolean).join(" · ");
    L.push(`- **${s.date}**：${bits}${s.output ? "\n  - 输出：" + s.output : (s.feeling ? "\n  - " + s.feeling : "")}`);
  });
  const jr = store.get(LS.jr, {});
  const jkeys = keysInRange(jr, from, to);
  const JL = [["special", "星星口袋"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["other", "其他"], ["words", "对自己说的话"]];
  L.push(`\n## 📔 日记（${jkeys.length} 天）`);
  jkeys.forEach((k) => {
    L.push(`\n### ${k}`);
    JL.forEach(([f, lab]) => { if (jr[k][f]) L.push(`- **${lab}**：${jr[k][f]}`); });
  });
  downloadText(`生活记录_${r}_${todayStr()}.md`, L.join("\n"));
  toast("已导出生活记录 ⬇️");
}

// 小满成长主题 → Markdown
function exportXmMarkdown(from, to) {
  const r = rangeLabel(from, to);
  const L = [`# 小满成长导出 · ${r}\n`];
  const xm = byRange(store.get(LS.xm, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  L.push(`## 📅 成长记录（${xm.length} 条）`);
  xm.forEach((x) => {
    const photos = x.photo ? (Array.isArray(x.photo) ? x.photo : [x.photo]) : [];
    L.push(`\n### ${x.date}${photos.length ? ` · 📷${photos.length}张` : ""}`);
    XM_FIELDS.forEach(([k, lab]) => { if (x[k]) L.push(`- **${lab}**：${x[k]}`); });
    if (x.words) L.push(`- **💌 To小满**：${x.words}`);
  });
  const ms = byRange(store.get(LS.ms, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  L.push(`\n## 🌟 成长里程碑（${ms.length} 条）`);
  ms.forEach((m) => {
    const photos = m.photo ? (Array.isArray(m.photo) ? m.photo : [m.photo]) : [];
    L.push(`- **${m.date}**：${m.title}${m.desc ? "（" + m.desc + "）" : ""}${photos.length ? ` · 📷${photos.length}张` : ""}`);
  });
  downloadText(`小满成长_${r}_${todayStr()}.md`, L.join("\n"));
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

// ============ 图文版导出（按时间顺序 · 照片内嵌 · 可存PDF传飞书） ============
// 把照片字段统一成数组（兼容旧的单张 dataURL）
function photosOf(v) {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}
// 若干张照片 → 内嵌 HTML
function photosHtml(v) {
  const ps = photosOf(v);
  if (!ps.length) return "";
  return `<div class="ph">` + ps.map((p) => `<img src="${p}" alt="照片"/>`).join("") + `</div>`;
}
// 生成自包含 HTML 页面外壳（带打印样式 + 打印按钮 + 飞书上传指引）
function htmlShell(title, body, note) {
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:820px;margin:0 auto;padding:28px 22px 80px;color:#1f2430;line-height:1.75;background:#fff}
h1{font-size:24px;margin:0 0 4px}
.sub{color:#8a93a6;font-size:13px;margin-bottom:22px}
h2{font-size:17px;margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid #eef1f6}
.day{border:1px solid #e8ebf2;border-radius:12px;padding:14px 16px;margin-bottom:14px;background:#fcfdff;break-inside:avoid}
.day.d0{background:#fff}
.date{font-size:13px;color:#8a93a6;letter-spacing:.3px;margin-bottom:6px}
.lab{display:inline-block;font-size:12px;font-weight:700;color:#4a5568;background:#f1f4f9;border-radius:6px;padding:1px 8px;margin-right:6px;vertical-align:1px}
.sec{margin:5px 0;white-space:pre-wrap;word-break:break-word;font-size:14px}
.ph{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.ph img{max-width:220px;max-height:260px;border-radius:8px;border:1px solid #e8ebf2;object-fit:cover}
.empty{color:#a8b0c0;font-size:13px}
.bar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e8ebf2;padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.06);z-index:9}
.bar .tip{font-size:12px;color:#8a93a6}
.btn{border:none;background:#2e9e5e;color:#fff;border-radius:8px;padding:8px 18px;font-size:14px;cursor:pointer;font-weight:600}
.btn.gh{background:#f1f4f9;color:#4a5568}
@media print{.bar{display:none}body{padding:0;max-width:none}.day{background:#fff}}
</style></head><body>
<h1>${title}</h1>
<div class="sub">${note || ""}</div>
${body || '<div class="empty">还没有记录</div>'}
<div class="bar">
  <button class="btn" onclick="window.print()">🖨 打印 / 存为 PDF</button>
  <button class="btn gh" onclick="window.scrollTo(0,0)">↑ 回到顶部</button>
  <span class="tip">存成 PDF 后，直接拖进飞书云文档 / 飞书云盘，照片会完整保留</span>
</div>
</body></html>`;
}
function esc(s) { return escapeHtml(String(s == null ? "" : s)); }
function nl(s) { return esc(s).replace(/\n/g, "<br>"); }

// 元气日常 → 图文版 HTML（按日期从早到晚）
function exportLifeHtml(from, to) {
  const r = rangeLabel(from, to);
  const ex = byRange(store.get(LS.ex, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const wt = byRange(store.get(LS.wt, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const st = byRange(store.get(LS.st, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const jr = store.get(LS.jr, {});
  const jkeys = keysInRange(jr, from, to);
  const JL = [["special", "星星口袋"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["other", "其他"], ["words", "对自己说的话"]];

  let b = `<h2>🧘 运动打卡（${ex.length}）</h2>`;
  b += ex.length ? ex.map((e) => `<div class="day"><div class="date">${e.date} · ${esc(e.type)}</div>
    <div class="sec">${nl(e.feeling || "（无感受）")}</div>${photosHtml(e.photo)}</div>`).join("")
    : '<div class="empty">暂无</div>';

  b += `<h2>⚖️ 体重记录（${wt.length}）</h2>`;
  b += wt.length ? wt.map((r) => `<div class="day"><div class="date">${r.date}</div>
    <div class="sec"><b>${r.kg} kg</b>${r.note ? " · " + esc(r.note) : ""}</div></div>`).join("")
    : '<div class="empty">暂无</div>';

  b += `<h2>🔵 学习记录（${st.length}）</h2>`;
  b += st.length ? st.map((s) => {
    const nm = s.name || s.subject || s.book || "（未命名）";
    const bits = [s.topic ? `【${esc(s.topic)}】` : "", esc(nm), s.range ? `范围：${esc(s.range)}` : "", s.period ? `时段：${esc(s.period)}` : "", s.minutes ? `${s.minutes} 分钟` : ""].filter(Boolean).join(" · ");
    return `<div class="day"><div class="date">${s.date}</div>
      <div class="sec">${bits}</div>
      ${s.output || s.feeling ? `<div class="sec">${nl(s.output || s.feeling)}</div>` : ""}</div>`;
  }).join("") : '<div class="empty">暂无</div>';

  b += `<h2>📔 日记（${jkeys.length} 天）</h2>`;
  b += jkeys.length ? jkeys.map((k) => `<div class="day"><div class="date">${k}</div>
    ${JL.filter(([f]) => jr[k][f]).map(([f, lab]) => `<div class="sec"><span class="lab">${lab}</span>${nl(jr[k][f])}</div>`).join("")}
    ${photosHtml(jr[k].photo)}</div>`).join("") : '<div class="empty">暂无</div>';

  downloadFile(`元气日常_图文版_${r}_${todayStr()}.html`, htmlShell("🍊 元气日常 · 图文回顾", b, `时间段：${r} · 按时间从早到晚排列 · 导出于 ${todayStr()}`));
  toast("图文版已导出，打开后打印成 PDF 即可传飞书 ⬇️");
}

// 小满成长 → 图文版 HTML（按日期从早到晚）
function exportXmHtml(from, to) {
  const r = rangeLabel(from, to);
  const xm = byRange(store.get(LS.xm, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const ms = byRange(store.get(LS.ms, []), from, to).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let b = `<h2>🌱 成长记录（${xm.length} 天）</h2>`;
  b += xm.length ? xm.map((x) => {
    const rows = XM_FIELDS.filter(([k]) => x[k]).map(([k, lab]) => `<div class="sec"><span class="lab">${lab}</span>${nl(x[k])}</div>`).join("");
    const to = x.words ? `<div class="sec"><span class="lab">💌 To小满</span>${nl(x.words)}</div>` : "";
    return `<div class="day"><div class="date">${x.date}</div>${rows}${to}${photosHtml(x.photo)}</div>`;
  }).join("") : '<div class="empty">暂无</div>';

  b += `<h2>🌟 成长里程碑（${ms.length}）</h2>`;
  b += ms.length ? ms.map((m) => `<div class="day"><div class="date">${m.date}</div>
    <div class="sec"><b>${esc(m.title)}</b>${m.desc ? "<br>" + nl(m.desc) : ""}</div>${photosHtml(m.photo)}</div>`).join("")
    : '<div class="empty">暂无</div>';

  downloadFile(`小满成长_图文版_${r}_${todayStr()}.html`, htmlShell("👑 小满成长 · 图文回顾", b, `时间段：${r} · 按时间从早到晚排列 · 导出于 ${todayStr()}`));
  toast("图文版已导出，打开后打印成 PDF 即可传飞书 ⬇️");
}

$("#btnExportLife").addEventListener("click", () =>
  openRangeExport("导出生活记录 · 选择时间段", (f, t) => exportLifeMarkdown(f, t)));
$("#btnExportXm").addEventListener("click", () =>
  openRangeExport("导出小满数据 · 选择时间段", (f, t) => exportXmMarkdown(f, t)));
$("#btnExportLifeHtml")?.addEventListener("click", () =>
  openRangeExport("导出图文版 · 选择时间段", (f, t) => exportLifeHtml(f, t)));
$("#btnExportXmHtml")?.addEventListener("click", () =>
  openRangeExport("导出图文版 · 选择时间段", (f, t) => exportXmHtml(f, t)));
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
syncSubjectHint();
renderPomo();
loadJournal();
renderXm();
renderXmChip();
renderMilestone();
syncLifeDateUI();
syncXmDateUI();
loadXmForm();
