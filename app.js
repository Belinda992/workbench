/* ============ 我的工作台 · 交互逻辑 ============ */

// ---------- 工具 ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ---------- 云端同步层 ----------
const SYNC = {
  mode: localStorage.getItem("wb_sync_mode") || "repo", // repo | gist | node
  token: localStorage.getItem("wb_sync_token") || "",
  gistId: localStorage.getItem("wb_gist_id") || "",
  repo: localStorage.getItem("wb_sync_repo") || "Belinda992/yinji-data",
  path: "data.json",
  branch: "main",
  base: location.pathname.replace(/\/[^/]*$/, "") + "/api",
  pushTimer: null,
};
function setSyncStatus(kind, text) {
  const pill = $("#syncPill"), btn = $("#btnSyncToggle");
  if (!pill) return;
  pill.className = "sync-pill " + kind;
  pill.textContent = text;
  if (btn) {
    const offline = kind === "local" || kind === "off";
    btn.textContent = offline ? "连接云端" : "退出云端";
    btn.dataset.mode = offline ? "login" : "logout";
  }
}
function schedulePush() {
  if (!SYNC.token) return;
  clearTimeout(SYNC.pushTimer);
  SYNC.pushTimer = setTimeout(pushAll, 800);
}
function collectBlob() {
  const blob = {};
  const SKIP = ["wb_sync_token", "wb_gist_id", "wb_sync_mode", "wb_sync_repo"];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("wb_") && !SKIP.includes(k)) {
      try { blob[k] = JSON.parse(localStorage.getItem(k)); } catch (_) {}
    }
  }
  return blob;
}
// 判断一个值是否算"空"
function isEmptyVal(v) {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}
// 云端 → 本地。安全策略：本地有内容、云端是空的 → 保留本地（防止空数据覆盖真数据）
function applyBlob(blob) {
  const keys = Object.keys(blob || {});
  if (!keys.length) return false;
  let skipped = 0;
  keys.forEach((k) => {
    if (!k.startsWith("wb_") || k === "wb_sync_token") return;
    const remote = blob[k];
    if (isEmptyVal(remote)) {
      let localRaw = null;
      try { localRaw = localStorage.getItem(k); } catch (_) {}
      if (localRaw) {
        let localVal = null;
        try { localVal = JSON.parse(localRaw); } catch (_) {}
        if (localVal !== null && !isEmptyVal(localVal)) { skipped++; return; }  // 保住本地数据
      }
    }
    try { localStorage.setItem(k, JSON.stringify(remote)); } catch (_) {}
  });
  return true;
}
// ---- GitHub 私有仓库后端（Git Data API，单文件可到 100MB，照片也放得下） ----
function ghHeaders() {
  return {
    "Authorization": "Bearer " + SYNC.token,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}
async function repoErr(r, tag) {
  if (r.status === 401) setSyncStatus("err", "令牌无效");
  else if (r.status === 403) setSyncStatus("err", "无权限/超限");
  else if (r.status === 404) setSyncStatus("err", "仓库不存在");
  else setSyncStatus("off", "未连接");
  console.warn("[sync]" + (tag || ""), r.status);
}
const API = "https://api.github.com/repos/";
// UTF-8 安全的 base64
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
// 推送：blob → tree → commit → 移动分支指针
async function repoPush(blob) {
  const content = b64encode(JSON.stringify(blob));
  try {
    const refR = await fetch(`${API}${SYNC.repo}/git/ref/heads/${SYNC.branch}`, { headers: ghHeaders() });
    if (!refR.ok) { repoErr(refR, "ref"); return; }
    const parentSha = (await refR.json()).object.sha;

    const blobR = await fetch(`${API}${SYNC.repo}/git/blobs`, {
      method: "POST", headers: ghHeaders(),
      body: JSON.stringify({ content, encoding: "base64" }),
    });
    if (!blobR.ok) { repoErr(blobR, "blob"); return; }
    const blobSha = (await blobR.json()).sha;

    const treeR = await fetch(`${API}${SYNC.repo}/git/trees`, {
      method: "POST", headers: ghHeaders(),
      body: JSON.stringify({
        base_tree: parentSha,
        tree: [{ path: SYNC.path, mode: "100644", type: "blob", sha: blobSha }],
      }),
    });
    if (!treeR.ok) { repoErr(treeR, "tree"); return; }
    const treeSha = (await treeR.json()).sha;

    const cmtR = await fetch(`${API}${SYNC.repo}/git/commits`, {
      method: "POST", headers: ghHeaders(),
      body: JSON.stringify({ message: "sync " + new Date().toISOString(), tree: treeSha, parents: [parentSha] }),
    });
    if (!cmtR.ok) { repoErr(cmtR, "commit"); return; }
    const commitSha = (await cmtR.json()).sha;

    const upR = await fetch(`${API}${SYNC.repo}/git/refs/heads/${SYNC.branch}`, {
      method: "PATCH", headers: ghHeaders(), body: JSON.stringify({ sha: commitSha }),
    });
    if (upR.ok) setSyncStatus("synced", "已同步云端");
    else repoErr(upR, "ref-update");
  } catch (_) { setSyncStatus("off", "未连接"); }
}
// 拉取：tree → blob（raw）
async function repoPull() {
  try {
    const treeR = await fetch(`${API}${SYNC.repo}/git/trees/${SYNC.branch}`, { headers: ghHeaders() });
    if (!treeR.ok) { repoErr(treeR, "tree-get"); return false; }
    const tree = await treeR.json();
    const node = (tree.tree || []).find((t) => t.path === SYNC.path && t.type === "blob");
    if (!node) { await repoPush(collectBlob()); return true; }
    const blobR = await fetch(`${API}${SYNC.repo}/git/blobs/${node.sha}`, {
      headers: { "Authorization": "Bearer " + SYNC.token, "Accept": "application/vnd.github.raw" },
    });
    if (!blobR.ok) { repoErr(blobR, "blob-get"); return false; }
    const txt = await blobR.text();
    let remote = null;
    try { remote = JSON.parse(txt); } catch (_) { remote = null; }
    if (remote && Object.keys(remote).length) applyBlob(remote);
    // 合并后再推一次：保证本机的数据也上云（哪台设备后连，哪台的数据为准）
    await repoPush(collectBlob());
    setSyncStatus("synced", "已同步云端");
    return true;
  } catch (_) { setSyncStatus("off", "未连接"); return false; }
}
// ---- GitHub Gist 后端（零服务器，跨设备同步；需令牌勾选 gist 权限） ----
async function gistError(r) {
  if (r.status === 401) setSyncStatus("err", "令牌无效");
  else if (r.status === 403) setSyncStatus("err", "无 gist 权限");
  else setSyncStatus("off", "未连接");
}
async function gistPush(blob) {
  const content = JSON.stringify(blob);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + SYNC.token,
    "Accept": "application/vnd.github+json",
  };
  try {
    if (!SYNC.gistId) {
      const r = await fetch("https://api.github.com/gists", {
        method: "POST", headers,
        body: JSON.stringify({ public: false, files: { "wb_store.json": { content } } }),
      });
      if (r.ok) {
        const j = await r.json();
        SYNC.gistId = j.id;
        localStorage.setItem("wb_gist_id", j.id);
        setSyncStatus("synced", "已同步云端");
        return;
      }
      gistError(r); return;
    }
    const r = await fetch("https://api.github.com/gists/" + SYNC.gistId, {
      method: "PATCH", headers,
      body: JSON.stringify({ files: { "wb_store.json": { content } } }),
    });
    if (r.ok) setSyncStatus("synced", "已同步云端");
    else gistError(r);
  } catch (_) { setSyncStatus("off", "未连接"); }
}
async function gistPull() {
  if (!SYNC.gistId) { await gistPush(collectBlob()); return true; }
  try {
    const r = await fetch("https://api.github.com/gists/" + SYNC.gistId, {
      headers: { "Authorization": "Bearer " + SYNC.token, "Accept": "application/vnd.github+json" },
    });
    if (!r.ok) { gistError(r); return false; }
    const j = await r.json();
    const file = j.files && j.files["wb_store.json"];
    if (file && file.content) {
      const blob = JSON.parse(file.content);
      if (!applyBlob(blob)) await gistPush(collectBlob());
    } else {
      await gistPush(collectBlob());
    }
    return true;
  } catch (_) { setSyncStatus("off", "未连接"); return false; }
}
// ---- 自建 Node 后端（兼容保留） ----
async function nodePush(blob) {
  try {
    const r = await fetch(SYNC.base + "/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-WB-Token": SYNC.token },
      body: JSON.stringify(blob),
    });
    if (r.ok) setSyncStatus("synced", "已同步云端");
    else if (r.status === 401) setSyncStatus("err", "密码错误");
    else setSyncStatus("off", "未连接");
  } catch (_) { setSyncStatus("off", "未连接"); }
}
async function nodePull() {
  try {
    const r = await fetch(SYNC.base + "/data", { headers: { "X-WB-Token": SYNC.token } });
    if (!r.ok) { setSyncStatus(r.status === 401 ? "err" : "off", r.status === 401 ? "密码错误" : "未连接"); return false; }
    const blob = await r.json();
    if (Object.keys(blob || {}).length) applyBlob(blob);
    else await nodePush(collectBlob());
    return true;
  } catch (_) { setSyncStatus("off", "未连接"); return false; }
}
// ---- 统一入口 ----
async function pushAll() {
  if (!SYNC.token) return;
  const blob = collectBlob();
  if (SYNC.mode === "repo") await repoPush(blob);
  else if (SYNC.mode === "gist") await gistPush(blob);
  else await nodePush(blob);
}
async function syncPull() {
  if (SYNC.mode === "repo") return await repoPull();
  if (SYNC.mode === "gist") return await gistPull();
  return await nodePull();
}
// 云端数据覆盖本地后，统一重渲染一次
function rerenderAll() {
  try {
    tasks = loadTasks();          // 同步后重新读一份，避免内存里的旧数据
    renderTodos(); renderKb(); renderAutos(); renderKpis();
    if (window.renderFrogs) renderFrogs();
    if (window.renderTimeline) renderTimeline();
    if (window.loadNoteFor) loadNoteFor(curTodoDate);
    if (window.renderChips) renderChips();
    if (window.renderEx) renderEx();
    if (window.renderWt) renderWt();
    if (window.renderSt) renderSt();
    if (window.renderPomo) renderPomo();
    if (window.renderXm) renderXm();
    if (window.renderXmChip) renderXmChip();
    if (window.renderMilestone) renderMilestone();
    if (window.loadJournal) loadJournal();
    if (window.loadXmForm) loadXmForm();
    if (window.syncLifeDateUI) syncLifeDateUI();
    if (window.syncXmDateUI) syncXmDateUI();
    if (window.renderXs) renderXs();
    if (window.renderCards) renderCards();
    if (window.renderReports) renderReports();
    if (window.renderFunnel) renderFunnel();
    if (window.renderCourses) renderCourses();
    if (window.populateXsCourseSelect) populateXsCourseSelect();
    if (window.renderKpis) renderKpis();
    if (window.renderFinance) renderFinance();
    if (window.renderCourseIncome) renderCourseIncome();
    if (window.renderMaterials) renderMaterials();
    if (window.renderProductions) renderProductions();
    if (window.renderSchedules) renderSchedules();
    if (window.renderMetrics) renderMetrics();
    if (window.renderAssist) renderAssist();
    if (window.renderDream) renderDream();
  } catch (e) { console.warn("rerenderAll 部分失败:", e); }
}

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); schedulePush(); },
};
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 1600);
}

