const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeName(value) {
  return String(value || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function userFromRow(row) {
  return {
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    name: row.display_name,
    college: row.college || "",
    major: row.major || "",
    entryYear: row.entry_year || "",
    phone: row.phone || "",
    email: row.email || "",
    updatedAt: row.updated_at,
  };
}

async function ensureTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL DEFAULT '0000',
      role TEXT NOT NULL DEFAULT 'user',
      display_name TEXT NOT NULL,
      college TEXT DEFAULT '',
      major TEXT DEFAULT '',
      entry_year TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      display_name TEXT,
      week TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      r2_key TEXT NOT NULL,
      pdf_key TEXT DEFAULT '',
      uploaded_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      r2_key TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    )
  `).run();


  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS paper_report_settings (
      id TEXT PRIMARY KEY,
      keywords TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      sender_name TEXT DEFAULT 'AIO4CPS AutoPaperReport',
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS paper_report_runs (
      id TEXT PRIMARY KEY,
      run_date TEXT NOT NULL,
      keywords TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      paper_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      message TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS paper_report_papers (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT DEFAULT '',
      abstract TEXT DEFAULT '',
      published_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT '',
      url TEXT DEFAULT '',
      pdf_url TEXT DEFAULT '',
      matched_keyword TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    INSERT INTO paper_report_settings
      (id, keywords, recipient_email, sender_name, enabled, updated_at)
    VALUES ('default', '["车间调度","强化学习车间调度","工业数字化生产调度"]', '1253296002@qq.com', 'AIO4CPS AutoPaperReport', 1, ?)
    ON CONFLICT(id) DO NOTHING
  `).bind(new Date().toISOString()).run();

  await env.DB.prepare(`
    INSERT INTO users
      (username, password, role, display_name, college, major, entry_year, phone, email, updated_at)
    VALUES ('admin', 'admin@aio4cps', 'admin', 'admin', '', '', '', '', '', ?)
    ON CONFLICT(username) DO UPDATE SET
      password = CASE
        WHEN users.password = 'admin' THEN excluded.password
        ELSE users.password
      END,
      role = 'admin',
      updated_at = CASE
        WHEN users.password = 'admin' THEN excluded.updated_at
        ELSE users.updated_at
      END
  `).bind(new Date().toISOString()).run();
}

async function listUsers(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM users ORDER BY role, username"
  ).all();
  return json({ users: results.map(userFromRow) });
}

async function login(request, env) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) return json({ error: "Missing username or password" }, 400);

  const row = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (!row || String(row.password || "") !== password) {
    return json({ error: "Invalid username or password" }, 401);
  }

  return json({ ok: true, user: userFromRow(row) });
}

async function saveUser(request, env) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const displayName = String(body.displayName || body.name || "").trim();
  if (!username || !displayName) return json({ error: "Missing username or displayName" }, 400);

  const password = Object.prototype.hasOwnProperty.call(body, "password")
    ? String(body.password || "")
    : "";


  await env.DB.prepare(`
    INSERT INTO users
      (username, password, role, display_name, college, major, entry_year, phone, email, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      password = users.password,
      role = excluded.role,
      display_name = excluded.display_name,
      college = excluded.college,
      major = excluded.major,
      entry_year = excluded.entry_year,
      phone = excluded.phone,
      email = excluded.email,
      updated_at = excluded.updated_at
  `).bind(
    username,
    password || "0000",
    String(body.role || "user"),
    displayName,
    String(body.college || ""),
    String(body.major || ""),
    String(body.entryYear || body.entry_year || ""),
    String(body.phone || ""),
    String(body.email || ""),
    new Date().toISOString()
  ).run();

  return json({ ok: true });
}

