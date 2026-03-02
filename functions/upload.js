export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return jsonError("Content-Type 必须是 multipart/form-data", 400);
    }

    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const file = form.get("file");

    if (!name) return jsonError("必须填写姓名", 400);

    const whitelist = new Set(parseWhitelist(env.WHITELIST || ""));
    if (!whitelist.has(name)) return jsonError("姓名不在白名单内，禁止上传", 403);

    if (!file || typeof file === "string") return jsonError("必须选择文件", 400);

    const maxBytes = Number(env.MAX_FILE_BYTES || 30 * 1024 * 1024); // 默认 30MB
    if (file.size > maxBytes) return jsonError(`文件过大，最大允许 ${Math.floor(maxBytes/1024/1024)}MB`, 413);

    const allowedExt = new Set((env.ALLOWED_EXT || "doc,docx,ppt,pptx")
      .split(",")
      .map(x => x.trim().toLowerCase())
      .filter(Boolean)
    );

    const originalName = sanitizeFilename(file.name || "upload");
    const ext = getExt(originalName);
    if (!allowedExt.has(ext)) {
      return jsonError(`不支持的文件类型：.${ext}（允许：${[...allowedExt].map(x=>'.'+x).join(' ')}）`, 415);
    }

    const safeName = sanitizeFolder(name);
    const ts = formatTimestamp(new Date());
    const key = `${safeName}/${ts}__${originalName}`;

    // 读取文件内容写入 R2
    const buf = await file.arrayBuffer();
    await env.HW_BUCKET.put(key, buf, {
      httpMetadata: { contentType: file.type || guessMime(ext) },
      customMetadata: {
        uploaderName: name,
        originalFilename: file.name || "",
        uploadedAt: new Date().toISOString(),
      },
    });

    return Response.json({ ok: true, key }, { status: 200 });
  } catch (e) {
    return jsonError("服务器错误：" + (e?.message || String(e)), 500);
  }
}

function jsonError(msg, status) {
  return Response.json({ ok: false, error: msg }, { status });
}

function parseWhitelist(s) {
  return s
    .split(/[\n,，]+/g)
    .map(x => x.trim())
    .filter(Boolean);
}

function sanitizeFolder(s) {
  // 允许中文/英文/数字/下划线/短横线，其他替换为 _
  return s.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 64) || "unknown";
}

function sanitizeFilename(s) {
  const cleaned = s.replace(/[\/\\<>:"|?*\x00-\x1F]+/g, "_").trim();
  // 避免空文件名
  return (cleaned || "file").slice(0, 120);
}

function getExt(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function formatTimestamp(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function guessMime(ext) {
  if (ext === "doc") return "application/msword";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "ppt") return "application/vnd.ms-powerpoint";
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  return "application/octet-stream";
}