// ---------- 导航切换 ----------
$$("#nav .nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("#nav .nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".view").forEach((v) => v.classList.remove("active"));
    const target = $("#view-" + btn.dataset.view);
    if (target) target.classList.add("active");
  });
});

// ---------- 快捷指令 ----------
const COMMANDS = [
  { ico: "📄", title: "写周报", desc: "根据本周工作记录，生成一份结构化周报", prompt: "请根据我本周的记录，生成一份周报，包含：本周完成、进行中、下周计划。" },
  { ico: "📁", title: "整理文件", desc: "批量重命名 / 归类下载文件夹", prompt: "请帮我整理 Downloads 文件夹，按类型归类到子目录，并列出改动。" },
  { ico: "📊", title: "分析数据", desc: "上传表格，自动分析与可视化", prompt: "请读取这份数据文件，做关键指标分析并生成图表。" },
  { ico: "📧", title: "回复邮件", desc: "根据要点起草一封得体的邮件", prompt: "请帮我起草一封邮件，主题是____，要点包含____。" },
  { ico: "🔍", title: "深度调研", desc: "对某个主题做深度研究并出报告", prompt: "请就【主题】做一次深度调研，输出带来源的报告。" },
  { ico: "🧩", title: "做 PPT", desc: "根据大纲生成演示文稿", prompt: "请根据以下大纲生成一份 PPT：____。" },
  { ico: "🌐", title: "翻译润色", desc: "中英互译并优化表达", prompt: "请把下面这段内容翻译并润色为专业表达：____。" },
  { ico: "💡", title: "头脑风暴", desc: "针对问题给出创意方案", prompt: "请针对【问题】给出 10 个有创意的解决方案。" },
];
function renderCommands() {
  $("#cmdGrid").innerHTML = COMMANDS.map((c, i) => `
    <div class="cmd-card" data-i="${i}">
      <div class="cmd-ico">${c.ico}</div>
      <div class="cmd-title">${c.title}</div>
      <div class="cmd-desc">${c.desc}</div>
      <div class="cmd-prompt">${c.prompt}</div>
    </div>`).join("");
  $$("#cmdGrid .cmd-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const text = card.querySelector(".cmd-prompt").textContent;
      try {
        await navigator.clipboard.writeText(text);
        toast("指令已复制，粘贴给 WorkBuddy 即可执行 ✅");
      } catch {
        toast("指令：" + text);
      }
    });
  });
}
renderCommands();

// ---------- 数据看板 ----------
const KPIS = [
  { label: "本月任务", value: "128", trend: "+12%", dir: "up" },
  { label: "完成率", value: "94%", trend: "+3%", dir: "up" },
  { label: "待处理", value: "7", trend: "-2", dir: "down" },
  { label: "专注时长", value: "36h", trend: "+8h", dir: "up" },
];
function renderKpis() {
  $("#kpiRow").innerHTML = KPIS.map((k) => `
    <div class="kpi">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-trend ${k.dir}">${k.dir === "up" ? "▲" : "▼"} ${k.trend}</div>
    </div>`).join("");
}
renderKpis();