async function changePassword(request, env, username) {
  const body = await request.json();
  const oldPassword = String(body.oldPassword || body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!username || !oldPassword || !newPassword) {
    return json({ error: "Missing username, oldPassword or newPassword" }, 400);
  }
  if (newPassword.length < 4) {
    return json({ error: "Password must be at least 4 characters" }, 400);
  }

  const row = await env.DB.prepare("SELECT password FROM users WHERE username = ?")
    .bind(username)
    .first();
  if (!row) return json({ error: "User not found" }, 404);
  if (String(row.password || "") !== oldPassword) {
    return json({ error: "Old password is incorrect" }, 403);
  }

  await env.DB.prepare("UPDATE users SET password = ?, updated_at = ? WHERE username = ?")
    .bind(newPassword, new Date().toISOString(), username)
    .run();
  return json({ ok: true });
}

async function deleteUser(env, username) {
  if (username === "admin") return json({ error: "Admin cannot be deleted" }, 400);
  await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(username).run();
  return json({ ok: true });
}

async function listReports(request, env) {
  const url = new URL(request.url);
  const { results } = await env.DB.prepare(
    "SELECT * FROM reports ORDER BY uploaded_at DESC"
  ).all();

  return json({
    reports: results.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.display_name || r.username,
      displayName: r.display_name || r.username,
      week: r.week,
      fileName: r.file_name,
      fileType: r.file_type,
      fileSize: r.file_size,
      uploadedAt: r.uploaded_at,
      downloadUrl: `${url.origin}/files/${encodeURIComponent(r.id)}`,
      url: `${url.origin}/files/${encodeURIComponent(r.id)}`,
      pdfUrl: r.pdf_key ? `${url.origin}/preview/${encodeURIComponent(r.id)}` : "",
    })),
  });
}

async function saveReport(request, env) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Missing file" }, 400);

  const username = String(form.get("username") || "").trim();
  const displayName = String(form.get("displayName") || form.get("name") || username).trim();
  const week = String(form.get("week") || "").trim();
  const fileName = safeName(form.get("fileName") || file.name);
  const fileType = String(form.get("fileType") || file.type || "application/octet-stream");
  const fileSize = Number(form.get("fileSize") || file.size || 0);
  const id = String(form.get("id") || `${username}-${week}`);

  if (!username || !week) return json({ error: "Missing username or week" }, 400);

  const old = await env.DB.prepare("SELECT r2_key, pdf_key FROM reports WHERE id = ?")
    .bind(id)
    .first();

  if (old?.r2_key) await env.REPORT_BUCKET.delete(old.r2_key);
  if (old?.pdf_key && old.pdf_key !== old.r2_key) await env.REPORT_BUCKET.delete(old.pdf_key);

  const r2Key = `reports/${safeName(username)}/${safeName(week)}/${Date.now()}-${fileName}`;
  const isPdf = fileName.toLowerCase().endsWith(".pdf") || fileType === "application/pdf";
  const pdfKey = isPdf ? r2Key : "";

  await env.REPORT_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: fileType },
  });

  const uploadedAt = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO reports
      (id, username, display_name, week, file_name, file_type, file_size, r2_key, pdf_key, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      display_name = excluded.display_name,
      week = excluded.week,
      file_name = excluded.file_name,
      file_type = excluded.file_type,
      file_size = excluded.file_size,
      r2_key = excluded.r2_key,
      pdf_key = excluded.pdf_key,
      uploaded_at = excluded.uploaded_at
  `).bind(id, username, displayName, week, fileName, fileType, fileSize, r2Key, pdfKey, uploadedAt).run();

  return json({ ok: true, replaced: Boolean(old), id });
}

async function deleteReport(env, id) {
  const old = await env.DB.prepare("SELECT r2_key, pdf_key FROM reports WHERE id = ?")
    .bind(id)
    .first();

  if (old?.r2_key) await env.REPORT_BUCKET.delete(old.r2_key);
  if (old?.pdf_key && old.pdf_key !== old.r2_key) await env.REPORT_BUCKET.delete(old.pdf_key);

  await env.DB.prepare("DELETE FROM reports WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function listMaterials(request, env) {
  const url = new URL(request.url);
  const { results } = await env.DB.prepare(
    "SELECT * FROM materials ORDER BY category ASC, uploaded_at DESC"
  ).all();

  return json({
    materials: results.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      fileName: r.file_name,
      fileType: r.file_type,
      fileSize: r.file_size,
      uploadedAt: r.uploaded_at,
      url: `${url.origin}/material-files/${encodeURIComponent(r.id)}`,
      downloadUrl: `${url.origin}/material-files/${encodeURIComponent(r.id)}`,
    })),
  });
}

async function saveMaterial(request, env) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Missing file" }, 400);

  const category = String(form.get("category") || "").trim();
  const title = String(form.get("title") || file.name).trim();
  if (!category || !title) return json({ error: "Missing category or title" }, 400);

  const id = crypto.randomUUID();
  const fileName = safeName(file.name);
  const fileType = file.type || "application/octet-stream";
  const r2Key = `materials/${safeName(category)}/${Date.now()}-${fileName}`;
  const uploadedAt = new Date().toISOString();

  await env.REPORT_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: fileType },
  });

  await env.DB.prepare(`
    INSERT INTO materials
      (id, category, title, file_name, file_type, file_size, r2_key, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, category, title, fileName, fileType, file.size, r2Key, uploadedAt).run();

  return json({ ok: true, id });
}

