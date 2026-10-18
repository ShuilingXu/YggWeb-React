# AGENTS.md

本仓库所有 AI Agent（以及按本文件工作的人）必须遵守的工程约定。

**优先级**：用户本轮明确指令 > 本文件 > [后端 YggServer-Go](../YggServer-Go/AGENTS.md) > Agent 默认习惯。
**冲突时**：停下来指出冲突并询问，禁止自行取舍。**开工前**：必读 §0、§5、§6、§9。

项目：**YggWeb-React** —— YggServer-Go 的 Web 前端（React SPA 形态，hash 路由），面向皮肤站用户与管理员。
界面参考 Blessing Skin 的信息架构（皮肤库/详情/上传/衣柜/角色/账号/管理），视觉与实现重做。
实现清单、运行方式、验证记录见 [README.md](README.md)。

---

## 0. 硬规则（违反即视为未完成）

1. **不伪造验证**：没构建、没在浏览器里看到，就写"未验证 + 原因"；curl、单测、"应该行"都不算页面验收（§5）。
2. **令牌只进 sessionStorage**：禁止 localStorage、Cookie、URL、console、上报；401 或令牌失效的 403 必须清空（§3.1）。
3. **接口契约不自创**：路径、字段、状态码按后端 README 与实测；不改名、不假设 `{code,message}`（§3）。
4. **一种控件只有一份实现**：组件、token、枚举映射、请求封装、文案 key 都只有一处来源（§1.3、§2）。
5. **不留调试物**：截图、脚本、dist、日志、`.env` 不入库（§7）。

---

## 1. 编程行为

### 1.1 简洁优先
- 一个概念只实现一次（校验、格式化、分页解析不得有两份）。
- 能一个组件解决就不拆三个；能 `useState` 解决就不加 store。
- 不写"以后可能要用"的抽象；三个相似页面出现后才提取公共件。
- 不为转参数套多层：页面直接调 `src/api/*`，最多两层。

### 1.2 集成而非堆入口
- 新需求先并入既有入口：加 prop、加枚举值、给 `api/` 加函数。
- 不写 `XxxNew`/`XxxV2` 之类平行实现；列表的筛选/排序/分页状态统一进 URL。

### 1.3 先复用后新增（改动前必做）
- 组件 `src/components/`：`UI.tsx`（Button/Field/Dialog/Toast/Tabs/Badge/Pagination/Skeleton/EmptyState/ErrorState）、`TextureImage`、`TextureCard`、`AppShell`、`Icons.tsx`、`SkinViewer`。
- 样式：`src/styles/tokens.css` 的 token；`components.css` 的既有类。
- 接口：`src/api/resources.ts`；错误映射在 `client.ts`；类型/枚举在 `types.ts`/`enums.ts`。
- 文案：`src/i18n/zh-CN.ts`。纯函数：`src/lib/`（format/validate/paging/router/theme/useAsync）。

### 1.4 注释
只写"为什么"和看不出来的约束（后端怪癖、协议差异），简体中文；不写文件名横幅、不写同义注释、不留注释掉的代码与空 TODO。

### 1.5 错误处理
- 失败必须落到可见位置：字段下方 / Toast（操作结果）/ `ErrorState`（整页）。
- 请求用 `AbortController`（`useAsync` 已内置）；HTTP 状态 → 文案只在 `client.ts` 映射一次。
- 403 可能是"无权限"也可能是"令牌失效"：`client.ts` 会回查 `/api/account`，页面不要自己判断。
- 不把后端错误原文塞进 `innerHTML`。

### 1.6 依赖与格式
- 优先平台能力：`fetch`、`URLSearchParams`、`FormData`、`Intl`、`createImageBitmap`、CSS 变量。
- 已批准重依赖：`skinview3d`（3D，必须 `React.lazy` 懒加载，禁止进主 chunk）；新增依赖需用户批准并说明体积。
- 风格：2 空格、单引号、无分号、LF。ESLint/Prettier 尚未安装，以 `tsc --noEmit` 为准；引入格式化工具先问用户。

### 1.7 禁止
擅自换栈/改结构/批量重命名；为过测试放宽断言；把 mock 数据留在主分支；在仓库根目录放一次性脚本或说明文档（README/AGENTS 除外）。

---

## 2. 组件与样式复用

- **单一数据源**：颜色/间距/圆角/阴影/字号只定义在 `tokens.css`，组件里不写 hex 与自由数值。
- **收敛扩展点**：请求在 `client.ts`；列表统一走 `listWithMeta`（带 Authorization + 解析 `X-Total-Count`/`Link`，否则登录态 403）；枚举只在 `enums.ts`，页面用 `typeLabel`/`typeTone` 之类映射。
- **展示组件不取数**：`components/` 只收 props，取数与错误处理在 `pages/`。
- **何时加依赖**：平台做不到、自研成本高且易错、体积说得清，且用户批准；3D 必须懒加载，单 chunk >500 kB 要说明原因。

