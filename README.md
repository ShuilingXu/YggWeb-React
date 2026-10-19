# YggWeb-React

YggServer-Go 的 Web 前端：React SPA + hash 路由，信息架构参考 Blessing Skin（皮肤库 / 材质详情 / 上传 / 衣柜 / 角色 / 账号 / 管理），
视觉与控件按 Minecraft GUI 重新设计（石质面板、斜切高光、物品槽、像素按钮），不做 BS 的 PHP/Blade 兼容层。

- 后端契约：[YggServer-Go README](../YggServer-Go/README.md)；工程约定见 [AGENTS.md](AGENTS.md)。
- 令牌只存 `sessionStorage('ygg.session.token')`，主题偏好存 `localStorage('ygg.theme')`，不写 Cookie。

## 技术栈

| 项 | 版本 / 说明 |
| --- | --- |
| React | 19.3.1（函数组件 + Context，不引状态库） |
| 构建 | Vite 8.3.4，`base: '/web/'`，产物由后端 `YGG_WEB_DIR` 托管 |
| 类型 | TypeScript 7.0.2，`tsc --noEmit` 是唯一门禁（未装 ESLint/Prettier） |
| 3D | skinview3d 3.4.2，仅详情页/角色卡使用，`React.lazy` 单独分包（518 kB / gzip 129 kB） |
| 测试 | Vitest 5：分页头解析、枚举映射、尺寸/比例与字段校验 |

## 运行

```powershell
# 1. 按后端文档启动 YggServer-Go（默认 8080），或指向本机联调实例
$env:YGG_BACKEND_URL = 'http://127.0.0.1:18080'
npm install
npm run dev          # http://127.0.0.1:5173/web/
```

```powershell
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run build        # tsc --noEmit && vite build → dist/
```

部署：把后端 `YGG_WEB_DIR` 指向本项目 `dist` 的绝对路径，访问 `/web/`。前端路由是 hash，
后端 `GET /web/` 是纯 `FileServer`，不需要 SPA 回落。API 一律写绝对路径（`/api/...`、`/textures/...`）。

## 页面与功能

| 路由 | 页面 | 主要功能 |
| --- | --- | --- |
| `#/` | 首页 | 站点介绍、最新材质、统计、authlib-injector 认证地址（可复制）、3D 展示最新皮肤 |
| `#/skinlib` | 皮肤库 | 搜索（300ms 防抖）、类型/排序筛选、分页、`tab=mine` 我的上传（含私有）、筛选状态全在 URL |
| `#/texture/:uuid` | 材质详情 | 3D/平面切换、元信息、收藏到衣柜、应用到角色、举报、编辑、删除、下载原图（私有）、管理员上下架 |
| `#/upload` | 上传 | 拖放/选择 PNG、自动识别 Steve/Alex、尺寸比例预检、公开开关、成功后跳详情 |
| `#/closet` | 衣柜 | 备注名、穿戴到角色、移除、搜索与分页 |
| `#/players` | 角色 | 新建/改名/删除、皮肤与披风选择器、清空部位、卡片 3D 预览（当前穿戴经 sessionserver 反查）；数量上限与创建费用取站点配置 |
| `#/points` | 积分 | 余额、签到冷却、积分规则、最近 50 条流水（来源/变动） |
| `#/account` | 账号 | 账号信息、邮箱验证、改密、改邮箱（改后强制重新登录）、OAuth 授权应用撤销、第三方身份绑定/解绑、注销账号 |
| `#/admin/users\|reports\|audit\|site` | 管理 | 用户封禁/解封、管理员授予/撤销（所有者）、举报下架/驳回、审计列表；所有者可保存站点配置、管理 OAuth2 应用、查看插件清单与查询入口 |
| `#/oauth/authorize` | OAuth 授权 | 展示应用名/回调/权限，登录后同意或拒绝；拒绝回调 `error=access_denied` |
| `#/oidc/callback` | OIDC 回调 | 清除地址栏凭据，用一次性 state 兑换本站令牌；首次登录自动注册，登录后可绑定/解绑 |
| `#/auth/login\|register\|forgot` | 认证 | 登录（邮箱或角色名）、OIDC 登录、注册（自动建角色）、找回密码；注册开关与邮箱域名规则即时生效 |

