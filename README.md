# YggWeb-React

YggdrasilAPI Auth + BS Server 的 Web 前端（React + TypeScript + Vite），对接同机的 [YggServer-Go](../YggServer-Go)。

界面参考 Blessing Skin 的信息架构（皮肤库 / 材质详情 / 上传 / 衣柜 / 角色 / 账号 / 管理），
但视觉与实现重做：不引 UI 框架、不引 jQuery、不用图标字体，样式全部走 CSS 变量 token。

## 技术栈

| 项 | 版本 |
| --- | --- |
| React / React DOM | 19.3.1 |
| TypeScript | 7.0.2（`strict` + `noUncheckedIndexedAccess`） |
| Vite | 8.3.4（`base: '/web/'`） |
| 3D 预览 | skinview3d 3.4.2（`React.lazy` 懒加载，独立 chunk 517 kB / gzip 129 kB） |
| 测试 | Vitest（18 条断言：尺寸/比例、分页头、密码/邮箱域名、OAuth 参数与回调） |
| 样式 | 原生 CSS：`src/styles/tokens.css`（设计 token）+ `base.css` + `components.css` |

## 开发

```powershell
npm install
npm run dev          # http://127.0.0.1:5173/web/
```

开发服务器把 `/api`、`/textures`、`/healthz`、`/readyz`、`/authserver`、`/sessionserver`、`/oauth`、`/oidc`
代理到 `YGG_BACKEND_URL`（默认 `http://127.0.0.1:18080`）；`/oauth`、`/oidc` 用于后端把授权/回调重定向回
`/web/#/...`，否则开发环境会出现跨 origin 或 404。

```powershell
$env:YGG_BACKEND_URL = 'http://127.0.0.1:8080'
npm run dev
```

## 构建与部署

```powershell
npm run build        # tsc --noEmit && vite build -> dist/
```

把 `dist` 交给后端托管即可（`YGG_WEB_DIR` 指向它），页面地址是 `/web/`。

路由使用 **hash**（`/web/#/library`）：后端的 `GET /web/` 是纯 `http.FileServer`，
没有 SPA 回落，History 路由刷新深层地址会 404。要用 History 路由必须先让后端支持回落。

## 页面

| 路由 | 页面 |
| --- | --- |
| `#/` | 首页：介绍、能力卡片、最近上传 |
| `#/library` | 皮肤库：类型筛选、搜索、排序、分页（数据来自 `X-Total-Count`/`Link`），登录后多一个"我的上传" |
| `#/texture/:id` | 材质详情：3D 预览（可切平面）、收藏、下载原图、举报；上传者改名/改类型/公开私有/删除；管理员下架/上架 |
| `#/upload` | 上传：PNG 校验（尺寸倍数/比例/大小）、实时预览、公开开关 |
| `#/closet` | 衣柜：备注名、应用到角色、移除、分页 |
| `#/players` | 角色：列表（用 `/sessionserver/.../profile` 反查当前穿戴）、新建/改名/删除、绑定材质；上限与创建费用取站点配置 |
| `#/points` | 积分：余额、签到冷却、站点规则、最近 50 条流水 |
| `#/profile` | 账号：信息、改密码/邮箱、已授权 OAuth 应用、第三方 OIDC 身份绑定/解绑、注销 |
| `#/admin/users\|reports\|audit` | 管理：用户（封禁/管理员）、举报（下架/驳回）、审计日志 |
| `#/admin/site` | 所有者：站点配置、OAuth2 应用、插件清单与只读查询 |
| `#/oauth/authorize` | OAuth2 授权同意/拒绝；未登录时登录后回到本页 |
| `#/oidc/callback` | OIDC 回调：清除地址栏凭据、一次性 state 兑换本站令牌 |
| `#/login` `#/register` `#/forgot` | 认证：OIDC 登录、注册开关与邮箱域名规则 |

## 约定

- 令牌存 `sessionStorage`（`ygg.session.token`）：刷新不丢、关闭标签页失效；隐私模式下退回内存态。不写 Cookie、URL、localStorage。
- 启动时用 `GET /api/account` 校验已存令牌，校验失败自动清空（`AuthProvider` 的 `restoring`，避免闪一下未登录界面）。
- 接口一律绝对路径（`/api/...`），因为产物挂在 `/web/` 下。
- 枚举与后端整数语义对齐：材质 `type` 0/1/2、`state` 0/1、账号 `state` 0/1/2、`permission` 0/1/2、举报 `state` 0/1/2、
  审计 `action` 0–7、积分 `kind` 0–5、邮箱 `emailMode` 0–2。
