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