async function deleteMaterial(env, id) {
  const old = await env.DB.prepare("SELECT r2_key FROM materials WHERE id = ?").bind(id).first();
  if (old?.r2_key) await env.REPORT_BUCKET.delete(old.r2_key);
  await env.DB.prepare("DELETE FROM materials WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function serveStoredFile(env, id, pdfOnly) {
  const row = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);

  const key = pdfOnly ? row.pdf_key : row.r2_key;
  if (!key) return json({ error: "PDF preview not available" }, 404);

  const object = await env.REPORT_BUCKET.get(key);
  if (!object) return json({ error: "File not found" }, 404);

  const headers = new Headers(CORS);
  headers.set("Content-Type", pdfOnly ? "application/pdf" : (row.file_type || "application/octet-stream"));
  headers.set(
    "Content-Disposition",
    `${pdfOnly ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.file_name)}`
  );

  return new Response(object.body, { headers });
}

async function serveMaterialFile(env, id) {
  const row = await env.DB.prepare("SELECT * FROM materials WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);

  const object = await env.REPORT_BUCKET.get(row.r2_key);
  if (!object) return json({ error: "File not found" }, 404);

  const headers = new Headers(CORS);
  headers.set("Content-Type", row.file_type || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`);
  return new Response(object.body, { headers });
}


function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function stripTags(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseKeywords(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  const raw = String(value || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parseKeywords(parsed);
  } catch (_) {}
  return raw.split(/[\n,，;；]+/).map((item) => item.trim()).filter(Boolean);
}

function yyyyMMddInTimeZone(date, timeZone = "Asia/Shanghai") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function reportDateForScheduled(now = new Date()) {
  const shanghaiDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return yyyyMMddInTimeZone(shanghaiDate);
}

function dateToArxivRange(dateText) {
  const compact = String(dateText || "").replace(/-/g, "");
  return `${compact}0000 TO ${compact}2359`;
}

function escapeXmlRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstXmlValue(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${escapeXmlRegex(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeXmlRegex(tag)}>`, "i"));
  return stripTags(match?.[1] || "");
}

function allXmlValues(xml, tag) {
  const values = [];
  const re = new RegExp(`<${escapeXmlRegex(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeXmlRegex(tag)}>`, "gi");
  let match;
  while ((match = re.exec(String(xml || "")))) values.push(stripTags(match[1]));
  return values;
}