---

## 3. 接口契约与类型

### 3.1 认证
- `Authorization: Bearer <accessToken>`；无 Cookie、无 CSRF。
- 令牌存 `sessionStorage`（`ygg.session.token`）：刷新可恢复、关标签页失效；隐私模式降级内存态。启动时先 `GET /api/account` 验证再渲染（`AuthProvider.restoring`）。
- 退出/改密/改邮箱/注销后服务端撤销令牌，前端必须清空并跳登录。

### 3.2 状态码与错误体
- 原生端点错误体 `{error, errorMessage}`，**没有** `{code,message}`。
- 权限与凭证失败**都是 403**（仅 `/api/user/profile/*`、`/minecraft/profile/skins` 用 401），所以 403 要回查账户。
- `201` 创建、`204` 无内容、`400` 参数、`404` 不存在、`409` 冲突、`413` 配额、`415` 非 PNG、`429` 限流（读 `Retry-After`）、`503` 依赖未配置（DB/Redis/存储/SMTP）。

### 3.3 分页
列表返回**数组**；分页在响应头 `X-Total-Count`、`X-Limit`、`Link: <...>; rel="next"`。`offset` 从 0；`limit` 1–100；筛选 `q`、`type=0|1|2`、`uploader=<32hex>`、`sort=newest|oldest|name`。

### 3.4 枚举（与后端字典一致，前端不得新增）
| 字段 | 取值 |
| --- | --- |
| 材质 `type` | `0` steve / `1` alex / `2` cape |
| 材质 `state` | `0` 正常 / `1` 下架 |
| 材质 `public` | `0` 私有 / `1` 公开 |
| 账号 `state` | `0` 正常 / `1` 封禁 / `2` 注销 |
| 账号 `permission` | `0` 普通 / `1` 管理员 / `2` 站点所有者 |
| 举报 `state` | `0` 待处理 / `1` 已处理 / `2` 已驳回 |
| 举报 `resolution` | `1` 下架处理 / `2` 驳回 |

用 `as const` 对象 + 联合类型，不用 TS `enum`。

### 3.5 材质图片与 3D
- 预览 `/api/textures/{id}/preview?size=16..512`；头像 `.../avatar`（**披风没有头像，返回 400**）。
- 原图 `/api/textures/{id}/file` 需 Web 凭证；匿名可用 `/textures/{hash}`（仅公开且可分发）。
- 3D 只在"公开 + 未下架 + 皮肤类型"启用，纹理源 `/textures/{hash}`，否则退回平面图。
- 角色当前穿戴只能用 `GET /sessionserver/session/minecraft/profile/{uuid}` 反查（base64 `properties`）。

---

## 4. 设计行为

- **Token**：只用 CSS 变量；4px 网格、间距 4/8/12/16/24/32/48、圆角 0/2/4、硬边阴影 `2px 2px 0`/`4px 4px 0`、字号 12/14/16/20/24/32/40、动效 80/160/240ms、层级 10/20/40/50/60。
- **双主题**：`:root` 与 `[data-theme="dark"]`；主题选择写 `localStorage('ygg.theme')`（非凭证），首屏内联脚本防闪白。
- **像素材质**：所有材质图 `image-rendering: pixelated`、整数倍、方形头像、透明区两色棋盘格；统一走 `TextureImage`。
- **3D**：默认慢速自动旋转、`prefers-reduced-motion` 停转、可拖拽、固定高度防 CLS、无 WebGL 时给出提示并退回平面图。
- **无障碍**：真实元素、图标按钮 `aria-label`、对话框焦点陷阱 + Esc + 焦点归还、Toast `aria-live="polite"`、表单错误贴字段、三态齐全、对比度 ≥ 4.5:1。
- **文案**：中文优先；术语固定（材质/皮肤/披风/角色/衣柜/皮肤库/令牌/站点所有者）；全部走 `t()`，占位符 `{name}`；按钮用动词，错误说"发生了什么 + 怎么办"。

---

## 5. 验证：浏览器是唯一验收口

**构建通过、单测通过、接口 200 都不算。**

1. 起后端（端口用实际值，从 `YggServer-Go/.env` 取 PG/Redis，`-migrate` 后启动）与 `npm run dev`。
2. 打开 `http://127.0.0.1:5173/web/#/...`，走真实路径：登录 → 皮肤库筛选 → 详情/3D → 收藏 → 上传 → 衣柜 → 绑定角色 → 账号 → 管理端。
3. 收集 Console 异常与 `>=400` 响应；区分真实缺陷与环境缺文件（库里记录存在但 `YGG_TEXTURES_DIR` 无文件 → 预览 404）。
4. 至少 1280 与 375 宽度、浅色与深色；3D 页确认 canvas 存在且拿得到 WebGL 上下文。
5. 交付时必须给记录，缺这段视为未验证：