后端规则已落到界面：管理员只能管理普通账号，站点所有者才能调整管理员；所有者不能从 Web 注销；
举报「下架并处理」需同时提交 `resolution=1,state=1`；下架材质从皮肤库与衣柜同时消失。
新增运营规则也已接入：签到奖励、角色/上传/收藏/转私有费用、角色上限、注册与邮箱域名策略、
单会话提示、本站 OAuth2 授权与第三方 OIDC 登录/绑定、所有者插件清单与只读查询。

## 目录

```
src/
  api/        client.ts（请求、状态码/错误码→文案、令牌、403 回查）、resources.ts（端点）、types.ts、enums.ts
  components/ UI.tsx（Button/Dialog/Toast/Tabs/Pagination/状态块）、AppShell、AuthGuard、AuthProvider、
              SiteProvider（公开站点规则）、TextureImage、TextureCard、TextureDialogs、CharacterViewer、
              SkinViewer（懒加载）、Icons.tsx
  lib/        router（hash 路由 + 登录回跳）、theme、useAsync/useSubmit、paging、query、format、validate、
              images、oauth（同意参数/回跳校验）、oidc（一次性 state）
  pages/      Home / Library / Texture / Upload / Closet / Players / Points / Account / AccountConnections /
              Admin / AdminSitePanel / Auth / OAuthConsent / OidcCallback
  styles/     tokens.css（唯一令牌来源）、components.css、layout.css
  i18n/       zh-CN.ts（全部文案）
```

关键约定：

- 取数只在 `pages/`（`useAsync` 自带 `AbortController`），组件只收 props；公开站点规则由 `SiteProvider` 在根部取一次。
- 列表统一走 `listWithMeta`：数组 + `X-Total-Count` / `X-Limit` / `Link`，每页 50。
- `403` 既可能是无权限也可能是令牌失效：`client.ts` 回查 `/api/account` 后才决定是否清空令牌并提示重新登录；
  `InsufficientPoints` / `AlreadySigned` / `PluginDenied` 在这里统一映射，页面不解析后端 `errorMessage`。
- 私有材质的预览/原图需要 Bearer 头，`<img>` 发不了，统一用 `lib/images.ts` 取 blob 转 object URL（登出时释放）。
- 3D 只在「公开或本人可见 + 未下架 + 皮肤类型」启用；披风只做平面预览；`prefers-reduced-motion` 停止自转。
- OAuth 同意页只接受授权码 + S256 PKCE；授权参数在 `lib/oauth.ts` 预检，回调地址由 `matchesCallback` 二次校验后才跳转。
- OIDC 一次性 state 只进 `sessionStorage`；回调先清地址栏，再兑换本站令牌。登录页/受保护页的 `next` 只允许站内路径。

## 设计

- 只有 `tokens.css` 定义颜色/间距（4px 网格：4/8/12/16/24/32/48）、圆角 0/2/4、硬边阴影 `2px 2px 0`、字号 12–40、动效 80/160/240ms。
- 双主题：`:root` 与 `[data-theme="dark"]`；顶栏两种主题都保持深色石头，形成固定的「游戏主菜单」骨架。
- 材质图全部 `image-rendering: pixelated`，透明区走两色棋盘格；无 WebGL 时退回纯 CSS 像素小人。
- 文案全走 `t()`，术语固定：材质 / 皮肤 / 披风 / 角色 / 衣柜 / 皮肤库 / 令牌 / 站点所有者。

## 验证记录

环境：Windows + Edge 155 headless（puppeteer-core 驱动，脚本与截图都在 `%TEMP%`，不入库）；
后端 `yggserver.exe` 跑 `127.0.0.1:18080`（PostgreSQL `ygg_web_dslocal` + Redis），`npm run dev` 跑 `127.0.0.1:5173/web/`。
截图目录：`%TEMP%\yggrt\shots-dslocal`。