// 折线图（SVG）
function lineChart() {
  const data = [12, 18, 15, 22, 19, 27, 24];
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  const w = 560, h = 180, pad = 24;
  const max = Math.max(...data), min = 0;
  const stepX = (w - pad * 2) / (data.length - 1);
  const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const pts = data.map((v, i) => [pad + i * stepX, y(v)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const area = `M${pts[0][0]} ${h - pad} ` + pts.map((p) => "L" + p[0] + " " + p[1]).join(" ") + ` L${pts.at(-1)[0]} ${h - pad} Z`;
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#2e9e5e"/>
    <text x="${p[0]}" y="${h - 6}" font-size="10" fill="#8a93a6" text-anchor="middle">${labels[i]}</text>`).join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="min-width:520px">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e9e5e" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#2e9e5e" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g)"/>
    <path d="${path}" fill="none" stroke="#2e9e5e" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}</svg>`;
}
$("#chartLine").innerHTML = lineChart();

// 柱状图（SVG）
function barChart() {
  const data = [
    { name: "工作", v: 45, c: "#2e9e5e" },
    { name: "学习", v: 25, c: "#1faa6b" },
    { name: "生活", v: 18, c: "#e8a33d" },
    { name: "其它", v: 12, c: "#7fb89a" },
  ];
  const w = 560, h = 180, pad = 30;
  const max = Math.max(...data.map((d) => d.v));
  const bw = 70, gap = (w - pad * 2 - bw * data.length) / (data.length - 1);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="min-width:520px">
    ${data.map((d, i) => {
      const x = pad + i * (bw + gap);
      const bh = (d.v / max) * (h - pad * 2);
      const y = h - pad - bh;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8" fill="${d.c}"/>
        <text x="${x + bw / 2}" y="${y - 6}" font-size="12" fill="#1f2430" text-anchor="middle" font-weight="600">${d.v}%</text>
        <text x="${x + bw / 2}" y="${h - 8}" font-size="11" fill="#8a93a6" text-anchor="middle">${d.name}</text>`;
    }).join("")}</svg>`;
}
$("#chartBar").innerHTML = barChart();

// ---------- 待办统一数据：三只青蛙 + 其他待办，都带日期 ----------
function todoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todoShift(d, n) {
  const [y, m, dd] = String(d).split("-").map(Number);
  const t = new Date(y, m - 1, dd);
  t.setDate(t.getDate() + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function todoLabel(d) {
  const t = todoToday();
  if (d === t) return "今天";
  if (d === todoShift(t, -1)) return "昨天";
  if (d === todoShift(t, 1)) return "明天";
  const p = String(d).split("-");
  return `${+p[1]}月${+p[2]}日`;
}
function todoWeekday(d) {
  const [y, m, dd] = String(d).split("-").map(Number);
  return new Date(y, m - 1, dd).getDay();
}
const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
function tdEsc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 旧的无日期数据（wb_frogs / wb_todos）迁移到新的 wb_tasks，只跑一次
function loadTasks() {
  const saved = store.get("wb_tasks", null);
  if (Array.isArray(saved)) return saved;
  const list = [];
  const t0 = todoToday();
  const oldFrogs = store.get("wb_frogs", []);
  if (Array.isArray(oldFrogs)) oldFrogs.forEach((f, i) => {
    if (f && String(f.text || "").trim())
      list.push({ id: "frog" + i + "_" + Date.now(), type: "frog", date: t0, text: f.text, done: !!f.done, ts: Date.now() + i });
  });
  const oldTodos = store.get("wb_todos", []);
  if (Array.isArray(oldTodos)) oldTodos.forEach((t, i) => {
    if (t && String(t.text || "").trim())
      list.push({ id: t.id || "todo" + i + "_" + Date.now(), type: "todo", date: t0, text: t.text, done: !!t.done, ts: t.ts || Date.now() + i });
  });
  store.set("wb_tasks", list);
  return list;
}

let tasks = loadTasks();
let schedules = store.get("wb_schedules", []);
let curTodoDate = todoToday();

function saveTasks() { store.set("wb_tasks", tasks); }
function saveSchedules() { store.set("wb_schedules", schedules); }
const frogsOf = (d) => tasks.filter((t) => t.type === "frog" && t.date === d).sort((a, b) => (a.ts || 0) - (b.ts || 0));
const todosOf = (d) => tasks.filter((t) => t.type === "todo" && t.date === d).sort((a, b) => (a.ts || 0) - (b.ts || 0));

// 通用操作：完成 / 取消完成、延迟 N 天、删除
function toggleTask(id) {
  const t = tasks.find((x) => String(x.id) === String(id));
  if (!t) return;
  t.done = !t.done;
  saveTasks(); renderTodoAll();
  toast(t.done ? "完成 ✓" : "已取消完成");
}
function delayTask(id, days) {
  const t = tasks.find((x) => String(x.id) === String(id));
  if (!t) return;
  t.date = todoShift(t.date || curTodoDate, days || 1);
  t.done = false;
  saveTasks(); renderTodoAll();
  toast("已推迟到 " + todoLabel(t.date) + "（" + t.date + "）");
}
function delTask(id) {
  const before = tasks.length;
  tasks = tasks.filter((x) => String(x.id) !== String(id));
  if (tasks.length === before) return;
  saveTasks(); renderTodoAll();
  toast("已删除");
}

// 自动顺延：当天（含更早）没打勾完成的青蛙 / 待办，默认推到「今天」（即它的第二天）
function autoRoll() {
  const today = todoToday();
  let changed = false;
  tasks.forEach((t) => {
    if ((t.type === "frog" || t.type === "todo") && !t.done && t.date < today) {
      t.date = today;
      changed = true;
    }
  });
  if (changed) { saveTasks(); return true; }
  return false;
}

// ---------- 三只青蛙（每天固定三行）----------
function renderFrogCount() {
  const list = frogsOf(curTodoDate);
  const done = list.filter((f) => f.done).length;
  $("#frogCount").textContent = `（已吃 ${done}/${Math.max(3, list.length)} 只）`;
}
function renderFrogs() {
  const list = frogsOf(curTodoDate);
  $$("#frogRows .todo-item").forEach((li) => {
    const i = +li.dataset.i;
    const f = list[i] || null;
    const chk = li.querySelector(".todo-check");
    const inp = li.querySelector(".frog-input");
    chk.checked = !!(f && f.done);
    inp.value = f ? f.text : "";
    li.classList.toggle("done", !!(f && f.done));
  });
  renderFrogCount();
}
$$("#frogRows .todo-item").forEach((li) => {
  const i = +li.dataset.i;
  const chk = li.querySelector(".todo-check");
  const inp = li.querySelector(".frog-input");
  chk.addEventListener("change", () => {
    const f = frogsOf(curTodoDate)[i];
    if (!f) { chk.checked = false; toast("先写下这只青蛙～"); return; }
    f.done = chk.checked; saveTasks(); renderFrogs();
  });
  inp.addEventListener("input", () => {
    let f = frogsOf(curTodoDate)[i];
    if (!f) {
      if (!inp.value.trim()) return;
      f = { id: "frog_" + Date.now() + "_" + i, type: "frog", date: curTodoDate, text: inp.value, done: false, ts: Date.now() };
      tasks.push(f);
    } else { f.text = inp.value; }
    saveTasks(); renderFrogCount();
  });
  li.querySelector(".ta-done").addEventListener("click", () => { const f = frogsOf(curTodoDate)[i]; if (f) toggleTask(f.id); });
  li.querySelector(".ta-delay").addEventListener("click", () => { const f = frogsOf(curTodoDate)[i]; if (f) delayTask(f.id, 1); });
  li.querySelector(".ta-del").addEventListener("click", () => { const f = frogsOf(curTodoDate)[i]; if (f) delTask(f.id); });
});

// ---------- 其他待办 ----------
function renderTodos() {
  const list = todosOf(curTodoDate);
  $("#todoList").innerHTML = list.length
    ? list.map((t) => `
    <li class="todo-item ${t.done ? "done" : ""}" data-id="${t.id}">
      <input class="todo-check" type="checkbox" ${t.done ? "checked" : ""}/>
      <span class="todo-text">${tdEsc(t.text)}</span>
      <span class="todo-acts">
        <button class="ta-btn ta-done" data-id="${t.id}" type="button" title="完成 / 取消完成">✓</button>
        <button class="ta-btn ta-delay" data-id="${t.id}" type="button" title="延迟到第二天">»</button>
        <button class="ta-btn ta-del" data-id="${t.id}" type="button" title="删除">✕</button>
      </span>
    </li>`).join("")
    : '<li class="muted empty-tip">这天还没有待办</li>';
  const left = list.filter((t) => !t.done).length;
  $("#todoCount").textContent = list.length ? `（剩 ${left} 项）` : "";
  $$("#todoList .todo-check").forEach((c) =>
    c.addEventListener("change", () => toggleTask(c.closest(".todo-item").dataset.id))
  );
  $$("#todoList .ta-done").forEach((b) => b.addEventListener("click", () => toggleTask(b.dataset.id)));
  $$("#todoList .ta-delay").forEach((b) => b.addEventListener("click", () => delayTask(b.dataset.id, 1)));
  $$("#todoList .ta-del").forEach((b) => b.addEventListener("click", () => delTask(b.dataset.id)));
}
$("#todoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#todoInput").value.trim();
  if (!v) return;
  tasks.push({ id: "todo_" + Date.now(), type: "todo", date: curTodoDate, text: v, done: false, ts: Date.now() });
  $("#todoInput").value = "";
  saveTasks(); renderTodos();
});

// ---------- 今日时间轴（6:00–22:00，30 分钟一格）----------
const TL_START = 6 * 60, TL_END = 22 * 60, TL_STEP = 30;
const TL_SIX = [8, 10, 12, 14, 16, 18];            // 六时书的六个整点
const TL_ICONS = [
  { key: "frog",    icon: "🐸", label: "青蛙" },
  { key: "sport",   icon: "🏃", label: "运动" },
  { key: "study",   icon: "📚", label: "学习" },
  { key: "meal",    icon: "🍚", label: "吃饭" },
  { key: "rest",    icon: "☕", label: "休息" },
  { key: "xiaoman", icon: "👧", label: "小满" },
  { key: "chore",   icon: "🧹", label: "杂事" },
  { key: "enjoy",   icon: "☀️", label: "享受" },
  { key: "record",  icon: "✍️", label: "记录" },
  { key: "waste",   icon: "💨", label: "浪费" },
];
// 老图标换成新名字后，旧记录要能认出来
const TL_LEGACY = { cal: "chore", pomo: "study", other: "chore" };
function iconOf(key) {
  return TL_ICONS.find((x) => x.key === key) ||
         TL_ICONS.find((x) => x.key === (TL_LEGACY[key] || "")) ||
         TL_ICONS[TL_ICONS.length - 1];
}
// 六时书种子体系（来自《种子葵花宝典》）：6 棵大种子，每棵含若干小种子
// 六个时段 8/10/12/14/16/18 依次对应这 6 棵大种子；选种子时先定大种子，再选小种子
const TL_BIG_SEEDS = [
  { name: "爱护生命",     seeds: ["保护身体", "爱护动物", "意识宁静", "提升能量", "好好吃饭", "觉察自己", "消除病痛", "消除病毒", "提升免疫力", "整理清扫"] },
  { name: "慷慨大度",     seeds: ["慷慨金钱", "慷慨时间", "财富关系", "满愿", "提前", "快速成交", "资源链接"] },
  { name: "有觉知的语言", seeds: ["柔和的语言", "和谐的语言", "有意义的语言", "诚实的语言", "感恩", "赋能孩子"] },
  { name: "有意义的行为", seeds: ["尊重他人关系", "自我成长", "庆贺他人", "发现身边的美好", "工作积极", "做好家务", "脱瘾而出", "培养灵感", "记录六时书", "夫妻恩爱", "创造财富", "运营企业", "培养习惯", "实现梦想"] },
  { name: "同情他人不幸", seeds: ["同情他人不幸"] },
  { name: "正确的世界观", seeds: ["种子法则", "空性法则", "为世界而做", "分享智慧", "学习智慧", "服务智慧"] },
];
function bigIndexOfSmall(s) {
  for (let i = 0; i < TL_BIG_SEEDS.length; i++)
    if (TL_BIG_SEEDS[i].seeds.indexOf(s) !== -1) return i;
  return -1;
}

function slotKey(min) {
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
}
function tlKey(d) { return "wb_tl_" + d; }
function loadTl(d) { return store.get(tlKey(d), null) || {}; }
function saveTl(d, data) { store.set(tlKey(d), data); }
function sixKey(d) { return "wb_six_" + d; }
function loadSixData(d) {
  const raw = store.get(sixKey(d), null);
  if (raw && (raw.seeds || raw.notes)) return { seeds: raw.seeds || [], notes: raw.notes || [] };
  if (d === todoToday()) {   // 旧的无日期六时书，只在今天迁移一次
    const seeds = [], notes = [];
    let has = false;
    for (let i = 0; i < 6; i++) {
      const s = store.get("wb_six_seed_" + i, "");
      const n = store.get("wb_six_note_" + i, "");
      if (s || n) has = true;
      seeds.push(s); notes.push(n);
    }
    if (has) { const data = { seeds: seeds, notes: notes }; store.set(sixKey(d), data); return data; }
  }
  return { seeds: [], notes: [] };
}
function saveSixAt(i, field, value) {
  const data = loadSixData(curTodoDate);
  data[field][i] = value;
  store.set(sixKey(curTodoDate), data);
}

function renderTimeline() {
  const data = loadTl(curTodoDate);
  const six = loadSixData(curTodoDate);
  let html = "";
  for (let m = TL_START; m < TL_END; m += TL_STEP) {
    const key = slotKey(m);
    const isHour = m % 60 === 0;
    const sixIdx = TL_SIX.indexOf(Math.floor(m / 60));
    const isSix = sixIdx !== -1 && isHour;
    const item = data[key] || null;
    const ico = item ? iconOf(item.icon) : null;
    const seed = isSix ? (six.seeds[sixIdx] || "") : "";
    const sNote = isSix ? (six.notes[sixIdx] || "") : "";
    html += `<div class="tl-row ${isHour ? "is-hour" : ""} ${isSix ? "is-six" : ""}" data-key="${key}">
      <div class="tl-time">${isHour ? key : ""}</div>
      <div class="tl-axis"><span class="tl-dot"></span></div>
      <div class="tl-body">
        ${isSix ? `<span class="tl-lotus ${seed ? "on" : ""}" data-idx="${sixIdx}" title="${tdEsc(TL_BIG_SEEDS[sixIdx].name)}">🪷 ${seed ? tdEsc(TL_BIG_SEEDS[sixIdx].name) + " · " + tdEsc(seed) + (sNote ? " · " + tdEsc(sNote) : "") : "六时书 · " + tdEsc(TL_BIG_SEEDS[sixIdx].name)}</span>` : ""}
        ${item ? `<span class="tl-item"><span class="tl-ico">${ico.icon}</span><span class="tl-text">${tdEsc(item.text)}</span><button class="tl-x" data-key="${key}" type="button" title="清除">✕</button></span>` : '<span class="tl-empty"></span>'}
      </div>
    </div>`;
  }
  $("#timeline").innerHTML = html;
  $$("#timeline .tl-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      const x = e.target.closest(".tl-x");
      if (x) {
        const d = loadTl(curTodoDate); delete d[x.dataset.key];
        saveTl(curTodoDate, d); renderTimeline(); return;
      }
      const lotus = e.target.closest(".tl-lotus");
      if (lotus) { openSixEditor(+lotus.dataset.idx); return; }
      openSlotEditor(row.dataset.key);
    });
  });
}
function closeTlEditors() { $$("#timeline .tl-editor").forEach((b) => b.remove()); }

// 点一格：选图标 + 写事情
function openSlotEditor(key) {
  closeTlEditors();
  const row = document.querySelector('#timeline .tl-row[data-key="' + key + '"]');
  if (!row) return;
  const cur = loadTl(curTodoDate)[key] || { icon: "chore", text: "" };
  const box = document.createElement("div");
  box.className = "tl-editor";
  box.innerHTML =
    '<div class="tle-icons">' +
    TL_ICONS.map((ic) => `<button type="button" class="tle-ico ${ic.key === cur.icon ? "on" : ""}" data-icon="${ic.key}" title="${ic.label}">${ic.icon}</button>`).join("") +
    '</div>' +
    `<input class="tle-text" type="text" value="${tdEsc(cur.text)}" placeholder="这一格要做什么…" />` +
    '<div class="tle-acts"><button type="button" class="tle-save">保存</button><button type="button" class="tle-cancel">取消</button>' +
    (cur.text ? '<button type="button" class="tle-del">清除</button>' : "") + "</div>";
  row.parentNode.insertBefore(box, row.nextSibling);
  let icon = cur.icon;
  box.querySelectorAll(".tle-ico").forEach((b) =>
    b.addEventListener("click", () => {
      icon = b.dataset.icon;
      box.querySelectorAll(".tle-ico").forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  box.querySelector(".tle-save").addEventListener("click", () => {
    const text = box.querySelector(".tle-text").value.trim();
    const d = loadTl(curTodoDate);
    if (text) d[key] = { icon: icon, text: text }; else delete d[key];
    saveTl(curTodoDate, d); renderTimeline();
  });
  box.querySelector(".tle-cancel").addEventListener("click", () => box.remove());
  const del = box.querySelector(".tle-del");
  if (del) del.addEventListener("click", () => {
    const d = loadTl(curTodoDate); delete d[key];
    saveTl(curTodoDate, d); renderTimeline();
  });
  const inp = box.querySelector(".tle-text");
  inp.focus();
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") box.querySelector(".tle-save").click(); });
}

// 点莲花：先选大种子，再在其中选小种子，最后写行动
function openSixEditor(idx) {
  closeTlEditors();
  const row = document.querySelectorAll("#timeline .tl-row.is-six")[idx];
  if (!row) return;
  const six = loadSixData(curTodoDate);
  const curSmall = six.seeds[idx] || "";
  let curBig = bigIndexOfSmall(curSmall);
  if (curBig === -1) curBig = idx;   // 旧数据 / 未选：默认用该时段对应的大种子
  const box = document.createElement("div");
  box.className = "tl-editor six";
  const bigOpts = TL_BIG_SEEDS.map((b, i) =>
    `<option value="${i}" ${i === curBig ? "selected" : ""}>${b.name}</option>`).join("");
  const smallOpts = (sel, mark) =>
    '<option value="">— 选小种子 —</option>' +
    TL_BIG_SEEDS[sel].seeds.map((s) => `<option value="${s}" ${s === mark ? "selected" : ""}>${s}</option>`).join("");
  box.innerHTML =
    `<div class="tle-head">🪷 六时书 · ${TL_SIX[idx]}:00</div>` +
    `<div class="tle-sub">这一时对应的大种子：</div>` +
    `<select class="tle-big">${bigOpts}</select>` +
    `<div class="tle-sub">再选一颗小种子：</div>` +
    `<select class="tle-seed">${smallOpts(curBig, curSmall)}</select>` +
    `<input class="tle-note" type="text" value="${tdEsc(six.notes[idx] || "")}" placeholder="具体一件好事 / 行动（可选）" />` +
    '<div class="tle-acts"><button type="button" class="tle-save">保存</button><button type="button" class="tle-cancel">取消</button></div>';
  row.parentNode.insertBefore(box, row.nextSibling);
  const bigSel = box.querySelector(".tle-big");
  const smallSel = box.querySelector(".tle-seed");
  bigSel.addEventListener("change", () => {   // 切换大种子 → 小种子列表跟着变
    smallSel.innerHTML = '<option value="">— 选小种子 —</option>' +
      TL_BIG_SEEDS[+bigSel.value].seeds.map((s) => `<option value="${s}">${s}</option>`).join("");
  });
  box.querySelector(".tle-save").addEventListener("click", () => {
    const seed = smallSel.value;
    const note = box.querySelector(".tle-note").value.trim();
    saveSixAt(idx, "seeds", seed);
    saveSixAt(idx, "notes", note);
    renderTimeline();
    const bn = TL_BIG_SEEDS[+bigSel.value].name;
    toast(seed ? `「${bn} · ${seed}」已种下 🪷` : "六时书已更新");
  });
  box.querySelector(".tle-cancel").addEventListener("click", () => box.remove());
}

$("#tlCopyPrev").addEventListener("click", () => {
  const prev = todoShift(curTodoDate, -1);
  const src = loadTl(prev);
  if (!Object.keys(src).length) { toast(todoLabel(prev) + "没有安排可复制"); return; }
  const cur = loadTl(curTodoDate);
  let n = 0;
  Object.keys(src).forEach((k) => { if (!cur[k]) { cur[k] = src[k]; n++; } });
  saveTl(curTodoDate, cur); renderTimeline();
  toast(n ? "已复制 " + n + " 条到" + todoLabel(curTodoDate) : "这天已经有安排了");
});
$("#tlClear").addEventListener("click", () => {
  if (!Object.keys(loadTl(curTodoDate)).length) { toast("这天本来就是空的"); return; }
  if (!confirm("清空 " + todoLabel(curTodoDate) + "（" + curTodoDate + "）的所有时间安排？")) return;
  saveTl(curTodoDate, {}); renderTimeline();
  toast("已清空");
});

// ---------- 时间统计：看看时间都花在哪了 ----------
function renderTlStats() {
  const days = 30;
  const counts = {};
  let total = 0;
  for (let i = 0; i < days; i++) {
    const data = loadTl(todoShift(todoToday(), -i));
    Object.keys(data).forEach((k) => {
      const it = data[k];
      const key = it && it.icon ? it.icon : "chore";
      counts[key] = (counts[key] || 0) + 1;
      total++;
    });
  }
  const box = $("#tlStatsBox");
  if (!total) {
    box.innerHTML = '<div class="muted">这一个月还没有记录，先去时间轴上点几格吧～</div>';
    return;
  }
  const rows = TL_ICONS.filter((ic) => (counts[ic.key] || 0) > 0)
    .map((ic) => ({ icon: ic.icon, label: ic.label, n: counts[ic.key] }))
    .sort((a, b) => b.n - a.n);
  const maxN = rows[0].n;
  const hrs = (n) => (n * 0.5).toFixed(1);
  let html = `<div class="ts-head">📊 近 ${days} 天 · 共记录 ${hrs(total)} 小时（每格 30 分钟）</div>`;
  html += '<div class="ts-list">' + rows.map((r) => `
    <div class="ts-row">
      <span class="ts-ico">${r.icon}</span>
      <span class="ts-name">${r.label}</span>
      <span class="ts-bar"><i style="width:${Math.max(3, Math.round((r.n / maxN) * 100))}%"></i></span>
      <span class="ts-num">${hrs(r.n)}h</span>
      <span class="ts-pct">${Math.round((r.n / total) * 100)}%</span>
    </div>`).join("") + "</div>";
  box.innerHTML = html;
}
$("#tlStats").addEventListener("click", () => {
  const box = $("#tlStatsBox");
  if (box.style.display === "block") {
    box.style.display = "none";
    $("#tlStats").textContent = "📊 时间统计";
  } else {
    renderTlStats();
    box.style.display = "block";
    $("#tlStats").textContent = "📊 收起统计";
  }
});

// ---------- 查看日期切换 ----------
let weekPlanOpen = false;
function renderTodoAll() {
  renderFrogs();
  renderTodos();
  renderTimeline();
  if (weekPlanOpen) renderWeekPlan();
}
function setTodoDate(d) {
  curTodoDate = d;
  $("#todoDate").value = d;
  const hint = $("#todoDateHint");
  if (hint) hint.textContent = d === todoToday() ? "" : "正在看 " + todoLabel(d) + "（" + d + "）";
  if (d === todoToday() && autoRoll()) {   // 顺延昨日未完成的青蛙 / 待办到今天
    toast("已把昨天没完成的青蛙 / 待办顺延到今天 ✓");
  }
  renderFrogs(); renderTodos(); renderTimeline();
  loadNoteFor(d);
  if (weekPlanOpen) renderWeekPlan();
}
$("#todoDate").addEventListener("change", () => {
  if ($("#todoDate").value) setTodoDate($("#todoDate").value);
  else $("#todoDate").value = curTodoDate;
});
$("#todoPrevDay").addEventListener("click", () => setTodoDate(todoShift(curTodoDate, -1)));
$("#todoNextDay").addEventListener("click", () => setTodoDate(todoShift(curTodoDate, 1)));
document.querySelectorAll("#view-todo .dp-quick").forEach((b) =>
  b.addEventListener("click", () => setTodoDate(todoShift(todoToday(), +b.dataset.d)))
);
$("#btnWeekPlan").addEventListener("click", () => {
  weekPlanOpen = !weekPlanOpen;
  $("#weekPlan").style.display = weekPlanOpen ? "block" : "none";
  const main = $("#todoMain");
  if (main) main.style.display = weekPlanOpen ? "none" : "";
  $("#btnWeekPlan").textContent = weekPlanOpen ? "← 回到当天" : "📅 周计划";
  if (weekPlanOpen) renderWeekPlan();
});

// ---------- 周计划：一次把七天排好 ----------
function weekStart(d) {
  return todoShift(d, -((todoWeekday(d) + 6) % 7));   // 周一当第一天
}
function renderWeekPlan() {
  const start = weekStart(curTodoDate);
  let html = '<div class="wp-head">🗓️ 一周排程（' + start + " 起，改完自动存）</div>";
  html += '<div class="wp-grid">';
  for (let i = 0; i < 7; i++) {
    const d = todoShift(start, i);
    const fr = frogsOf(d);
    const td = todosOf(d);
    const isToday = d === todoToday();
    const isCur = d === curTodoDate;
    html += `<div class="wp-day ${isToday ? "is-today" : ""} ${isCur ? "is-cur" : ""}">
      <div class="wp-dayhead">
        <b>${WEEK_CN[todoWeekday(d)]}</b>
        <span class="wp-date">${d.slice(5)}${isToday ? " · 今天" : ""}</span>
        <span class="wp-jump" data-date="${d}">看这天 →</span>
      </div>
      <div class="wp-sec">🐸 青蛙</div>
      ${[0, 1, 2].map((k) => `<input class="wp-frog" type="text" data-date="${d}" data-k="${k}" value="${tdEsc(fr[k] ? fr[k].text : "")}" placeholder="青蛙 ${k + 1}" />`).join("")}
      <div class="wp-sec">📝 待办（一行一条）</div>
      <textarea class="wp-todo" data-date="${d}" placeholder="一行一条">${tdEsc(td.map((t) => t.text).join("\n"))}</textarea>
    </div>`;
  }
  html += "</div>";
  $("#weekPlan").innerHTML = html;

  $$("#weekPlan .wp-frog").forEach((inp) => {
    inp.addEventListener("change", () => {
      const d = inp.dataset.date, k = +inp.dataset.k;
      const fr = frogsOf(d);
      const f = fr[k];
      const v = inp.value.trim();
      if (!f) {
        if (!v) return;
        tasks.push({ id: "frog_" + Date.now() + "_" + k, type: "frog", date: d, text: v, done: false, ts: Date.now() + k });
      } else if (!v) {
        tasks = tasks.filter((x) => String(x.id) !== String(f.id));
      } else { f.text = v; }
      saveTasks();
      renderFrogs();
      if (weekPlanOpen) renderWeekPlan();
    });
  });
  $$("#weekPlan .wp-todo").forEach((ta) => {
    ta.addEventListener("change", () => {
      const d = ta.dataset.date;
      const lines = ta.value.split("\n").map((s) => s.trim()).filter(Boolean);
      const old = todosOf(d);
      const keep = [];
      lines.forEach((line, i) => {
        const exist = old[i];
        if (exist) { exist.text = line; keep.push(String(exist.id)); }
        else tasks.push({ id: "todo_" + Date.now() + "_" + i, type: "todo", date: d, text: line, done: false, ts: Date.now() + i });
      });
      old.forEach((o) => {
        if (keep.indexOf(String(o.id)) === -1) tasks = tasks.filter((x) => String(x.id) !== String(o.id));
      });
      saveTasks(); renderTodos();
      if (weekPlanOpen) renderWeekPlan();
    });
  });
  $$("#weekPlan .wp-jump").forEach((b) =>
    b.addEventListener("click", () => {
      setTodoDate(b.dataset.date);
      $("#btnWeekPlan").click();
    })
  );
}
renderTodos();

// ---------- 随手笔记（按日期各存一份）----------
const noteArea = $("#noteArea");
if (store.get("wb_note", null) && !store.get("wb_note_" + todoToday(), null)) {
  store.set("wb_note_" + todoToday(), store.get("wb_note", ""));   // 旧笔记迁到今天
}
function loadNoteFor(d) {
  noteArea.value = store.get("wb_note_" + d, "");
}
noteArea.addEventListener("input", () => store.set("wb_note_" + curTodoDate, noteArea.value));

// 统一初始化：青蛙 / 待办 / 时间轴 / 笔记 都按当天渲染
setTodoDate(curTodoDate);

// ---------- 知识库 ----------
let kbs = store.get("wb_kb", [
  { title: "WorkBuddy 文档", url: "https://www.codebuddy.cn/docs/workbuddy/Overview" },
]);
function renderKb() {
  $("#kbList").innerHTML = kbs.map((k, i) => `
    <li class="kb-item" data-i="${i}">
      <a href="${k.url || "#"}" target="_blank" rel="noopener">${k.title}</a>
      <button class="kb-del">✕</button>
    </li>`).join("");
  $$("#kbList .kb-item").forEach((li) => {
    li.querySelector(".kb-del").addEventListener("click", () => {
      kbs.splice(+li.dataset.i, 1); store.set("wb_kb", kbs); renderKb();
    });
  });
}
$("#kbForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#kbTitle").value.trim();
  const url = $("#kbUrl").value.trim();
  if (!title) return;
  kbs.unshift({ title, url });
  $("#kbTitle").value = ""; $("#kbUrl").value = "";
  store.set("wb_kb", kbs); renderKb();
});
renderKb();

// ---------- 自动化任务 ----------
const AUTOS = store.get("wb_autos", [
  { ico: "🌅", name: "每日晨报", meta: "每天 08:30 · 抓取新闻并生成简报", on: true },
  { ico: "📊", name: "周报自动生成", meta: "每周五 18:00 · 汇总本周工作", on: true },
  { ico: "🧹", name: "周末文件整理", meta: "每周日 22:00 · 归类下载目录", on: false },
  { ico: "💾", name: "数据备份提醒", meta: "每月 1 日 09:00 · 提醒备份", on: true },
]);
function renderAutos() {
  $("#autoList").innerHTML = AUTOS.map((a, i) => `
    <div class="auto-item">
      <div class="auto-ico">${a.ico}</div>
      <div class="auto-main">
        <div class="auto-name">${a.name}</div>
        <div class="auto-meta">${a.meta}</div>
      </div>
      <span class="auto-status ${a.on ? "on" : "off"}">${a.on ? "运行中" : "已暂停"}</span>
      <label class="switch">
        <input type="checkbox" ${a.on ? "checked" : ""} data-i="${i}"/>
        <span class="slider"></span>
      </label>
    </div>`).join("");
  $$("#autoList input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const i = +cb.dataset.i;
      AUTOS[i].on = cb.checked;
      store.set("wb_autos", AUTOS); renderAutos();
    });
  });
}
renderAutos();

