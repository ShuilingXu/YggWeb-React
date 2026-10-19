# YggWeb-React

YggServer-Go 的 React 前端，按 Blessing Skin 默认页面结构重写：全屏背景首页、青色顶栏、深灰侧栏、居中登录卡、皮肤库、衣柜双栏、角色管理、个人资料与管理页面。

## 开发与部署

先按同级 [YggServer-Go 文档](../YggServer-Go/README.md) 启动后端，再运行：

```powershell
npm ci
$env:YGG_BACKEND_URL = 'http://127.0.0.1:8080' # 使用后端实际地址
npm run dev
```

访问 Vite 输出的 `/web/` 地址。API 请求通过同源代理，数据库及 Redis 凭证只留在后端，不放进前端配置。

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

构建后将后端 `YGG_WEB_DIR` 指向本项目 `dist` 的绝对路径，由后端统一托管 `/web/`。前端采用 hash 路由，不要求后端添加 history fallback。后端仓库原 `web/` 是早期空白基底，正式 UI 位于本项目。

## 行为与边界

- 对接后端原生 `/api/*`；整数枚举、数组列表和响应头分页遵循后端契约。
- Web 令牌只存内存；刷新页面重新登录。仅主题偏好写入本地存储。
- 第三方 OIDC 的一次性 state 与返回路径只放 sessionStorage，回调消费后清除；提供方令牌与 Client Secret 不进入前端，本站令牌仍不持久化。
- 皮肤库、上传、衣柜和详情使用真实数据；没有演示材质、虚构收藏数或虚构上传者。
- 3D 使用用户于 2026-10-18 批准的 `skinview3d@3.0.1`。它复用模型、UV、披风、控制和动画，避免自行维护数百行渲染代码；模块按需加载，构建产物单独约 129 KiB gzip。
- 角色列表接口目前仅提供 UUID 和名称，因此角色页的默认 Steve 明确标为默认模型，不代表角色实际穿戴。实际穿戴通过衣柜或详情页提交。
- 找回密码和验证邮箱对接既有邮件接口；邮件链接的最终消费继续使用后端 `/account-recovery` 功能页。SMTP 未配置时给出可见错误。

当前状态、验证与待处理事项见 [HANDOVER.md](HANDOVER.md)。

## 站点运营、授权与插件

当前 `main` 分支沿用本分支的 BS 主题、CSS Modules 和既有 `/user`、`/auth` 路由，新增：

- `#/user/points`：余额、滚动签到、下次签到时间、最近 50 条流水及消费规则。冷却、余额不足、插件拒绝使用专用中文提示；拒绝操作不误清空有效登录。
- `#/admin/site`：仅站点所有者可保存站点名称/简介/公告、注册和邮箱域名规则、材质域名、单角色上限、同类单会话、签到与消费价格、OAuth 开关和 OIDC 提供方。公共站点信息统一从 `/api/site` 读取，标题、品牌、页脚及公告随保存更新；注册和改邮箱复用精确域名规则，角色页读取实际上限，上传/收藏/隐私费用可见。最终校验与扣款仍由后端负责。
- 同页提供 OAuth 公共客户端创建/删除，以及插件 ID、版本、开关、Hook 与所有者只读查询。插件配置从部署文件 `YGG_PLUGINS_FILE` 读取、重启生效；没有网页代码安装或热加载功能。
- `#/oauth/authorize`：识别后端授权跳转，匿名用户先登录再继续原请求，展示客户端、精确回调与只读权限，同意或拒绝后回到应用。个人资料可查看并撤销应用授权。
- 登录页提供标准 OIDC 入口；个人资料提供显式绑定与密码确认解绑。`#/oidc/callback` 清除地址栏凭据，校验同标签页 state，完成后取得本站内存会话。回调失败显示重试提示，StrictMode 不重复消费一次性流程。
- 审计支持动作 4–7：站点配置、OAuth 应用、外部绑定、外部解绑。普通用户手动进入管理路由也会被前端拦截，不渲染管理导航和操作；接口仍由后端独立鉴权。

