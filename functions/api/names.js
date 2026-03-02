export async function onRequestGet({ env }) {
  const names = parseWhitelist(env.WHITELIST || "");
  return Response.json({ names }, { status: 200 });
}

function parseWhitelist(s) {
  // 支持用逗号/中文逗号/换行分隔
  return s
    .split(/[\n,，]+/g)
    .map(x => x.trim())
    .filter(Boolean);
}