```
- 页面：材质详情（3D）
- 访问：http://127.0.0.1:5173/web/#/texture/…（Edge 155 headless）
- 操作：登录 → 打开公开皮肤详情 → 等 3D 加载 → 切平面 → 刷新
- 看到：canvas 570×360 且 getContext('webgl') 可用；切换按钮两态生效；刷新后仍显示"退出登录"
- 未覆盖：真实 Minecraft 客户端
```

禁止用 curl / 接口 200 / 单测替代浏览器；禁止只验"页面能打开"；禁止编造截图。

### 5.1 命令
```powershell
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run build       # tsc --noEmit && vite build
```
未跑就写"未跑"。测试只覆盖影响使用的逻辑（尺寸/比例校验、分页头解析、枚举映射），不写样式与实现细节。

---

## 6. 环境与部署

- 产物由后端 `YGG_WEB_DIR` 托管在 `/web/`；`vite.config.ts` 的 `base` 必须是 `/web/`。
- **API 一律绝对路径**（`/api/...`、`/textures/...`），否则在 `/web/` 下会拼错。
- 后端 `GET /web/` 是纯 `FileServer`，没有 SPA 回落 → 路由用 hash。换 History 路由必须先让后端支持回落。
- 开发代理：`YGG_BACKEND_URL`（默认 `http://127.0.0.1:18080`），代理 `/api`、`/textures`、`/healthz`、`/readyz`、`/authserver`、`/sessionserver`。

| 项 | 事实（校准 2026-10-18，使用前复核） |
| --- | --- |
| 系统 / Shell | Windows；PowerShell 5.1 |
| Node / npm | v24.21.0 / 11.19.0；React 19.3.1、Vite 8.3.4、TypeScript 7.0.2、Vitest、skinview3d 3.4.2 |
| git | 不在 PATH，用 `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe` |
| 测试环境 | `YggServer-Go/.env` 的 PG（192.168.8.7:5432）与 Redis（:6379）；**需要 VPN** |
| 仓库 | 本仓库分支 `gptlocal`，跟踪 `origin/gptlocal`；后端在同级 `YggServer-Go` |

---

## 7. 仓库卫生

禁止入库：`node_modules/`、`dist/`、`coverage/`、`*.log`、`.env*`、`.vite/`、`*.tsbuildinfo`、截图、抓包、一次性脚本。
临时文件放 `$env:TEMP`，验收截图放 `%TEMP%\yggrt\shots`。结束前用 GitHub Desktop 的 git 跑 `git status --short`，只允许出现意图内文件。

---

## 8. Git 与交付

- 默认不提交；用户明确要求或完整功能（浏览器验收通过）后才提交。不细碎提交，不 amend/rebase/reset --hard/强推，不擅自切分支。
- 提交信息：`<type>(<scope>): 中文一句话` + 为什么改、影响哪些页面、如何验证。
- 交付固定四段：改了什么 / 怎么验证的 / 复用了什么 / 遗留与风险（同步更新 README 的验证记录）。

---

## 9. 已知的坑（持续追加）

| 日期 | 坑 | 现象 | 应对 |
| --- | --- | --- | --- |
| 2026-10-18 | 列表漏带令牌 | 登录后 `/api/closet`、`/api/textures/mine` 403，衣柜永远空 | 统一走 `listWithMeta` |
| 2026-10-18 | 披风没有头像 | `/api/textures/{cape}/avatar` 400 | 披风用 `preview` |
| 2026-10-18 | 库记录与文件不一致 | 列表有材质、预览 404 | 环境缺文件，显示占位符，不要隐藏条目 |
| 2026-10-18 | 后端换分支后旧二进制/旧 schema | 接口 500、启动 `database connection failed` | `go build` + `-migrate` 后重启 |
| 2026-10-18 | 加依赖后 dev server 未重启 | Vite 预打包缓存导致导入失败/白屏 | 重启 `npm run dev` |
| 2026-10-18 | 登录后立刻导航被覆盖 | 自动化刚登录就跳转，随后被登录逻辑重置为 `#/` | 等落地页元素出现再跳 |
| 2026-10-18 | 无 VPN 时测试环境"看起来通" | TCP 可连但 PG 握手 EOF、Redis 超时 | 先连 VPN，不要误判后端 bug |
| 2026-10-18 | 下架条目同时被详情与我的上传隐藏 | 下架成功后详情 404，不能靠我的上传重新取回元数据 | 管理员在审核页按 UUID 恢复；上传者可从原详情地址按 UUID 删除自己的条目，权限仍由后端校验 |
|  |  |  |  |

---

## 10. 维护

- 活文档：约定变化改对应章节，踩坑追加 §9。
- 每条规则要能一眼判断是否违反，或给出可直接执行的命令。
- 不写进度日志；状态与验证记录写进 README。
- 大改 §0/§5/§6 前先问用户。
