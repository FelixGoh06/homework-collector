# Homework Collector (Cloudflare Pages + R2)

一个轻量的作业收集网站：同学上传 Word / PPT 等文件，按姓名白名单校验，文件自动归档到 Cloudflare R2 的对应姓名目录中。  
前端支持拖拽上传、文件列表预览与删除、移动端“多次选择追加”，右侧公告从 R2 的 JSON 动态读取（无需重新部署即可更新公告）。

> 适用于：班级/课程作业收集、材料提交、活动报名附件收集等场景。

## Features

- ✅ **姓名白名单校验**：非白名单姓名禁止上传
- ✅ **自动归档**：存储路径为 `姓名/时间戳__原文件名`
- ✅ **多文件上传**：桌面端可多选；移动端支持多次选择追加，最终一次性上传
- ✅ **拖拽上传 + 文件列表**：按添加顺序显示，可逐个删除/一键清空
- ✅ **公告动态加载**：从 R2 读取 `notice.json`，改公告不需要重新部署
- ✅ **Cloudflare Pages Functions + R2**：无需自建服务器

## Demo

- Online: `TODO: https://xxx.pages.dev`
- Screenshot:
  - `TODO: 放一张截图到 docs/ 或 README`

## Tech Stack

- Cloudflare Pages (Static + Pages Functions)
- Cloudflare R2 (Object Storage)
- Vanilla HTML/CSS/JS

## Project Structure
├─ public/ # 前端静态页面
│ ├─ index.html
│ ├─ style.css
│ └─ app.js
├─ functions/ # Pages Functions (API)
│ └─ api/
│ ├─ upload.js # 上传（支持多文件）
│ ├─ names.js # 白名单展示（从环境变量读取）
│ └─ notice.js # 公告（从 R2 读取 notice.json）
├─ wrangler.toml
└─ package.json

## How It Works

- 前端提交 `name + file(s)` 到 `/api/upload`
- 后端校验 `name` 是否在 `WHITELIST` 内
- 通过则写入 R2：`<name>/<timestamp>__<filename>`
- 右侧公告从 `/api/notice` 获取，该接口会从 R2 读取 `notice.json`

## Deploy

### 1) Create R2 Bucket
Cloudflare Dashboard → R2 → Create bucket  
例如：`student-homework`

### 2) Create Pages Project
Cloudflare Dashboard → Pages → Create a project  
构建设置建议：
- Framework preset: None
- Build command: (empty)
- Output directory: `public`

### 3) Bind R2 to Pages Functions
Pages → Settings → Functions → R2 bindings
- Variable name: `HW_BUCKET`
- Bucket: 选择你的 bucket（例如 `student-homework`）

> 注意：Production / Preview 环境各自独立，如需使用 Preview 链接测试，请在 Preview 环境也配置一次变量和绑定。

### 4) Environment Variables
Pages → Settings → Environment variables（Production）
- `WHITELIST`：姓名白名单（逗号或换行分隔）

张三
李四
王五

- `ALLOWED_EXT`：允许扩展名

doc,docx,ppt,pptx

- `MAX_FILE_BYTES`：单文件大小限制（默认 30MB）

31457280

- 可选：`NOTICE_KEY`：公告文件 key（默认 `notice.json`）

notice.json


设置后重新部署一次。

## Notice (公告配置)

在 R2 bucket 根目录放一个 `notice.json`：

```json
{
"title": "公告",
"updatedAt": "2026-03-02",
"items": [
  "1）文件命名：姓名_作业1_学号",
  "2）截止时间：周日 23:59",
  "3）补交请在文件名加“补交”"
]
}

以后修改公告：只需要编辑 R2 中的 notice.json，刷新页面即可生效。

Local Development

Install:

npm i

Run locally:

npx wrangler pages dev public

Deploy (direct upload):

npx wrangler pages deploy public --project-name homework-collector
Security Notes

当前版本的“白名单姓名”属于轻量校验，无法防止他人冒用白名单姓名。
如需更严格的身份验证，建议增加：

姓名 + 学号配对校验

班级口令 / 一次性提交码

Cloudflare Access / 登录鉴权（老师端管理）



