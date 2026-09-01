/* 映思工作台 · 轻量同步后端（零依赖，仅用 Node 内置模块）
 * 功能：
 *   1. 静态托管本目录（index.html / app.js / ...）
 *   2. /api/data  GET  -> 返回全部数据（JSON 整包）
 *                  POST -> 覆盖保存整包数据
 *   3. /api/health -> 健康检查
 * 鉴权：请求头 X-WB-Token 需等于配置的 token
 * 启动：node server.js   （端口可用 PORT 环境变量覆盖，默认 3000）
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(ROOT, "wb_store.json");

// ---------- token 配置（优先级：环境变量 > sync.config.json > 默认值） ----------
let TOKEN = process.env.WB_SYNC_TOKEN || "";
const cfgPath = path.join(ROOT, "sync.config.json");
if (!TOKEN && fs.existsSync(cfgPath)) {
  try { TOKEN = JSON.parse(fs.readFileSync(cfgPath, "utf8")).token || ""; } catch (_) {}
}
if (!TOKEN) {
  TOKEN = "change-me-please";
  console.warn("⚠️  未设置同步密码！请通过环境变量 WB_SYNC_TOKEN 或 sync.config.json 设置一个强密码，否则数据可能被任意访问。");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (_) { return {}; }
}
function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}
function authed(req) {
  return (req.headers["x-wb-token"] || "") === TOKEN;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(obj));
  };

  // ---------- API ----------
  if (url.pathname === "/api/health") return send(200, { ok: true });

  if (url.pathname === "/api/data") {
    if (!authed(req)) return send(401, { error: "unauthorized" });
    if (req.method === "GET") return send(200, readData());
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const obj = JSON.parse(body);
          writeData(obj);
          send(200, { ok: true, keys: Object.keys(obj).length });
        } catch (e) {
          send(400, { error: "bad json" });
        }
      });
      return;
    }
    return send(405, { error: "method not allowed" });
  }

  // ---------- 静态文件（屏蔽敏感路径） ----------
  if (url.pathname.includes("wb_store.json") || url.pathname.startsWith("/api/")) {
    res.writeHead(403); return res.end("forbidden");
  }
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const filePath = path.join(ROOT, p);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ 映思工作台同步服务已启动：http://localhost:${PORT}`);
  console.log(`   同步密码(token) = ${TOKEN}`);
});
