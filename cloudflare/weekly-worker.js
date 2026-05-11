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
}

async function listUsers(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM users ORDER BY role, username"
  ).all();
  return json({ users: results.map(userFromRow) });
}

async function saveUser(request, env) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const displayName = String(body.displayName || body.name || "").trim();
  if (!username || !displayName) return json({ error: "Missing username or displayName" }, 400);

  await env.DB.prepare(`
    INSERT INTO users
      (username, password, role, display_name, college, major, entry_year, phone, email, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      password = excluded.password,
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
    String(body.password || "0000"),
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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    await ensureTables(env);

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "GET" && path === "/users") return listUsers(env);
      if (request.method === "POST" && path === "/users") return saveUser(request, env);
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
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message || "Server error" }, 500);
    }
  },
};
