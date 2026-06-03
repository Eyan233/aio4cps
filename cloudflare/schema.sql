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
);

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
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

INSERT OR REPLACE INTO users (username, password, role, display_name, college, major, entry_year, phone, email, updated_at) VALUES
('20240901072', '0000', 'user', '苏章圣', '材料科学与工程', '冶金工程', '2024', '15987963968', '1253296002@qq.com', datetime('now')),
('202513021024', '0000', 'user', '皮景升', '自动化学院', '控制科学与工程', '2025', '19562171350', '3137165096@qq.com', datetime('now')),
('202309021299', '0000', 'user', '孙禄冰', '材料科学与工程', '冶金工程', '2023', '13062320535', '1255996389@qq.com', datetime('now')),
('202513131209', '0000', 'user', '蒋卓隽', '自动化学院', '电子信息', '2025', '13629647969', '2515193390@qq.com', datetime('now')),
('202513131162', '0000', 'user', '陈佳玲', '自动化学院', '电子信息', '2025', '17775609276', '2985078918@qq.com', datetime('now')),
('202513131180', '0000', 'user', '张富均', '自动化学院', '电子信息', '2025', '15923858308', '15923858308@163.com', datetime('now')),
('202409131254', '0000', 'user', '罗庆暄', '材料科学与工程', '材料与化工', '2024', '17783598675', '709235262@qq.com', datetime('now')),
('202413021006', '0000', 'user', '刘涛', '自动化学院', '控制科学与工程', '2024', '19855816903', '19855816903@163.com', datetime('now')),
('admin', 'admin@aio4cps', 'admin', 'admin', '', '', '', '', '', datetime('now'));

CREATE TABLE IF NOT EXISTS paper_report_settings (
  id TEXT PRIMARY KEY,
  keywords TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_name TEXT DEFAULT 'AIO4CPS AutoPaperReport',
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paper_report_runs (
  id TEXT PRIMARY KEY,
  run_date TEXT NOT NULL,
  keywords TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  paper_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  message TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

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
);

INSERT OR IGNORE INTO paper_report_settings
  (id, keywords, recipient_email, sender_name, enabled, updated_at)
VALUES
  ('default', '["车间调度","强化学习车间调度","工业数字化生产调度"]', '1253296002@qq.com', 'AIO4CPS AutoPaperReport', 1, datetime('now'));