// ---------- 云端同步初始化 ----------
function showOverlay(text) {
  const o = $("#syncOverlay"), t = $("#syncOverlayText");
  if (t && text) t.textContent = text;
  if (o) o.style.display = "flex";
}
function hideOverlay() { const o = $("#syncOverlay"); if (o) o.style.display = "none"; }

(async function initSync() {
  if (!SYNC.token) {
    setSyncStatus("local", "本地模式");
    hideOverlay();
    return;
  }
  showOverlay("正在同步云端数据…");
  const ok = await syncPull();
  if (ok) rerenderAll();
  else toast("未连接云端，使用本地数据");
  hideOverlay();
})();

// ---------- 登录 / 退出 ----------
function openSyncLogin() {
  const m = $("#syncModal"); if (m) m.style.display = "flex";
  const p = $("#syncPwd"); if (p) { p.value = ""; p.focus(); }
  const g = $("#syncGistId");
  if (g && !g.value) g.value = SYNC.mode === "gist" ? (SYNC.gistId || "") : (SYNC.repo || "Belinda992/yinji-data");
  const box = $("#syncCodeBox"); if (box) box.style.display = "none";
}
// 同步码：把 token + 仓库 打包成一段文本，方便在设备之间传递
function buildSyncCode() {
  return JSON.stringify({ wb: 1, mode: "repo", token: SYNC.token || "", repo: SYNC.repo || "" });
}
function showSyncCode() {
  const box = $("#syncCodeBox"), ta = $("#syncCodeText");
  if (!box || !ta) return;
  if (!SYNC.token) { toast("请先连接云端，才能生成同步码"); return; }
  ta.value = buildSyncCode();
  box.style.display = "block";
}
async function copySyncCode() {
  const txt = buildSyncCode();
  try {
    await navigator.clipboard.writeText(txt);
    toast("同步码已复制，发到另一台设备粘贴即可 ✅");
  } catch (_) {
    const ta = $("#syncCodeText");
    if (ta) { ta.select(); document.execCommand("copy"); toast("同步码已复制 ✅"); }
  }
}
// 粘贴同步码时自动拆开填入 token / 仓库
function tryParseSyncCode(raw) {
  const s = (raw || "").trim();
  if (!s.startsWith("{")) return false;
  try {
    const o = JSON.parse(s);
    if (!o || o.wb !== 1 || !o.token) return false;
    const p = $("#syncPwd"), g = $("#syncGistId");
    if (p) p.value = o.token;
    if (g) g.value = o.repo || o.gist || "";
    return true;
  } catch (_) { return false; }
}
async function submitSyncLogin() {
  const raw = ($("#syncPwd")?.value || "").trim();
  if (!raw) return;
  if (tryParseSyncCode(raw)) toast("已识别同步码 ✅");
  const token = ($("#syncPwd")?.value || "").trim();
  if (!token) return;
  const repoRaw = ($("#syncGistId")?.value || "").trim();
  // 兼容：如果填的是 Gist ID（32 位十六进制）就走 gist 模式，否则走仓库模式
  const isGist = /^[0-9a-f]{32}$/i.test(repoRaw);
  SYNC.mode = isGist ? "gist" : "repo";
  SYNC.token = token;
  if (isGist) { SYNC.gistId = repoRaw; localStorage.setItem("wb_gist_id", repoRaw); localStorage.removeItem("wb_sync_repo"); }
  else {
    SYNC.repo = repoRaw || "Belinda992/yinji-data";
    SYNC.gistId = "";
    localStorage.setItem("wb_sync_repo", SYNC.repo);
    localStorage.removeItem("wb_gist_id");
  }
  localStorage.setItem("wb_sync_mode", SYNC.mode);
  localStorage.setItem("wb_sync_token", token);
  const m = $("#syncModal"); if (m) m.style.display = "none";
  showOverlay("正在连接云端…");
  const ok = await syncPull();
  if (ok) { rerenderAll(); toast("云端连接成功 ✅"); }
  else toast("令牌无效或无法连接 GitHub");
  hideOverlay();
}
function logoutSync() {
  SYNC.token = "";
  localStorage.removeItem("wb_sync_token");
  setSyncStatus("local", "本地模式");
  toast("已退出云端，切换为本地模式");
}