- 页面：首页 / 皮肤库 / 材质详情（3D）/ 上传 / 衣柜 / 角色 / 账号 / 管理 / 认证
- 访问：`http://127.0.0.1:5173/web/#/...`（1280×900 与 375×812，浅色 + 深色）
- 操作与看到：
  - 注册 → 登录 → 上传 64×64 皮肤：详情页 canvas 641×356，`getContext('webgl'/'webgl2')` 可用；「平面预览」切换生效后再切回 3D。
  - Alex 皮肤上传页自动识别为 slim（`#upload-type` 值为 1）；披风详情只给平面预览。
  - 皮肤库：53 个材质 → 第一页 50 条、`第 1 / 2 页`；点「下一页」URL 变 `offset=50`、第二页 3 条；按类型/关键词筛选后 URL 同步。
  - 衣柜：53 条同规则分页；备注改名、穿戴到角色后角色卡 3D 立刻更新；移除后提示并刷新。
  - 角色：新建/改名/删除、皮肤与披风选择器、清空部位；卡片 canvas 存在且渲染正面人物。
  - 账号：刷新页面仍保持登录（sessionStorage）；未配置 SMTP 时「发送验证邮件」「找回密码」给出可见的 503 文案；改密后强制跳登录，新密码可登录并已改回原值。
  - 举报：第二个账号举报公开材质 201；重复举报提示「已举报过」；封禁该账号后原账号无法登录；所有者「下架并处理」后材质从皮肤库消失（此时总数 3 → 2）；解封、授予管理员、审计列表出现「用户管理 / 举报处理」。
  - 上传非法文件：`.txt` 提示「只接受 PNG 文件」；63×63 提示尺寸不符。
  - 材质编辑：改名 + 转私有后详情出现「私有」徽章与私有提示；删除后回到皮肤库。
  - 游客访问 `#/closet`、`#/admin`、`#/upload` 均显示登录拦截。
  - 双主题 × 双宽度都验过：1280 浅/深、375 浅/深；375 深色下皮肤库与首页 `scrollWidth == clientWidth`（无横向溢出）。
  - 缩略图在 1280 与 375 下都是正方形框、图片 `object-fit: contain` 内接；列表用 `loading="lazy"`，
    滚动到底部后 50/50 张图都有真实像素（整页截图未滚动时下方面板为占位，是懒加载而非缺失）。
  - 除上面列出的预期拒绝（重复举报 409、封禁登录 403、SMTP 未配置 503）外，Console 没有异常、没有其他 ≥400 响应。
- 生产构建：`npm run build` 后用同一后端以 `YGG_WEB_DIR=dist` 启动（`127.0.0.1:18081`），访问 `http://127.0.0.1:18081/web/`：
  资源路径为 `/web/assets/*`，登录、3D 分块、同源 `/textures/{hash}` 200、375 宽度无横向溢出。
- 未覆盖：真实 Minecraft 客户端 / authlib-injector 联调；SMTP 真实投递（本机未配置，只验证了 503 分支）；MySQL 后端；
  管理端 50 条以上的翻页（接口无总数头，只有上一页/下一页）；上传超过后端字节上限时的拒绝分支（前端只预检 16 MiB 硬上限）；
  角色数量上限 20 只由禁用的「添加角色」按钮表达，没有真的建满 20 个。

### 站点运营 / 积分 / OAuth / OIDC / 插件（2026-10-19）

环境：Linux（Deepin 25）+ Edge 152.0.4191.66 headless（puppeteer-core）；后端 `yggserver` 跑
`127.0.0.1:18080`（PostgreSQL 17 Docker `127.0.0.1:55432` + Redis `:6380`，材质目录为临时目录），
Vite dev 跑 `127.0.0.1:5173/web/`；生产构建另起 `127.0.0.1:18081`（`YGG_WEB_DIR=dist`）。
验证脚本、截图、测试账号与 OIDC 测试提供方均放在 `/tmp/yggrt`，不入库；截图目录 `/tmp/yggrt/shots`。

- 构建：`npm run typecheck`、`npm run test`（5 个文件 27 个用例）、`npm run build` 通过；主 chunk 369.31 kB（gzip 106.27 kB），
  `SkinViewer` 延迟加载 518.06 kB（gzip 129.43 kB）。
