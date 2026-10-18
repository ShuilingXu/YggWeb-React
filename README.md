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
- 皮肤库、上传、衣柜和详情使用真实数据；没有演示材质、虚构收藏数或虚构上传者。
- 3D 使用用户于 2026-10-18 批准的 `skinview3d@3.0.1`。它复用模型、UV、披风、控制和动画，避免自行维护数百行渲染代码；模块按需加载，构建产物单独约 129 KiB gzip。
- 角色列表接口目前仅提供 UUID 和名称，因此角色页的默认 Steve 明确标为默认模型，不代表角色实际穿戴。实际穿戴通过衣柜或详情页提交。
- 找回密码和验证邮箱对接既有邮件接口；邮件链接的最终消费继续使用后端 `/account-recovery` 功能页。SMTP 未配置时给出可见错误。

当前状态、验证与待处理事项见 [HANDOVER.md](HANDOVER.md)。

## 来源与许可

布局及视觉依据 [Blessing Skin 源码 `52f6fefe`](https://github.com/bs-community/blessing-skin-server/tree/52f6fefe)，复用其默认首页背景、Minecraft 字体、Steve 材质和七张预览背景。原 MIT 许可保存在 `public/licenses/blessing-skin.txt`；渲染库与 Three.js 许可也保存在该目录。没有搬入 PHP、jQuery、Bootstrap 或 AdminLTE 运行时。