// ---------- 导入数据（外部 JSON 桥） ----------
function openImport() { const m = $("#importModal"); if (m) m.style.display = "flex"; }
async function doImport() {
  const txt = ($("#importText")?.value || "").trim();
  const file = $("#importFile")?.files?.[0];
  let obj;
  try {
    if (file) obj = JSON.parse(await file.text());
    else if (txt) obj = JSON.parse(txt);
    else { toast("请粘贴 JSON 或选择文件"); return; }
  } catch (_) { toast("JSON 解析失败，请检查格式"); return; }
  let n = 0;
  for (const k in obj) {
    if (k.startsWith("wb_") && k !== "wb_sync_token") {
      localStorage.setItem(k, typeof obj[k] === "string" ? obj[k] : JSON.stringify(obj[k]));
      n++;
    }
  }
  rerenderAll();
  schedulePush();
  const m = $("#importModal"); if (m) m.style.display = "none";
  toast(`已导入 ${n} 项数据 ⬇️`);
}

// ---------- 事件绑定 ----------
$("#btnSyncToggle")?.addEventListener("click", () => {
  if ($("#btnSyncToggle").dataset.mode === "logout") logoutSync();
  else openSyncLogin();
});
$("#syncCancel")?.addEventListener("click", () => { $("#syncModal").style.display = "none"; });
$("#syncSubmit")?.addEventListener("click", submitSyncLogin);
$("#btnShowSyncCode")?.addEventListener("click", showSyncCode);
$("#btnCopySyncCode")?.addEventListener("click", copySyncCode);
$("#syncPwd")?.addEventListener("paste", (e) => {
  const t = (e.clipboardData || window.clipboardData)?.getData("text") || "";
  if (t.trim().startsWith("{")) {
    e.preventDefault();
    if (tryParseSyncCode(t)) toast("已识别同步码，点「连接」即可 ✅");
    else $("#syncPwd").value = t.trim();
  }
});
$("#btnImport")?.addEventListener("click", openImport);
$("#importCancel")?.addEventListener("click", () => { $("#importModal").style.display = "none"; });
$("#importSubmit")?.addEventListener("click", doImport);

