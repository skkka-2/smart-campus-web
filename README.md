# smart-campus-web

大学智学网前端。**Vue 3 + Vite + Element Plus + Pinia + Vue Router**,配合后端 [smart-campus-api](https://github.com/skkka-2/smart-campus-api)。

## 技术栈

- **Vue 3** + `<script setup>`
- **Vite 5**(带 dev proxy,免 CORS)
- **Element Plus 2** —— UI 组件(按需引入)
- **Pinia** —— 状态管理
- **vue-router 4** —— 带守卫的路由
- **axios** —— 封装在 `util/request.js`,自动带 Authorization + auto-unwrap 响应
- **wangEditor** + **marked** —— 文章编辑器 + Markdown 渲染
- **eslint** + **prettier** —— 代码质量

## 目录结构

```
smart-campus-web/
├── index.html
├── vite.config.js               # 含 /api dev proxy
├── eslint.config.js
├── .prettierrc.json
├── .env / .env.development / .env.production
├── src/
│   ├── main.js
│   ├── App.vue                  # 仅 <router-view>
│   ├── router/router.js         # 路由 + 全局守卫(requiresAuth)
│   ├── stores/                  # Pinia:user(token/userID/username)
│   ├── api/                     # 一个模块一个文件,全部走 request 实例
│   │   ├── loginPart.js
│   │   ├── CreatPart.js         # articles / rankings / like / comments / categories
│   │   ├── CommentPart.js
│   │   ├── AiPart.js
│   │   └── ChatPart.js
│   ├── util/request.js          # axios 实例 + 拦截器(401 自动跳登录)
│   ├── websocket.js             # 聊天室 WebSocket 客户端
│   ├── composables/             # useScroll / useDebounce / useTimeAgo / useAuth
│   ├── layouts/                 # DefaultLayout / AppHeader / FloatToolbar / SearchBar
│   ├── components/              # ArticleCard / CommentItem / AvatarWithFallback
│   ├── views/                   # 主要页面
│   │   ├── Home/                # 首页拆分成 3 个子组件
│   │   │   ├── index.vue
│   │   │   ├── HomeSidebar.vue  # 从 /api/categories 拉动态分类
│   │   │   ├── HomeFeed.vue     # 分页 + tab 切换 + 分类过滤
│   │   │   └── HomeRankPanel.vue
│   │   └── ArticleDetail.vue    # 详情 + 点赞 + 评论
│   ├── view/                    # 其他子页面
│   ├── styles/index.css         # design tokens
│   └── assets/                  # 图片
└── public/                      # 静态资源(头像/BOSS logo/轮播图)
```

## 从零到跑起来

前置:先按 [smart-campus-api](https://github.com/skkka-2/smart-campus-api) 的 README 把后端跑起来。

### 1. 装依赖

```bash
npm install
```

### 2. 配置环境变量(通常无需修改)

默认 `.env.development` 已经指向本地后端:
```
VITE_BASE_API=            # 空 → 走 vite dev proxy
VITE_WS_URL=ws://127.0.0.1:3007
VITE_PROXY_TARGET=http://127.0.0.1:3007
```
若后端不在 `127.0.0.1:3007`,改 `VITE_PROXY_TARGET`。

### 3. 启动

```bash
npm run dev
```

浏览器打开 http://localhost:5173。

### 4. 打包 & 预览

```bash
npm run build     # 产物到 dist/,读 .env.production
npm run preview   # 预览打包产物
```

## 架构约定

**响应格式对齐**:后端返回 `{ code, message, data }`,axios 拦截器自动 unwrap 出 `data`,业务代码里 `const items = await listArticles()` 拿到的就是 `data`。

**鉴权**:
- Token 存 Pinia store,同步落 localStorage
- 请求拦截器自动加 `Authorization: Bearer xxx`
- 响应拦截器捕获 401 → 清 store + 跳登录
- 路由守卫读 `meta.requiresAuth`,未登录跳 `/login?redirect=<path>`

**页面组件拆分**:LayOut(旧 459 行)拆成 `DefaultLayout / AppHeader / FloatToolbar / SearchBar`;MainPart(旧 465 行)拆成 `Home/index / HomeSidebar / HomeFeed / HomeRankPanel`。

**公用 composable**:
- `useScroll(handler)` —— 组件卸载自动清理
- `useTimeAgo(msTimestamp)` —— 全局单一 30s ticker,列表越大不会开越多定时器
- `useAuth()` —— `isLogin` / `userID` / `requireLogin()` / `logout()`
- `useDebounce` / `throttle` —— 通用节流防抖

**头像**:`AvatarWithFallback` 组件,图片 404 时自动降级成"首字母 + 稳定色"胶囊。

## 页面路由

| 路径 | 说明 | 需登录 |
|------|------|:----:|
| `/home` | 首页信息流(分类过滤 + 推荐/最新 tab) | ✗ |
| `/articles/:id` | 文章详情(点赞 + 评论区) | ✗ |
| `/OnePart` | 升学速递 | ✗ |
| `/TwoPart` | 实习就业 | ✗ |
| `/FourPart` | 名师咨询(悬浮客服) | ✗ |
| `/AiPart` | AI 对话 | ✓ |
| `/ChatRoom` | 聊天室(WebSocket) | ✓ |
| `/create` | 文章创作(wangEditor) | ✓ |
| `/login` | 登录/注册 | ✗ |

## 开发

```bash
npm run dev      # vite dev server(带 proxy)
npm run build    # 生产构建
npm run lint     # eslint
npm run format   # prettier 格式化
```

## 关联仓库

- 后端:https://github.com/skkka-2/smart-campus-api
