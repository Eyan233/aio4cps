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

INSERT OR REPLACE INTO users (username, password, role, display_name, college, major, entry_year, phone, email, updated_at) VALUES
('20240901072', '0000', 'user', '苏章圣', '材料科学与工程', '冶金工程', '2024', '15987963968', '1253296002@qq.com', datetime('now')),
('202513021024', '0000', 'user', '皮景升', '自动化学院', '控制科学与工程', '2025', '19562171350', '3137165096@qq.com', datetime('now')),
('202309021299', '0000', 'user', '孙禄冰', '材料科学与工程', '冶金工程', '2023', '13062320535', '1255996389@qq.com', datetime('now')),
('202513131209', '0000', 'user', '蒋卓隽', '自动化学院', '电子信息', '2025', '13629647969', '2515193390@qq.com', datetime('now')),
('202513131162', '0000', 'user', '陈佳玲', '自动化学院', '电子信息', '2025', '17775609276', '2985078918@qq.com', datetime('now')),
('202513131180', '0000', 'user', '张富均', '自动化学院', '电子信息', '2025', '15923858308', '15923858308@163.com', datetime('now')),
('202409131254', '0000', 'user', '罗庆暄', '材料科学与工程', '材料与化工', '2024', '17783598675', '709235262@qq.com', datetime('now')),
('202413021006', '0000', 'user', '刘涛', '自动化学院', '控制科学与工程', '2024', '19855816903', '19855816903@163.com', datetime('now')),
('admin', 'admin', 'admin', 'admin', '', '', '', '', '', datetime('now'));