function parseArxivEntries(xml, keyword) {
  const entries = [];
  const entryRe = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRe.exec(String(xml || "")))) {
    const entry = match[1];
    const id = firstXmlValue(entry, "id");
    const links = Array.from(entry.matchAll(/<link\s+[^>]*>/gi)).map((m) => m[0]);
    const pdfLink = links.find((link) => /title=["']pdf["']/i.test(link) || /type=["']application\/pdf["']/i.test(link));
    const href = (link) => (link || "").match(/href=["']([^"']+)["']/i)?.[1] || "";
    entries.push({
      id,
      source: "arXiv",
      title: firstXmlValue(entry, "title"),
      authors: allXmlValues(entry, "name").join(", "),
      abstract: firstXmlValue(entry, "summary"),
      publishedAt: firstXmlValue(entry, "published"),
      updatedAt: firstXmlValue(entry, "updated"),
      url: id,
      pdfUrl: href(pdfLink) || (id ? id.replace("/abs/", "/pdf/") : ""),
      matchedKeyword: keyword,
    });
  }
  return entries.filter((item) => item.id && item.title);
}

async function searchArxivPapers(keyword, runDate) {
  const query = `all:"${String(keyword).replace(/"/g, " ")}" AND submittedDate:[${dateToArxivRange(runDate)}]`;
  const url = new URL("https://export.arxiv.org/api/query");
  url.searchParams.set("search_query", query);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", "20");
  url.searchParams.set("sortBy", "submittedDate");
  url.searchParams.set("sortOrder", "descending");
  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "AIO4CPS-AutoPaperReport/1.0 (mailto:1253296002@qq.com)" },
  });
  if (!response.ok) throw new Error(`arXiv 检索失败：${response.status}`);
  return parseArxivEntries(await response.text(), keyword);
}

async function getPaperSettings(env) {
  const row = await env.DB.prepare("SELECT * FROM paper_report_settings WHERE id = 'default'").first();
  return {
    keywords: parseKeywords(row?.keywords),
    recipientEmail: row?.recipient_email || "1253296002@qq.com",
    senderName: row?.sender_name || "AIO4CPS AutoPaperReport",
    enabled: row?.enabled !== 0,
    updatedAt: row?.updated_at || "",
  };
}

async function getPaperSettingsResponse(env) {
  return json({ settings: await getPaperSettings(env) });
}

async function savePaperSettings(request, env) {
  const body = await request.json();
  const keywords = parseKeywords(body.keywords);
  const recipientEmail = String(body.recipientEmail || body.recipient_email || "").trim();
  const senderName = String(body.senderName || body.sender_name || "AIO4CPS AutoPaperReport").trim();
  const enabled = body.enabled === false ? 0 : 1;
  if (!keywords.length) return json({ error: "请至少配置一个检索标签/关键词" }, 400);
  if (!recipientEmail || !recipientEmail.includes("@")) return json({ error: "请配置有效的收件邮箱" }, 400);
  await env.DB.prepare(`
    INSERT INTO paper_report_settings (id, keywords, recipient_email, sender_name, enabled, updated_at)
    VALUES ('default', ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      keywords = excluded.keywords,
      recipient_email = excluded.recipient_email,
      sender_name = excluded.sender_name,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at
  `).bind(JSON.stringify(keywords), recipientEmail, senderName, enabled, new Date().toISOString()).run();
  return json({ ok: true, settings: await getPaperSettings(env) });
}

