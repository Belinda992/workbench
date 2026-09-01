# 映思学堂 · 个人工作台（云端同步版）

一个纯前端工作台，数据通过 **GitHub Gist** 同步，零服务器、任意设备可访问。

## ✅ 推荐方案（最简单）：Gist 同步 + 任意静态托管
1. 把整个 `workbench` 文件夹上传到任意静态托管（Netlify Drop 拖拽 / Vercel / GitHub Pages），拿到一个公网链接。
2. 手机或其他电脑打开该链接 → 右上角点「连接云端」→ 填入你的 **GitHub 访问令牌**（需 `gist` 权限）→ 首次留空 Gist ID 会自动创建。
3. 之后在任何设备打开同一链接、填同一令牌，数据自动同步。

> 为什么这样最简单：数据存在你自己的 GitHub Gist 里（私密），前端是纯静态文件，不需要买服务器、不用配后端。

## 备选方案：自建 Node 后端（适合自有服务器/VPS）
如果你有自己的服务器，也可以用内置的 `server.js` 跑同步后端（见下文）。数据存在服务器的 `wb_store.json`。

## 目录结构
```
workbench/
├── index.html          # 前端页面（生活记录 / 小满 / 映思学堂 / 内容运营…）
├── app.js life.js xing.js daily.js styles.css
├── server.js           # 同步后端：静态托管 + /api/data 读写
├── sync.config.json    # 同步密码（token）配置
├── package.json        # npm start 即可启动
├── wb_store.json       # 运行时自动生成的数据文件（请勿手改）
├── Dockerfile          # 可选：用 Docker 部署
└── README.md           # 本说明
```

---

## 一、先在本机跑通（30 秒）
```bash
cd workbench
node server.js
# 浏览器打开 http://localhost:3000
# 右上角点「连接云端」→ 输入 sync.config.json 里的密码（默认 yingSi@2026）
```
> 直接双击 index.html（file://）也能用，但那是纯本地模式，不会同步。要走同步必须经由 `http://localhost:3000` 这个地址。

---

## 二、部署到自己的服务器 / VPS（推荐，数据全在自己手里）

### 方式 1：直接 node 跑（最简）
1. 把整个 `workbench` 文件夹传上去（scp / git clone 都行）。
2. 安装 Node 18+（一般系统自带或 `apt install nodejs`）。
3. 设置同步密码（二选一）：
   - 改 `sync.config.json` 里的 `token`；**或**
   - 用环境变量（更推荐，不落盘）：`export WB_SYNC_TOKEN=你的强密码`
4. 启动并保持后台运行：
   ```bash
   # 简单常驻
   nohup node server.js > wb.log 2>&1 &
   # 或更稳：用 pm2
   npm i -g pm2 && pm2 start server.js --name workbench
   ```
5. 开放端口（默认 3000，或 `PORT=8080 node server.js` 改端口），防火墙放行。
6. 浏览器访问 `http://你的服务器IP:3000`，点「连接云端」输入密码即可。

> 想要 https 域名？在前面套一层 Nginx 反代即可，反代到 `localhost:3000`，不影响同步（接口同源）。

### 方式 2：Docker（一条命令）
```bash
docker run -d --name workbench \
  -p 3000:3000 \
  -e WB_SYNC_TOKEN=你的强密码 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/wb_store.json:/app/wb_store.json \
  your-image/workbench
```
或直接用仓库里的 Dockerfile 自己 build：
```bash
docker build -t workbench .
docker run -d -p 3000:3000 -e WB_SYNC_TOKEN=你的强密码 -v wbdata:/app workbench
```

---

## 三、部署到免费 Node 平台（Railway / Render，零服务器）
1. 把 `workbench` 文件夹推到 GitHub 仓库。
2. 在 Railway 或 Render 新建项目 → 连该仓库。
3. **启动命令**：`node server.js`
4. **环境变量**：`WB_SYNC_TOKEN` = 你的强密码
5. 部署完成后，平台会给一个公网地址（如 `xxx.railway.app`），打开它 → 连接云端 → 输密码。
6. ⚠️ **持久化注意**：Railway/Render 的文件系统可能随重启重置。务必在平台后台挂一个 **Persistent Volume**，挂载到 `/app`（数据文件 `wb_store.json` 就在那里），否则重启后数据会清空。

---

## 四、改同步密码
- 本地：改 `sync.config.json` 的 `token` 后重启 `server.js`。
- 服务器 / 平台：设环境变量 `WB_SYNC_TOKEN`，优先级高于 `sync.config.json`。
- 改完密码后，各设备重新点「退出云端」再「连接云端」输入新密码即可。

---

## 五、数据在哪 / 怎么备份
- 所有数据存为服务器上的 `wb_store.json`（一个 JSON 整包）。
- 备份：直接复制这个文件；或在页面里点侧栏「💾 备份全部数据 (JSON)」下载一份。
- 迁移：把 `wb_store.json` 拷到新服务器的同目录即可。
- 外部数据接入：侧栏「📥 导入数据」可把飞书/Excel 导出的 JSON 按 key 合并进来。

---

## 六、常见问题
- **连不上云端**：检查密码是否和服务器一致；服务器端口是否放行；用 `curl http://地址/api/health` 看是否返回 `{"ok":true}`。
- **换电脑看不到数据**：确认两端连的是同一个服务器地址 + 同一个密码；数据是「打开时从云端拉取」，改完在 A 设备保存后，B 设备刷新即可看到。
- **两人同时改会怎样**：后保存的会覆盖先保存的（个人单机使用无影响）。多设备建议错开编辑。
- **端口被占用**：用 `PORT=8080 node server.js` 换端口。
