// Vercel Serverless Function — حفظ إجازة جديدة في data.json عبر GitHub API
// متغيرات البيئة المطلوبة في Vercel:
//   GITHUB_TOKEN  - Personal Access Token (Fine-grained, صلاحية Contents: Read/Write)
//   GITHUB_OWNER  - اسم مالك المستودع (username أو org)
//   GITHUB_REPO   - اسم المستودع
//   GITHUB_BRANCH - الفرع (افتراضي: main)
//   FILE_PATH     - مسار ملف البيانات (افتراضي: public/data.json)
//   ADMIN_TOKEN   - (اختياري) رمز سرّي لازم في الطلب لمنع الإضافة العامة

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ADMIN = process.env.ADMIN_TOKEN;
  if (ADMIN && req.headers['x-admin-token'] !== ADMIN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const TOKEN  = process.env.GITHUB_TOKEN;
  const OWNER  = process.env.GITHUB_OWNER;
  const REPO   = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  const PATH   = process.env.FILE_PATH || 'public/data.json';

  if (!TOKEN || !OWNER || !REPO) {
    return res.status(500).json({ error: 'Missing GitHub env vars' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const entry = body && body.leave;
  if (!entry || !entry.leaveCode || !entry.nationalId) {
    return res.status(400).json({ error: 'leave.leaveCode & leave.nationalId required' });
  }

  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const ghHeaders = {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'seha-saver'
  };

  try {
    // 1) جلب الملف الحالي
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(BRANCH)}`, { headers: ghHeaders });
    if (!getRes.ok) {
      const t = await getRes.text();
      return res.status(500).json({ error: 'GitHub GET failed', details: t });
    }
    const file = await getRes.json();
    const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    current.leaves = Array.isArray(current.leaves) ? current.leaves : [];

    // منع التكرار
    const exists = current.leaves.some(l =>
      String(l.leaveCode) === String(entry.leaveCode) &&
      String(l.nationalId) === String(entry.nationalId)
    );
    if (!exists) current.leaves.unshift(entry);

    const newContent = Buffer.from(JSON.stringify(current, null, 2), 'utf8').toString('base64');

    // 2) كتابة التحديث
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Add leave ${entry.leaveCode} for ${entry.nationalId}`,
        content: newContent,
        sha: file.sha,
        branch: BRANCH
      })
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return res.status(500).json({ error: 'GitHub PUT failed', details: t });
    }
    return res.status(200).json({ ok: true, saved: !exists, leaveCode: entry.leaveCode });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
