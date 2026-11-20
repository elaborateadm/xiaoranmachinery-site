# 小然机械 · 每日文章自动发布手册（PLAYBOOK）

> 定时任务每天 09:30（Asia/Shanghai）触发一次 agent。本手册是唯一执行依据。手册、选题库均在仓库 automation/ 目录内（仓库先 git clone 到本地工作目录）。
> 站点：https://www.xiaoranmachinery.cn （Cloudflare Pages，源码 git 仓库在 仓库根目录（当前目录））

## 每日流程（严格按顺序）

### 第 1 步：确定今天的产品线
```bash
LINE=$(python3 -c "
import json,datetime
d=json.load(open('automation/topics.json'))
today=datetime.date.today().timetuple().tm_yday
print(d['rotation'][today % len(d['rotation'])])")
echo "今天的产品线: $LINE"
```

### 第 2 步：选 2 个未用过的选题
1. 读 `automation/topics.json` 中该产品线的选题列表
2. **排除已发布**：`cd 仓库根目录（当前目录） && ls insights/` 中已存在的 slug 不能重复
3. 若该线选题全部用完，参考现有文章风格**自拟新选题**（必须贴合该产品线买家搜索意图），slug 存入 topics.json 对应列表并标记 `"auto": true`

### 第 3 步：撰写文章（质量红线，每篇都必须满足）
- **英文，800–1200 词**，H1 = title，3–5 个 H2，至少 1 个带 3 行以上数据的表格
- 内容必须**具体可引用**：写明型号、参数、单位、条件；禁止空洞套话和"contact us for more"式填充
- 结尾 FAQ 板块：3 个问题 + `<details>` 折叠样式（参考现有文章）
- **结构化数据**：Article schema（headline/datePublished=datePublished 用当天/author=XIAORAN MACHINERY）+ FAQPage schema + BreadcrumbList（Home > Insights > 文章）
- **内链**：至少 2 条指向 `/products/<相关产品线>/` 和 1 条相关旧文章；产品线首页反向不必加
- **head 标签**：title（≤60 字符）、meta description（≤155 字符）、og:title/og:description/og:image/og:url、twitter:card、canonical
- CTA：结尾"Get a configuration proposal"按钮链接 `/contact/?product=<产品线slug>`
- **禁止编造**：不虚构客户、价格、认证；付款/保修措辞写"confirmed in the written quotation"

### 第 4 步：落盘与索引
1. 新建 `仓库根目录（当前目录）/insights/<slug>/index.html`
   - **模板**：完整复制现有文章（如 `insights/ntw-btw-htw-drilling-depth/index.html`）的 head 结构、导航、页脚、CSS 引用，替换正文与 schema
2. 更新 `insights/index.html`：文章列表顶部插入新文章卡片（标题 + 摘要 + 日期）
3. 更新 `sitemap.xml`：`</urlset>` 前追加 2 个 URL（lastmod = 今天）

### 第 5 步：部署流水线
```bash
cd 仓库根目录（当前目录）
# 1. 校验（head 结构、JSON schema、死链自检后）提交
git add -A && git commit -m "Daily insights: <slug1> + <slug2> (<LINE>)" && git push origin main
# 2. 部署
npx -y wrangler@3 pages deploy . --project-name=xiaoranmachinery --branch=main --commit-dirty=true
# 3. 通知搜索引擎
python3 - <<'EOF'
import json,urllib.request
key="ad73858e023ee64cb0076d89c01e47b2"; base="https://www.xiaoranmachinery.cn"
urls=[base+"/insights/<slug1>/", base+"/insights/<slug2>/", base+"/insights/", base+"/"]
body=json.dumps({"host":"www.xiaoranmachinery.cn","key":key,"keyLocation":f"{base}/{key}.txt","urlList":urls}).encode()
req=urllib.request.Request("https://api.indexnow.org/indexnow",data=body,headers={"Content-Type":"application/json"})
print("IndexNow:",urllib.request.urlopen(req,timeout=20).status)
EOF
```

### 第 6 步：验证并汇报
```bash
curl -s -o /dev/null -w "%{http_code}" https://www.xiaoranmachinery.cn/insights/<slug1>/
```
两个新页面必须 200。最终汇报格式（简短）：
```
✅ 每日发布完成 <日期>
产品线：<LINE>
- <slug1>（200）：一句话摘要
- <slug2>（200）：一句话摘要
GitHub commit：<hash>｜IndexNow：200
```

## 异常处理
- **git push 失败**：重试一次；仍失败则跳过 push 只部署，并在汇报中标注
- **wrangler 403/401**：Cloudflare 令牌过期 → 汇报"部署失败：CF token 过期，需要用户新令牌"，**不要**发布半成品（回滚 git revert 当天 commit）
- **页面 404/500**：检查路径与大小写，修复重部署；两次失败则回滚当天 commit 并汇报
- **沙箱文件丢失**（site_src 不存在）：汇报"源码目录丢失，需人工恢复"，不要重新 clone 猜测内容

## 安全与节奏约束（不得违反）
- 每天**最多 2 篇**，不得为赶进度加倍（Google 规模化内容风控）
- 同一 slug 永不重复发布；相似主题间隔 ≥ 3 周
- 任何改不进 PLAYBOOK 流程的"顺手优化"一律不做，专注当天 2 篇


### 状态记录（重要）
- 每次发布完成后，把 2 个 slug 追加写入 `automation/published.json` 的 `published` 数组并一并提交推送。
- 选选题时优先排除 `automation/published.json` 与 `insights/` 中已存在的 slug。