function paperReportHtml({ runDate, keywords, papers }) {
  const rows = papers.map((paper, index) => `
    <article style="margin:0 0 20px;padding:16px;border:1px solid #dbe5f0;border-radius:10px;background:#fbfdff">
      <h3 style="margin:0 0 8px;color:#17324d">${index + 1}. ${escapeHtml(paper.title)}</h3>
      <p><strong>作者：</strong>${escapeHtml(paper.authors || "未知")}</p>
      <p><strong>发表/提交时间：</strong>${escapeHtml(paper.publishedAt || "")}</p>
      <p><strong>匹配标签：</strong>${escapeHtml(paper.matchedKeyword || "")}</p>
      <p><strong>摘要：</strong>${escapeHtml(paper.abstract || "暂无摘要")}</p>
      <p><a href="${escapeHtml(paper.url)}">原文页面</a>${paper.pdfUrl ? ` · <a href="${escapeHtml(paper.pdfUrl)}">PDF</a>` : ""}</p>
    </article>`).join("");
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;color:#17324d;line-height:1.7">
      <h2>AIO4CPS AutoPaperReport · ${escapeHtml(runDate)}</h2>
      <p>检索标签：${escapeHtml(keywords.join("、"))}</p>
      <p>今日共发现 <strong>${papers.length}</strong> 篇新论文。系统当前优先抓取 arXiv 的题名、作者、摘要、发表时间和原文/PDF链接；引言等全文内容请通过原文链接查看。</p>
      ${rows || "<p>今天没有检索到匹配的新论文。</p>"}
    </div>`;
}

function paperReportText({ runDate, keywords, papers }) {
  const body = papers.map((paper, index) => [
    `${index + 1}. ${paper.title}`,
    `作者：${paper.authors || "未知"}`,
    `发表/提交时间：${paper.publishedAt || ""}`,
    `匹配标签：${paper.matchedKeyword || ""}`,
    `摘要：${paper.abstract || "暂无摘要"}`,
    `原文：${paper.url}`,
    paper.pdfUrl ? `PDF：${paper.pdfUrl}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
  return `AIO4CPS AutoPaperReport · ${runDate}\n检索标签：${keywords.join("、")}\n今日共发现 ${papers.length} 篇新论文。\n\n${body || "今天没有检索到匹配的新论文。"}`;
}

async function sendPaperEmail(env, payload) {
  const subject = `AIO4CPS AutoPaperReport：${payload.runDate} 新论文 ${payload.papers.length} 篇`;
  const html = paperReportHtml(payload);
  const text = paperReportText(payload);
  if (env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: env.PAPER_REPORT_FROM || `${payload.senderName} <onboarding@resend.dev>`,
        to: [payload.recipientEmail],
        subject,
        html,
        text,
      }),
    });
    const data = await response.text();
    if (!response.ok) throw new Error(`邮件发送失败：${data || response.status}`);
    return "邮件已通过 Resend 发送。";
  }
  if (env.PAPER_REPORT_WEBHOOK_URL) {
    const response = await fetch(env.PAPER_REPORT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(env.PAPER_REPORT_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.PAPER_REPORT_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ to: payload.recipientEmail, subject, html, text }),
    });
    const data = await response.text();
    if (!response.ok) throw new Error(`邮件 Webhook 发送失败：${data || response.status}`);
    return "邮件已通过自定义 Webhook 发送。";
  }
  return "未配置 RESEND_API_KEY 或 PAPER_REPORT_WEBHOOK_URL，已完成检索并保存结果，但未发送邮件。";
}