- 站点公开规则由 `SiteProvider` 在根部取一次；管理员保存后 reload。其他已打开的标签页不会自动刷新，刷新页面即可。
- 错误码 `InsufficientPoints` / `AlreadySigned` / `PluginDenied` 只在 `client.ts` 映射；不把后端 `errorMessage` 拼进 DOM。
- 所有材质图片走 `TextureImage`（棋盘格 + `image-rendering: pixelated` + 失败兜底）。
- 文案统一走 `src/i18n`（当前只有中文）。
- OAuth 同意页只接受授权码 + S256 PKCE；回调地址由 `matchesCallback` 二次校验后跳转。OIDC 一次性 state 只进 sessionStorage，
  回调先清地址栏再兑换令牌。

## 未实现 / 待决策

- 3D 预览目前只在材质详情页（公开、未下架的皮肤）；上传页与衣柜仍是平面预览。
- 邮箱验证与密码重置的落地页：后端已有一致性接口，但测试环境没配 SMTP，只验证了 503 分支。
- 昵称、用户级头像等 Blessing Skin 有、YggServer-Go 没有的字段不做。
- 跨会话持久登录（关标签页仍记住）需要 localStorage，属于长期驻留风险，未做。
- 真实第三方 OIDC 提供方、生产 TLS/Client Secret、MySQL、真实 Minecraft 客户端未覆盖。

## 验证状态（2026-10-18）

- `npm run build` 通过：CSS 19.7 kB（gzip 4.3 kB），JS 301 kB（gzip 90 kB）。
- `npx vitest run`：2 个文件 12 条断言通过（PNG 尺寸/比例校验、分页响应头解析）。
- `npx tsc --noEmit` 0 错。
- **真实联调（测试环境 PostgreSQL 18.6 + Redis，后端 main 分支重新构建后）**，Edge 155 headless 实际操作：
  - 登录（邮箱）→ 首页显示登录态与"管理"入口；
  - 皮肤库 6 条真实数据，`X-Total-Count=6`，Alex 筛选后 3 条；
  - 材质详情：预览、收藏到衣柜（真实 `PUT /api/closet/{uuid}`，按钮切换为"从衣柜移除"）；
  - 上传 64×64 PNG → 201 → 跳转新材质详情（`#/texture/b20504c6…`）；选 100×100 PNG → 字段下方报"宽高必须是 64×32 的整数倍"；
  - 衣柜：改备注成功，应用到角色成功；
  - 角色页通过 `/sessionserver/.../profile` 读到已绑定的皮肤（缩略图与"当前皮肤 ✓"）；
  - 账号页：`POST /api/account/verification` 因未配置 SMTP 返回 503，页面提示"站点未配置邮件服务"；
  - 管理端：用户 4 条、举报 1 条、审计 5 条，全部来自真实库。
