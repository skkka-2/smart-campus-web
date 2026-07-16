# smart-campus-web

大学智学网(item01)前端。Vue3 + Vite + Element Plus + Pinia + Vue Router,配合后端 [smart-campus-api](https://github.com/skkka-2/smart-campus-api)。

## 技术栈

- **Vue 3** + `<script setup>`
- **Vite 5**
- **Element Plus 2** —— UI 组件(通过 `unplugin-*` 按需引入)
- **Pinia** —— token / userID 持久化到 localStorage
- **vue-router 4**
- **axios** —— 封装在 `src/util/request.js`,自动带 Authorization
- **wangeditor** —— 文章编辑器
- **vue3-emoji-picker** —— 聊天室表情
- **boxicons / fontawesome** —— 图标字体

## 目录结构

```
web/
├── index.html
├── vite.config.js
├── .env                 # VITE_BASE_API / VITE_WS_URL
├── src/
│   ├── main.js          # 入口:注册 pinia、router、样式
│   ├── App.vue          # 只挂 <router-view>
│   ├── router/router.js # 全部路由定义
│   ├── stores/          # Pinia store(user)
│   ├── api/             # 按模块拆分的接口层
│   ├── util/request.js  # axios 实例 + 拦截器
│   ├── websocket.js     # 聊天室 WebSocket 客户端
│   ├── view/            # 页面组件(LayOut / MainPart / Login / AiPart / ChatRoom ...)
│   ├── components/      # 通用组件(content / comment)
│   ├── assets/          # 图片和全局样式
│   └── ...
└── public/              # 静态资源(头像 / BOSS logo / 轮播图)
```

## 从零到跑起来

前置:先按 [smart-campus-api](https://github.com/skkka-2/smart-campus-api) 的 README 把后端跑起来。

### 1. 装依赖

```bash
npm install
```

### 2. 配置环境变量

`.env` 默认已指向本地后端:
```
VITE_BASE_API=http://127.0.0.1:3007
VITE_WS_URL=ws://127.0.0.1:3007
```

如果后端不在 127.0.0.1 或不监听 3007,改这两行即可。

### 3. 启动

```bash
npm run dev
```

浏览器打开 http://localhost:5173(Vite 默认端口)。

### 4. 打包

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览打包产物
```

## 页面路由

| 路径 | 说明 |
|------|------|
| `/MainPart` | 首页信息流(推荐 / 最新) |
| `/OnePart` | 升学速递(政策、招生) |
| `/TwoPart` | 实习就业(热招企业) |
| `/ThreePart` | 虚拟滚动 demo |
| `/FourPart` | 名师咨询(悬浮客服) |
| `/AiPart` | AI 对话 |
| `/ChatRoom` | 聊天室(WebSocket) |
| `/CommentPart/:commentId` | 评论页 |
| `/create` | 文章创作(wangEditor) |
| `/login` | 登录/注册 |

## 关联仓库

- 后端:https://github.com/skkka-2/smart-campus-api
