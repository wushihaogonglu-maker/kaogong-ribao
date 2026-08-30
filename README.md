# 考公补给站 (shanganbujizhan.top)

公务员考试（行测/申论备考）每日学习网站：成语、实词、常识、时政四大模块，智能复习 + 每日打卡 + 跨设备同步。

## 功能

- **四大模块每日更新**：成语 10 / 实词 3 / 常识 6 / 当日时政（含来源与原文链接）
- **双模式**：浏览模式（卡片式分页看全部历史）+ 学习模式（SM-2 智能间隔复习，忘记/模糊/记得三键评分）
- **错题本**：手动录入或大段文本批量粘贴，自动拆条+自动分类，SM-2 复习
- **签到**：四分类独立签到，全部完成推进连续天数（streak）
- **跨设备同步**：学习进度经 Cloudflare Worker + KV 自动同步（激活码共享，最多 2 台设备）
- **离线可用**：Service Worker 缓存
- **登录门禁**：激活码登录；无码可「免费体验 3 天」

## 技术栈

- 纯静态 HTML/CSS/JS 单文件 SPA，无框架
- 后端：Cloudflare Worker（`worker/worker.js`）+ KV
- 部署：GitHub + Cloudflare Pages，推送即部署
- 数据构建：Python 脚本

## 目录结构

```
site/                    # 本仓库（即站点根）
├── index.html           # 单文件 SPA
├── data.json            # 每日数据（动态到当天）
├── items.json           # SRS 条目池（成语944+实词400+常识810+时政84）
├── sw.js / version.txt  # Service Worker 与版本号（改 HTML 必须同步 bump）
├── _headers             # 安全头
└── robots.txt / sitemap.xml / manifest.json / favicon.svg / og-image.svg
```

## 数据重建

```bash
python build_clean_data.py   # 汇总 idioms+vocab+knowledge → site/data.json（end=当天）
python build_items.py        # 构建 SRS 条目池 → site/items.json
# 时政：add_politics.py + merge_*.py 每日更新
```

## 部署

```bash
# 前端（本目录即 git 仓库）
git add -A && git commit -m "v<版本号>: <描述>" && git push
# 15-30 秒后 Cloudflare Pages 生效；缓存绕过：URL 加 ?v=<版本号>

# Worker
cd worker/kaogong-api && wrangler deploy
```

## 许可

激活码模式运营，站长授权使用。未经授权不得用于商业传播。