- 站点配置：所有者保存名称/公告/角色上限后，顶栏品牌、`document.title`、全站公告立即更新；站点简介替换首页默认文案。
  插件面板显示 `reserved-names`、`activity` 的版本/Hook/查询入口；点「查询 activity/counts」得到合法 JSON。
  所有者创建 OAuth2 应用成功；普通管理员（`permission=1`）只看到用户/举报/审计，直接打开 `#/admin/site` 显示所有者提示。
- 积分与扣费：账号签到 1000 → 1016，按钮进入冷却并显示下次签到时间；流水出现「签到 / 初始积分」。
  用户上传公开 64×64 皮肤扣 2 积分；上传自带的衣柜条目不重复收收藏费；新建角色扣 100；插件拒绝的「Blocked」角色不扣积分。
  把公开上传单价临时调高后，上传返回 409，页面显示「积分不足，无法完成操作」而不是后端原文；随后恢复单价。
- 站点策略：关闭注册后注册页显示关闭提示且提交按钮禁用；白名单 `example.org` 与黑名单 `example.com`
  都会在提交前拦下 `user@example.com` 并显示域名错误；角色上限改为 1 后「添加角色」输入禁用并提示 `(1)`；
  `signMax < signMin` 由前端直接提示，不发送 PUT。测试后已恢复注册开启、邮箱不限、上限 6、费用 2/5/3。
- 本站 OAuth2：伪造错误 `redirect_uri` 时页面判定无效且不提供同意按钮；同意后回调带 `code`+原样 `state`，
  `POST /oauth/token` 返回 200（`Bearer`、`User.Read Player.Read`、3600 秒），`/oauth/userinfo` 与 `/oauth/players` 均 200；
  账号页出现已授权应用，撤销后同一 token 访问 `/oauth/userinfo` 变 403；拒绝授权回调 `error=access_denied` 且无 code。
  未登录直接打开授权地址会先显示登录提示，登录链接的 `next` 保留完整授权参数，登录后回到同意页。
- 第三方 OIDC：本地 RSA/JWKS 假提供方（`http://127.0.0.1:9090`）完成真实发现、授权码、PKCE、nonce、RS256 ID Token 校验。
  已登录用户显式绑定后账号页显示 issuer；退出后同身份 OIDC 登录回到同一账号；新身份登录按注册规则自动建号并生成 `OIDC_` 角色；
  `email_verified=false` 被拒并显示站点规则文案。解绑时错误密码提示「当前密码不正确」，正确密码解绑成功、
  服务端撤销全部会话、前端清空 sessionStorage 并回登录页；再次登录后绑定列表为空。
- 布局：1280×900 与 375×812 的浅/深主题都实际打开过积分、站点配置、账号、OAuth 同意页；
  375 深色下 `scrollWidth == clientWidth`（无横向溢出），站点配置表单收成一列，表格在自身容器内滚动。
- 生产构建：访问 `http://127.0.0.1:18081/web/`，脚本/样式路径为 `/web/assets/*`；登录、积分、站点配置和插件查询正常，
  375 深色无横向溢出。除预期的 403/409（插件拒绝、错误密码、积分不足）外，Console 无未捕获异常；这些预期拒绝会在 Network 留下 4xx。
- 未覆盖：真实 Google/Microsoft 等 OIDC 提供方、生产 TLS/Client Secret、真实 SMTP、真实 Minecraft 客户端、
  MySQL 后端（本机只有 MariaDB 11.8，后端迁移 013 的表达式索引不兼容；未改后端）、headless Edge 本环境的 WebGL 3D
  （材质详情按无 WebGL 分支退回平面图）、移动端触控专项。

## 来源与许可

视觉语言参考 Minecraft（色彩、斜切边框、物品槽），未打包任何 Minecraft 字体或材质资源；
Blessing Skin 仅作为信息架构与交互参考（MIT），未引入其 PHP/Blade/jQuery/Bootstrap 运行时。
3D 渲染使用 [skinview3d](https://github.com/bs-community/skinview3d)（MIT）与 three.js（MIT）。