OIDC 应用登记回调为 `YGG_PUBLIC_URL/oidc/callback`；从这个公开地址的 `/web/` 发起登录，确保 sessionStorage 同源。Client Secret 使用后端 `YGG_OIDC_CLIENT_SECRET`，不在站点表单输入。新 OIDC 账号若需启动器密码或解绑，先通过邮件找回设置本站密码，需部署 SMTP。完整协议、默认费用和插件开发契约以同级后端 README、`plugin/README.md` 为准。

## 当前分支验收（2026-10-18）

- `npm ci` 按本分支既有锁文件安装成功，没有更改依赖声明；类型检查、ESLint、30 项 Vitest 测试与生产构建通过。主 JS 约 336 kB（gzip 102 kB），既有 3D 延迟包约 517 kB（gzip 129 kB）仍有 Vite 体积提示。
- 功能：站点运营、签到、积分、权限与插件。实际浏览器访问 `http://127.0.0.1:55705/web/#/auth/register`、`#/auth/login`、`#/admin/site`、`#/user/points`、`#/user/player`、`#/user/profile`、`#/admin/audit`。操作：注册，错误/正确密码登录，保存配置，签到，保留名拒绝、余额不足与正常创建角色，降低上限，关闭注册，注册/改邮箱域名拒绝，读取插件统计。看到：名称/公告即时更新，积分 1000→1010→910，冷却按钮禁用；拒绝提示明确且会话保留；上限从 2 降到 1 后两角色保留、新增禁用；关闭注册后注册按钮禁用；新审计动作正确显示，普通用户无法进入管理操作。
- 功能：本站 OAuth。浏览器测试应用 `http://127.0.0.1:55707/__app` 发起真实 S256 PKCE 请求；正式授权页登录后保留参数，同意后应用回调页面实际浏览器请求显示授权码兑换、`/oauth/userinfo`、`/oauth/players` 均 200。拒绝路径显示 `access_denied`；个人资料撤销后授权列表变空。
- 功能：第三方 OIDC。登录/账号页跳到 `http://127.0.0.1:55709` 临时 RSA/JWKS 提供方，完成绑定、已绑定登录、新账号自动创建；错误 nonce 被拒绝且回调地址不保留 code/state；错误解绑密码被拒绝，正确密码解绑后回到登录页。使用真实发现、签名与授权码交换，没有接真实平台账号。
- 视图：实际查看 1280×720 积分页深浅主题。`http://127.0.0.1:55707/__mobile` 中实际 375×812 iframe 的登录与积分页已查看深浅主题，文档宽 360（滚动条占位），页面无横向溢出，流水表在自身容器滚动。工具的原生视口覆盖未生效；iframe 鼠标点击报目标不可用，使用当前焦点的键盘提交与主题切换走通，不声称完成手机触控验收。追加移动配置预览入口的临时脚本操作被自动审批拒绝，仅返回 blocked by policy，未绕过；移动配置表单未验收。
- 控制台：最终桌面积分和移动预览页面日志检查无 error/warn。响应状态来自浏览器请求与脱敏访问日志核对；工具没有独立 DevTools Network 面板，未声称操作该面板。日志抽查 186 条访问记录无重复 Request ID、无 5xx，未检出测试密码或鉴权字段。
- 环境：只使用 TEMP 中的新建 PostgreSQL 验收库，实际应用后端 34 个迁移和独立 Redis 命名空间；未使用或迁移用户原有数据库，后端源码未改。截图在 `C:/Users/shuil/AppData/Local/Temp/ygg-mainfront-proof.png` 与 `ygg-mainfront-mobile-proof.png`，不入库。
- 未覆盖：真实 Google/Microsoft 等提供方、生产 TLS/Client Secret、外部 SMTP、Minecraft 客户端、当前分支 MySQL 专项联调；材质本轮只复验费用提示，未重跑全部上传/穿戴生命周期。没有新增依赖、提交或推送。

## 来源与许可

布局及视觉依据 [Blessing Skin 源码 `52f6fefe`](https://github.com/bs-community/blessing-skin-server/tree/52f6fefe)，复用其默认首页背景、Minecraft 字体、Steve 材质和七张预览背景。原 MIT 许可保存在 `public/licenses/blessing-skin.txt`；渲染库与 Three.js 许可也保存在该目录。没有搬入 PHP、jQuery、Bootstrap 或 AdminLTE 运行时。
