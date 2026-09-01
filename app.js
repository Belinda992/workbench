/* ============ 我的工作台 · 交互逻辑 ============ */

// ---------- 工具 ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ---------- 云端同步层 ----------
const SYNC = {
  mode: localStorage.getItem("wb_sync_mode") || "gist", // gist | node
  token: localStorage.getItem("wb_sync_token") || "",
  gistId: localStorage.getItem("wb_gist_id") || "",
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
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("wb_") && k !== "wb_sync_token" && k !== "wb_gist_id" && k !== "wb_sync_mode") {
      try { blob[k] = JSON.parse(localStorage.getItem(k)); } catch (_) {}
    }
  }
  return blob;
}
function applyBlob(blob) {
  const keys = Object.keys(blob || {});
  if (!keys.length) return false;
  keys.forEach((k) => {
    if (k.startsWith("wb_") && k !== "wb_sync_token") {
      try { localStorage.setItem(k, JSON.stringify(blob[k])); } catch (_) {}
    }
  });
  return true;
}
// ---- GitHub Gist 后端（零服务器，跨设备同步） ----
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
  if (SYNC.mode === "gist") await gistPush(blob);
  else await nodePush(blob);
}
async function syncPull() {
  if (SYNC.mode === "gist") return await gistPull();
  return await nodePull();
}
// 云端数据覆盖本地后，统一重渲染一次
function rerenderAll() {
  try {
    renderTodos(); renderKb(); renderAutos(); renderKpis();
    if (window.renderChips) renderChips();
    if (window.renderEx) renderEx();
    if (window.renderWt) renderWt();
    if (window.renderSt) renderSt();
    if (window.renderPomo) renderPomo();
    if (window.renderXm) renderXm();
    if (window.renderXmChip) renderXmChip();
    if (window.renderMilestone) renderMilestone();
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

// ---------- 待办 ----------
let todos = store.get("wb_todos", [
  { id: 1, text: "示例：阅读 WorkBuddy 部署文档", done: false },
  { id: 2, text: "示例：整理本周待办", done: true },
]);
function renderTodos() {
  $("#todoList").innerHTML = todos.map((t) => `
    <li class="todo-item ${t.done ? "done" : ""}" data-id="${t.id}">
      <input class="todo-check" type="checkbox" ${t.done ? "checked" : ""}/>
      <span class="todo-text">${t.text}</span>
      <button class="todo-del">✕</button>
    </li>`).join("");
  const left = todos.filter((t) => !t.done).length;
  $("#todoCount").textContent = `（剩 ${left} 项）`;
  $$("#todoList .todo-item").forEach((li) => {
    const id = +li.dataset.id;
    li.querySelector(".todo-check").addEventListener("change", () => {
      const t = todos.find((x) => x.id === id); t.done = !t.done; saveTodos();
    });
    li.querySelector(".todo-del").addEventListener("click", () => {
      todos = todos.filter((x) => x.id !== id); saveTodos();
    });
  });
}
function saveTodos() { store.set("wb_todos", todos); renderTodos(); }
$("#todoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#todoInput").value.trim();
  if (!v) return;
  todos.unshift({ id: Date.now(), text: v, done: false });
  $("#todoInput").value = ""; saveTodos();
});
renderTodos();

// ---------- 笔记 ----------
const noteArea = $("#noteArea");
noteArea.value = store.get("wb_note", "");
noteArea.addEventListener("input", () => store.set("wb_note", noteArea.value));

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
}
async function submitSyncLogin() {
  const token = ($("#syncPwd")?.value || "").trim();
  if (!token) return;
  const gid = ($("#syncGistId")?.value || "").trim();
  SYNC.mode = "gist";
  SYNC.token = token;
  SYNC.gistId = gid;
  localStorage.setItem("wb_sync_mode", "gist");
  localStorage.setItem("wb_sync_token", token);
  if (gid) localStorage.setItem("wb_gist_id", gid); else localStorage.removeItem("wb_gist_id");
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
$("#btnImport")?.addEventListener("click", openImport);
$("#importCancel")?.addEventListener("click", () => { $("#importModal").style.display = "none"; });
$("#importSubmit")?.addEventListener("click", doImport);

// ---------- 映记助手（靛） ----------
const ASSIST_KEY = "wb_assistant_msgs";
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

$$(".assist-chip").forEach((c) =>
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

