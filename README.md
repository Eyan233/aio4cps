# AIO4CPS 课题组网站（aio4cps.top）

这是 AIO4CPS（AI & Optimization for Cyber-Physical Systems）课题组的网站项目，用于展示课题组的基本信息、研究方向、成员构成、科研成果、新闻动态以及相关联系方式。

本网站采用**静态网页**方式构建，并通过 **GitHub Pages** 进行部署，绑定自定义域名 `aio4cps.top`，以实现便捷、低成本、可持续更新的课题组网站发布方案。

---

## 网站内容简介

本网站主要用于展示以下内容：

- 课题组简介
- 研究方向与特色
- 教师与学生成员信息
- 论文、项目、专利等科研成果
- 新闻动态与学术活动
- 招生与合作信息
- 联系方式与相关链接

通过该网站，可以对外集中展示课题组在**人工智能、优化调度、信息物理系统（CPS）、数字孪生、智能制造**等方向的研究工作与学术进展。

---

## 项目特点

本项目具有以下特点：

- 采用静态网页架构，部署简单，维护成本低
- 可直接托管在 GitHub Pages 上，无需额外服务器
- 支持自定义域名访问
- 便于使用 VS Code 等本地工具进行编辑和版本管理
- 页面加载快，适合课题组长期展示与迭代更新
- 已包含基础 SEO 文件，便于搜索引擎收录

---

## 部署方式（GitHub Pages）

本项目推荐通过 **GitHub Pages** 部署。

### 1. 上传代码到 GitHub 仓库

将网站全部文件上传到 GitHub 仓库的 `main` 分支。

### 2. 开启 GitHub Pages

进入仓库页面：

**Settings → Pages**

在 **Build and deployment** 中选择：

- **Source**：`Deploy from a branch`
- **Branch**：`main`
- **Folder**：`/(root)`

保存后，GitHub Pages 会自动开始部署网站。

### 3. 配置自定义域名

在 GitHub Pages 设置中填写自定义域名：

```txt
aio4cps.top
```

---

## AutoPaperReport 自动论文报道

课题组事务系统已接入 AutoPaperReport：管理员登录“课题组事务”后，可在“自动论文报道”模块自定义检索标签、收件邮箱，并手动触发检索发送。后端由 `cloudflare/weekly-worker.js` 提供以下能力：

- `GET /paper-settings` / `POST /paper-settings`：读取和保存检索标签、收件邮箱、启停状态。
- `POST /paper-run`：按指定日期手动检索并发送论文报道。
- `GET /paper-runs`：查看最近检索记录和匹配论文。
- `scheduled()`：供 Cloudflare Workers Cron Triggers 每天 00:00 自动执行。

邮件发送支持两种配置方式（二选一）：

1. **Resend API**：配置 Worker 环境变量 `RESEND_API_KEY`，并配置 `PAPER_REPORT_FROM`（如 `AIO4CPS AutoPaperReport <paper@your-domain.com>`）。
2. **自定义邮件 Webhook**：配置 `PAPER_REPORT_WEBHOOK_URL`，可选配置 `PAPER_REPORT_WEBHOOK_TOKEN`。Webhook 适合对接 Gmail Apps Script，由 Apps Script 使用谷歌邮箱代发到 QQ 邮箱。

若未配置邮件通道，系统仍会完成论文检索并保存记录，但不会实际发送邮件。自动执行时间需要在 Cloudflare Worker 的 Cron Triggers 中配置，例如按北京时间每日 00:00 可配置为 UTC 前一天 16:00 对应的 cron 表达式。
