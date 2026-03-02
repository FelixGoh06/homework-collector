const form = document.getElementById('form');
const statusEl = document.getElementById('status');
const btn = document.getElementById('btn');
const nameListEl = document.getElementById('nameList');

function setStatus(msg, ok = true) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (ok ? "ok" : "bad");
}

async function loadNames() {
  try {
    const r = await fetch('/api/names');
    if (!r.ok) return;
    const data = await r.json();
    nameListEl.innerHTML = '';
    (data.names || []).forEach(n => {
      const li = document.createElement('li');
      li.textContent = n;
      nameListEl.appendChild(li);
    });
  } catch (_) {}
}
loadNames();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');
  btn.disabled = true;

  const name = document.getElementById('name').value.trim();
  const fileInput = document.getElementById('file');
  const file = fileInput.files?.[0];

  if (!name) { setStatus('请填写姓名', false); btn.disabled = false; return; }
  if (!file) { setStatus('请选择文件', false); btn.disabled = false; return; }

  const fd = new FormData();
  fd.append('name', name);
  fd.append('file', file);

  try {
    setStatus('上传中…');
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      setStatus(data?.error || `上传失败（${r.status}）`, false);
    } else {
      setStatus(`上传成功：${data.key}`);
      form.reset();
    }
  } catch (err) {
    setStatus('网络错误：' + String(err), false);
  } finally {
    btn.disabled = false;
  }
});