async function runPaperReport(env, options = {}) {
  const settings = await getPaperSettings(env);
  if (!settings.enabled && !options.force) return { ok: true, skipped: true, message: "AutoPaperReport 已停用。" };
  const runDate = String(options.date || reportDateForScheduled()).slice(0, 10);
  const keywords = options.keywords?.length ? options.keywords : settings.keywords;
  const runId = `paper-${runDate}-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const seen = new Map();

  for (const keyword of keywords) {
    const papers = await searchArxivPapers(keyword, runDate);
    papers.forEach((paper) => {
      const key = paper.id || paper.url || `${paper.title}-${paper.publishedAt}`;
      const old = seen.get(key);
      seen.set(key, old ? { ...old, matchedKeyword: `${old.matchedKeyword}、${keyword}` } : paper);
    });
  }

  const papers = Array.from(seen.values());
  let status = "success";
  let message = await sendPaperEmail(env, { ...settings, runDate, keywords, papers });
  if (message.startsWith("未配置")) status = "stored";

  await env.DB.prepare(`
    INSERT INTO paper_report_runs (id, run_date, keywords, recipient_email, paper_count, status, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(runId, runDate, JSON.stringify(keywords), settings.recipientEmail, papers.length, status, message, createdAt).run();

  for (const paper of papers) {
    await env.DB.prepare(`
      INSERT INTO paper_report_papers
        (id, run_id, source, title, authors, abstract, published_at, updated_at, url, pdf_url, matched_keyword, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), runId, paper.source, paper.title, paper.authors, paper.abstract,
      paper.publishedAt, paper.updatedAt, paper.url, paper.pdfUrl, paper.matchedKeyword, createdAt
    ).run();
  }

  return { ok: true, runId, runDate, keywords, paperCount: papers.length, status, message, papers };
}

async function runPaperReportResponse(request, env) {
  const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
  return json(await runPaperReport(env, { date: body.date, force: true }));
}

async function listPaperRuns(env) {
  const { results } = await env.DB.prepare("SELECT * FROM paper_report_runs ORDER BY created_at DESC LIMIT 12").all();
  const runs = [];
  for (const row of results) {
    const papers = await env.DB.prepare("SELECT * FROM paper_report_papers WHERE run_id = ? ORDER BY published_at DESC").bind(row.id).all();
    runs.push({
      id: row.id,
      runDate: row.run_date,
      keywords: parseKeywords(row.keywords),
      recipientEmail: row.recipient_email,
      paperCount: row.paper_count,
      status: row.status,
      message: row.message || "",
      createdAt: row.created_at,
      papers: (papers.results || []).map((paper) => ({
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        publishedAt: paper.published_at,
        url: paper.url,
        pdfUrl: paper.pdf_url,
        matchedKeyword: paper.matched_keyword,
      })),
    });
  }
  return json({ runs });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    await ensureTables(env);

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST" && path === "/login") return login(request, env);
      if (request.method === "GET" && path === "/users") return listUsers(env);
      if (request.method === "POST" && path === "/users") return saveUser(request, env);
      if (request.method === "POST" && path.startsWith("/users/") && path.endsWith("/password")) {
        const username = decodeURIComponent(path.replace("/users/", "").replace("/password", ""));
        return changePassword(request, env, username);
      }
      if (request.method === "DELETE" && path.startsWith("/users/")) {
        return deleteUser(env, decodeURIComponent(path.replace("/users/", "")));
      }
      if (request.method === "GET" && path === "/reports") return listReports(request, env);
      if (request.method === "POST" && path === "/reports") return saveReport(request, env);
      if (request.method === "GET" && path.startsWith("/files/")) {
        return serveStoredFile(env, decodeURIComponent(path.replace("/files/", "")), false);
      }
      if (request.method === "GET" && path.startsWith("/preview/")) {
        return serveStoredFile(env, decodeURIComponent(path.replace("/preview/", "")), true);
      }
      if (request.method === "DELETE" && path.startsWith("/reports/")) {
        return deleteReport(env, decodeURIComponent(path.replace("/reports/", "")));
      }
      if (request.method === "GET" && path === "/materials") return listMaterials(request, env);
      if (request.method === "POST" && path === "/materials") return saveMaterial(request, env);
      if (request.method === "DELETE" && path.startsWith("/materials/")) {
        return deleteMaterial(env, decodeURIComponent(path.replace("/materials/", "")));
      }
      if (request.method === "GET" && path.startsWith("/material-files/")) {
        return serveMaterialFile(env, decodeURIComponent(path.replace("/material-files/", "")));
      }
      if (request.method === "GET" && path === "/paper-settings") return getPaperSettingsResponse(env);
      if (request.method === "POST" && path === "/paper-settings") return savePaperSettings(request, env);
      if (request.method === "POST" && path === "/paper-run") return runPaperReportResponse(request, env);
      if (request.method === "GET" && path === "/paper-runs") return listPaperRuns(env);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message || "Server error" }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      await ensureTables(env);
      await runPaperReport(env);
    })());
  },
};