// ---------- 映记助手（靛） ----------
const ASSIST_KEY = "wb_assistant_msgs";
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 只在「常用指令」上绑定，避免误伤一键生成按钮
$$(".assist-chip[data-tpl]").forEach((c) =>
  c.addEventListener("click", () => { $("#assistInput").value = c.dataset.tpl; $("#assistInput").focus(); })
);

$("#btnAssistCopy")?.addEventListener("click", async () => {
  const txt = ($("#assistInput").value || "").trim();
  if (!txt) { toast("先写点什么再复制哦"); return; }
  try { await navigator.clipboard.writeText(txt); toast("指令已复制，去 WorkBuddy 粘贴吧 📋"); }
  catch (_) {
    const ta = $("#assistInput"); ta.select(); document.execCommand("copy"); toast("指令已复制 📋");
  }
});

$("#btnAssistSave")?.addEventListener("click", () => {
  const txt = ($("#assistInput").value || "").trim();
  if (!txt) { toast("先写点什么再保存哦"); return; }
  const list = store.get(ASSIST_KEY, []);
  list.unshift({ id: Date.now(), q: txt, a: "", t: new Date().toLocaleString("zh-CN") });
  store.set(ASSIST_KEY, list);
  $("#assistInput").value = "";
  renderAssist();
  toast("已存入对话记录 💾");
});

