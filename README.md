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
| 测试 | Vitest（12 条断言：尺寸/比例校验、分页头解析） |
| 样式 | 原生 CSS：`src/styles/tokens.css`（设计 token）+ `base.css` + `components.css` |

## 开发

```powershell
npm install
npm run dev          # http://127.0.0.1:5173/web/
```

开发服务器把 `/api`、`/textures`、`/healthz`、`/readyz`、`/authserver`、`/sessionserver`
代理到 `YGG_BACKEND_URL`（默认 `http://127.0.0.1:18080`）：

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
| `#/players` | 角色：列表（用 `/sessionserver/.../profile` 反查当前穿戴）、新建/改名/删除、绑定材质 |
| `#/profile` | 账号：信息、改密码、改邮箱、注销 |
| `#/admin` | 管理：用户（封禁/管理员）、举报（下架/驳回）、审计日志 |
| `#/login` `#/register` `#/forgot` | 认证 |

## 约定

- 令牌存 `sessionStorage`（`ygg.session.token`）：刷新不丢、关闭标签页失效；隐私模式下退回内存态。不写 Cookie、URL、localStorage。
- 启动时用 `GET /api/account` 校验已存令牌，校验失败自动清空（`AuthProvider` 的 `restoring`，避免闪一下未登录界面）。
- 接口一律绝对路径（`/api/...`），因为产物挂在 `/web/` 下。
- 枚举与后端整数语义对齐：材质 `type` 0/1/2、`state` 0/1、账号 `state` 0/1/2、`permission` 0/1/2、举报 `state` 0/1/2。
- 所有材质图片走 `TextureImage`（棋盘格 + `image-rendering: pixelated` + 失败兜底）。
- 文案统一走 `src/i18n`（当前只有中文）。

## 未实现 / 待决策

- 3D 预览目前只在材质详情页（公开、未下架的皮肤）；上传页与衣柜仍是平面预览。
- 邮箱验证与密码重置的落地页：后端已有一致性接口，但测试环境没配 SMTP，只验证了 503 分支。
- 昵称、用户级头像等 Blessing Skin 有、YggServer-Go 没有的字段不做。
- 跨会话持久登录（关标签页仍记住）需要 localStorage，属于长期驻留风险，未做。

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