- **3D 预览**：材质详情页 canvas 570×360，`getContext('webgl')` 可用，模型正常渲染；点"平面"后 canvas 移除、回到 PNG 预览。
- **令牌持久化**：刷新页面后仍是登录态（`sessionStorage`），且停留在当前 hash 路由。
- 截图证据：`%TEMP%\yggrt\shots\`（含 `7x-*real`、`8x-*real` 系列）。
- 已知环境噪声：库中存在一条历史材质（`云杉旅人·审核验收`）的数据库记录，但材质文件不在本次使用的 `YGG_TEXTURES_DIR` 里，详情预览返回 404，前端显示占位符；不是前端缺陷。
- **接口数据在上述截图里用的是替身服务**：测试环境 `192.168.8.7` 的 PostgreSQL/Redis
  在联调中途拒绝连接（PG handshake EOF、Redis 超时），真实读写流程尚未跑通。
  待其恢复后需要重跑：注册 → 登录 → 上传 → 筛选 → 收藏 → 绑定角色 → 管理端操作。

## 验证状态（2026-10-19，deepseek-ver）

环境：Linux（Deepin 25）+ Edge 152.0.4191.66 headless（puppeteer-core）；后端 `yggserver` 跑
`127.0.0.1:18080`（PostgreSQL 17 Docker `127.0.0.1:55432` + Redis `:6380`，材质目录为临时目录），
Vite dev 跑 `127.0.0.1:5173/web/`；生产构建另起 `127.0.0.1:18081`（`YGG_WEB_DIR=dist`）。
验证脚本、截图和测试账号在 `/tmp/yggrt`，不入库；截图目录 `/tmp/yggrt/shots`。

- 构建：`npm run typecheck`、`npm run test`（3 个文件 18 条断言）、`npm run build` 通过；
  主 chunk 348.16 kB（gzip 102.52 kB），`SkinViewer` 懒加载 517.04 kB（gzip 129.34 kB）。
- 站点运营：所有者保存名称/公告后，品牌、`document.title`、全站公告立即更新；站点简介替换首页默认文案。
  管理端读取插件清单并查询 `activity/counts` 得到合法 JSON；创建 OAuth2 应用成功。
- 积分：签到 1000 → 1082，按钮进入冷却并显示下次签到时间；流水出现「签到 / 初始积分」；
  创建角色扣 100；上传公开 64×64 皮肤扣 2；上传自带衣柜条目不重复扣收藏费；插件拒绝的角色不扣积分。
  临时调高上传单价后上传返回 409，页面显示「积分不足，无法完成操作」而不是后端原文，随后恢复单价。
- 站点策略：关闭注册后注册页显示提示且提交按钮禁用；白名单 `example.org` / 黑名单 `example.com`
  都会在提交前拦下 `user@example.com`；角色上限改为 1 后「新建角色」禁用并提示上限；
  `signMax < signMin` 由前端直接提示、不发送 PUT。测试后恢复注册开启、邮箱不限、上限 6、费用 2/5/3。
- OAuth2：未登录打开授权地址会先显示登录提示，登录链接的 `next` 保留完整授权参数并回到同意页；
  错误 `redirect_uri` 被页面判定无效；同意后回调带 `code` + 原样 `state`，
  `POST /oauth/token` 返回 200（`Bearer`、`User.Read Player.Read`），`/oauth/userinfo` 与 `/oauth/players` 均 200；
  账号资料页出现已授权应用，撤销后同一 token 访问 `/oauth/userinfo` 变 403；拒绝回调 `error=access_denied`。
- OIDC：本地 RSA/JWKS 假提供方（`http://127.0.0.1:9090`）完成真实发现、PKCE、nonce、RS256 校验。
  已登录用户绑定后账号页显示 issuer；退出后同身份 OIDC 登录回到同一账号；新身份登录自动建号并生成 `OIDC_` 角色；
  `email_verified=false` 被拒并显示站点规则文案。解绑时错误密码提示「当前密码不正确。」，正确密码解绑成功、
  服务端撤销全部会话、前端清空 sessionStorage 并回登录页；再次登录后绑定列表为空。
- 布局：1280×900 与 375×812 的深色主题实际打开积分、站点配置、账号资料、OAuth 同意页；
  375 深色下 `scrollWidth == clientWidth`（无横向溢出），站点配置两列表单收成一列，表格在自身容器内滚动。
- 生产构建：访问 `http://127.0.0.1:18081/web/`，脚本/样式路径为 `/web/assets/*`；登录、积分、站点配置和插件查询正常。
  直接在 `/admin`、`/admin/site`、`/admin/audit` 之间改 hash 时标签页跟随切换（`initialTab` 同步回归）；
  375 深色无横向溢出。除预期业务 403/409（插件拒绝、错误密码、未验证邮箱、积分不足）外无未捕获异常。
- 环境噪声：headless Edge 本环境无 WebGL，材质详情按现有 fallback 显示「缺少 WebGL」提示，
  但 `three.js` 会先输出多条 `WebGLRenderer` 控制台错误；这不是本轮新增页面的逻辑异常。3D 正常渲染未重新覆盖。
- 未覆盖：真实 Google/Microsoft 等 OIDC 提供方、生产 TLS/Client Secret、真实 SMTP、真实 Minecraft 客户端、
  MySQL 后端（本机只有 MariaDB 11.8，后端迁移 013 的表达式索引不兼容）、移动端触控专项。