// ============ 一键生成（直接读本地真实数据，不用联网） ============
const LIFE_KEYS = { ex: "wb_life_exercise", wt: "wb_life_weight", st: "wb_life_study", jr: "wb_life_journal", xm: "wb_life_xiaoman", ms: "wb_life_milestone" };
const JR_LABELS = [["special", "星星口袋"], ["ach", "成就"], ["grat", "感恩"], ["ref", "反思"], ["other", "其他"]];
const XM_LABELS = [["kg", "幼儿园课程"], ["yuwen", "语文"], ["math", "数学"], ["english", "英语"], ["sport", "运动"], ["art", "艺术"], ["special", "特别记录"]];

function tlIconSafe(k) { try { return (iconOf(k) || {}).icon || "•"; } catch (_) { return "•"; } }
function dateList(from, to) {
  const out = [];
  let d = from;
  while (d <= to) { out.push(d); d = todoShift(d, 1); }
  return out;
}

// 今日总结
function genToday() {
  const d = todoToday();
  const frogs = frogsOf(d), todos = todosOf(d);
  const L = [`【今日总结 · ${d}】`, ""];
  const df = frogs.filter((f) => f.done);
  L.push(`🐸 三只青蛙（${df.length}/${frogs.length}）`);
  if (frogs.length) frogs.forEach((f) => L.push(`   ${f.done ? "✓" : "○"} ${f.text}`));
  else L.push("   （今天还没排青蛙）");
  L.push("");
  const dt = todos.filter((t) => t.done);
  L.push(`📝 其他待办（${dt.length}/${todos.length}）`);
  if (todos.length) todos.forEach((t) => L.push(`   ${t.done ? "✓" : "○"} ${t.text}`));
  else L.push("   （没有待办）");

  const tl = loadTl(d);
  const slots = Object.keys(tl).filter((k) => tl[k] && String(tl[k].text || "").trim()).sort();
  if (slots.length) {
    L.push("", "🕐 时间轴");
    slots.forEach((k) => L.push(`   ${k} ${tlIconSafe(tl[k].icon)} ${tl[k].text}`));
  }
  const six = loadSixData(d);
  if (six.seeds.some((s) => s)) {
    L.push("", "🪷 六时书");
    six.seeds.forEach((s, i) => { if (s) L.push(`   ${TL_BIG_SEEDS[i].name} · ${s}${six.notes[i] ? " — " + six.notes[i] : ""}`); });
  }
  const ex = (store.get(LIFE_KEYS.ex, []) || []).filter((e) => e.date === d);
  if (ex.length) L.push("", "🧘 运动：" + ex.map((e) => e.type).join("、"));
  const wt = (store.get(LIFE_KEYS.wt, []) || []).filter((r) => r.date === d);
  if (wt.length) L.push(`⚖️ 体重：${wt.map((r) => r.kg + "kg").join("、")}`);
  const st = (store.get(LIFE_KEYS.st, []) || []).filter((s) => s.date === d);
  if (st.length) {
    L.push("", "🔵 学习");
    st.forEach((s) => {
      const nm = s.name || s.subject || s.book || "（未命名）";
      L.push(`   ${s.topic ? "【" + s.topic + "】" : ""}${nm}${s.range ? " · " + s.range : ""}`);
      if (s.output) L.push(`      输出：${s.output}`);
    });
  }
  const jr = store.get(LIFE_KEYS.jr, {})[d];
  if (jr) {
    const lines = JR_LABELS.filter(([f]) => jr[f]).map(([f, lab]) => `   ${lab}：${jr[f]}`);
    if (lines.length) { L.push("", "📔 日记"); L.push(...lines); }
  }
  const xm = (store.get(LIFE_KEYS.xm, []) || []).filter((x) => x.date === d);
  if (xm.length) {
    L.push("", "👧 小满");
    xm.forEach((x) => XM_LABELS.filter(([k]) => x[k]).forEach(([k, lab]) => L.push(`   ${lab}：${x[k]}`)));
  }
  return L.join("\n");
}

// 本周回顾（最近 7 天）
function genWeek() {
  const end = todoToday(), start = todoShift(end, -6);
  const days = dateList(start, end);
  const L = [`【本周回顾 · ${start} ~ ${end}】`, ""];
  let fAll = 0, fDone = 0, tAll = 0, tDone = 0, activeDays = 0;
  days.forEach((d) => {
    const f = frogsOf(d), t = todosOf(d);
    const fd = f.filter((x) => x.done).length, td = t.filter((x) => x.done).length;
    fAll += f.length; fDone += fd; tAll += t.length; tDone += td;
    if (f.length || t.length) activeDays++;
  });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0) + "%";
  L.push(`🐸 青蛙完成 ${fDone}/${fAll}（${pct(fDone, fAll)}）`);
  L.push(`📝 待办完成 ${tDone}/${tAll}（${pct(tDone, tAll)}）`);
  L.push(`📅 有安排的天数：${activeDays} / 7 天`);

  const ex = (store.get(LIFE_KEYS.ex, []) || []).filter((e) => e.date >= start && e.date <= end);
  if (ex.length) {
    const byType = {};
    ex.forEach((e) => { byType[e.type] = (byType[e.type] || 0) + 1; });
    L.push("", `🧘 运动 ${ex.length} 次：` + Object.entries(byType).map(([k, v]) => `${k} ${v}次`).join("、"));
  } else L.push("", "🧘 运动：本周还没打卡");

  const st = (store.get(LIFE_KEYS.st, []) || []).filter((s) => s.date >= start && s.date <= end);
  if (st.length) {
    L.push("", `🔵 学习 ${st.length} 条`);
    const byTopic = {};
    st.forEach((s) => { const k = s.topic || "未分类"; byTopic[k] = (byTopic[k] || 0) + 1; });
    L.push("   " + Object.entries(byTopic).map(([k, v]) => `${k} ${v}条`).join("、"));
    st.forEach((s) => L.push(`   · ${s.date} ${s.name || s.subject || s.book || ""}${s.range ? " · " + s.range : ""}`));
  } else L.push("", "🔵 学习：本周还没有记录");

  const wt = (store.get(LIFE_KEYS.wt, []) || []).filter((r) => r.date >= start && r.date <= end).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (wt.length) L.push("", `⚖️ 体重 ${wt.length} 次记录：${wt.map((r) => r.kg).join(" → ")} kg`);

  const jr = store.get(LIFE_KEYS.jr, {});
  const jd = Object.keys(jr).filter((k) => k >= start && k <= end).sort();
  L.push("", `📔 日记写了 ${jd.length} 天`);
  const xm = (store.get(LIFE_KEYS.xm, []) || []).filter((x) => x.date >= start && x.date <= end);
  L.push(`👧 小满记录了 ${xm.length} 天`);
  return L.join("\n");
}

// 小满周报
function genXiaomanWeek() {
  const end = todoToday(), start = todoShift(end, -6);
  const xm = (store.get(LIFE_KEYS.xm, []) || []).filter((x) => x.date >= start && x.date <= end).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const ms = (store.get(LIFE_KEYS.ms, []) || []).filter((m) => m.date >= start && m.date <= end).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const L = [`【小满周报 · ${start} ~ ${end}】`, ""];
  if (!xm.length) { L.push("这一周还没有小满的成长记录。"); return L.join("\n"); }
  L.push(`共记录了 ${xm.length} 天：` + xm.map((x) => x.date.slice(5)).join("、"));
  L.push("");
  xm.forEach((x) => {
    L.push(`■ ${x.date}`);
    const rows = XM_LABELS.filter(([k]) => x[k]).map(([k, lab]) => `   ${lab}：${x[k]}`);
    if (rows.length) L.push(...rows); else L.push("   （这天只存了照片或 To小满）");
    if (x.photo) L.push(`   📷 ${(Array.isArray(x.photo) ? x.photo : [x.photo]).length} 张照片`);
    if (x.words) L.push(`   💌 To小满：${x.words}`);
    L.push("");
  });
  if (ms.length) { L.push("🌟 本周里程碑"); ms.forEach((m) => L.push(`   ${m.date} ${m.title}${m.desc ? "（" + m.desc + "）" : ""}`)); }
  return L.join("\n").trim();
}

$$(".assist-chip.gen").forEach((b) =>
  b.addEventListener("click", () => {
    const kind = b.dataset.gen;
    let txt = "";
    if (kind === "today") txt = genToday();
    else if (kind === "week") txt = genWeek();
    else txt = genXiaomanWeek();
    const box = $("#genBox"), ta = $("#genOut");
    if (!box || !ta) return;
    ta.value = txt;
    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toast("已生成 ✅");
  })
);

$("#btnGenCopy")?.addEventListener("click", async () => {
  const txt = ($("#genOut")?.value || "").trim();
  if (!txt) { toast("先点上面的按钮生成内容"); return; }
  try { await navigator.clipboard.writeText(txt); toast("已复制，可直接粘贴到飞书 📋"); }
  catch (_) { const ta = $("#genOut"); ta.select(); document.execCommand("copy"); toast("已复制 📋"); }
});

$("#btnGenToJournal")?.addEventListener("click", () => {
  const txt = ($("#genOut")?.value || "").trim();
  if (!txt) { toast("先生成内容再保存哦"); return; }
  const d = todoToday();
  const jr = store.get(LIFE_KEYS.jr, {});
  jr[d] = Object.assign({}, jr[d], { special: (jr[d] && jr[d].special ? jr[d].special + "\n\n" : "") + txt });
  store.set(LIFE_KEYS.jr, jr);
  if (window.loadJournal) loadJournal();
  toast("已存入今日日记的「星星口袋」💾");
});

function renderAssist() {
  const box = $("#assistLog"); if (!box) return;
  const list = store.get(ASSIST_KEY, []);
  $("#assistCount").textContent = list.length ? `${list.length} 条` : "";
  if (!list.length) { box.innerHTML = `<div class="assist-empty">还没有记录。写一条指令，开始和 AI 的第一次对话吧 🌈</div>`; return; }
  box.innerHTML = list.map((m) => `
    <div class="assist-item" data-id="${m.id}">
      <div class="assist-q">${escH(m.q)}</div>
      <textarea class="assist-a" placeholder="把 AI 的回复贴到这里存档…（自动保存）">${escH(m.a)}</textarea>
      <div class="assist-meta">
        <span class="assist-time">🕰 ${escH(m.t)}</span>
        <button class="assist-del" data-id="${m.id}">删除</button>
      </div>
    </div>`).join("");
  $$("#assistLog .assist-a").forEach((ta) =>
    ta.addEventListener("input", () => {
      const id = Number(ta.closest(".assist-item").dataset.id);
      const list = getMsgs(); const it = list.find((x) => x.id === id);
      if (it) { it.a = ta.value; setMsgs(list); }
    })
  );
  $$("#assistLog .assist-del").forEach((b) =>
    b.addEventListener("click", () => {
      const id = Number(b.dataset.id);
      setMsgs(getMsgs().filter((x) => x.id !== id));
      renderAssist();
    })
  );
}
function getMsgs() { return store.get(ASSIST_KEY, []); }
function setMsgs(v) { store.set(ASSIST_KEY, v); }

// ---------- 梦想清单（紫） ----------
const DREAM_KEY = "wb_dreams";
$("#dreamForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#dreamTitle").value.trim();
  if (!title) { toast("先写下一个梦想吧 🌟"); return; }
  const list = store.get(DREAM_KEY, []);
  list.unshift({
    id: Date.now(), title,
    cat: $("#dreamCat").value,
    date: $("#dreamDate").value,
    done: false,
    t: new Date().toLocaleDateString("zh-CN"),
  });
  store.set(DREAM_KEY, list);
  $("#dreamTitle").value = ""; $("#dreamDate").value = "";
  renderDream();
  toast("心愿已许下 🌟");
});

function renderDream() {
  const box = $("#dreamList"); if (!box) return;
  const list = store.get(DREAM_KEY, []);
  const done = list.filter((d) => d.done).length;
  $("#dreamCount").textContent = list.length ? `${list.length} 个 · 已实现 ${done} 个` : "";
  if (!list.length) { box.innerHTML = `<div class="assist-empty">清单还是空的。写下第一个梦想，它就在路上了 ✨</div>`; return; }
  box.innerHTML = list.map((d) => `
    <div class="dream-item ${d.done ? "done" : ""}" data-id="${d.id}">
      <button class="dream-star" title="点击切换已实现">${d.done ? "🌟" : "💫"}</button>
      <div class="dream-body">
        <div class="dream-text">${escH(d.title)}</div>
        <div class="dream-meta">🏷 ${escH(d.cat)}${d.date ? ` · 🎯 ${escH(d.date)}` : ""} · 许于 ${escH(d.t)}</div>
      </div>
      <div class="dream-actions">
        <button class="dream-btn" data-act="done">${d.done ? "还没实现" : "已实现"}</button>
        <button class="dream-btn" data-act="del">删除</button>
      </div>
    </div>`).join("");
  $$("#dreamList .dream-item").forEach((el) => {
    const id = Number(el.dataset.id);
    el.querySelector(".dream-star").addEventListener("click", () => toggleDream(id));
    el.querySelector('[data-act="done"]').addEventListener("click", () => toggleDream(id));
    el.querySelector('[data-act="del"]').addEventListener("click", () => {
      store.set(DREAM_KEY, store.get(DREAM_KEY, []).filter((x) => x.id !== id));
      renderDream(); toast("已删除");
    });
  });
}
function toggleDream(id) {
  const list = store.get(DREAM_KEY, []);
  const it = list.find((x) => x.id === id);
  if (!it) return;
  it.done = !it.done;
  store.set(DREAM_KEY, list);
  if (it.done) toast("恭喜！梦想实现啦 🎉");
  renderDream();
}

renderAssist();
renderDream();

