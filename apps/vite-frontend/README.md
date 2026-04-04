# Vite Frontend

前端 workspace 只负责浏览器端 UI、路由、登录流和多语言，不负责任何服务端渲染逻辑。项目总览请先看根目录 [README.md](../../README.md)。

## 当前职责

- 启动 Vite 开发服务器
- 通过 React Router 管理基于 `/:locale` 的路由
- 通过 React Query + Axios 请求后端
- 使用 Zustand 保存用户态与全局 loading 状态
- 使用 `react-i18next` 加载中英文资源

## 关键入口

| 文件                              | 作用                               |
| --------------------------------- | ---------------------------------- |
| `src/main.tsx`                    | 挂载 Router、样式和 i18n           |
| `src/router/index.tsx`            | 定义页面路由与懒加载               |
| `src/lib/axios.ts`                | API client、401 处理、loading 计数 |
| `src/layouts/ProvidersLayout.tsx` | 集中挂载 providers                 |
| `vite.config.ts`                  | 端口、别名、代理、构建分块         |

## 当前页面范围

- `/en` 或 `/zh`
- `/:locale/login`
- `/:locale/register`
- `/:locale/about`、`/:locale/contact`、`/:locale/privacy`
- `/:locale/terms`、`/:locale/imprint`
- 错误页与 404

`Header` 已提供基础导航，`Footer` 链接也已对齐到现有信息页。

## API 访问方式

- 开发环境下，Axios 请求相对路径 `/api/v1`
- Vite 会读取 `VITE_BACKEND_URL`，把 `/api/v1` 代理到对应后端地址
- 非开发环境下，前端 API client 会基于 `VITE_BACKEND_URL` 计算完整后端基地址

## 常用命令

```bash
npm run dev -w apps/vite-frontend
npm run build -w apps/vite-frontend
npm run lint -w apps/vite-frontend
```

## 当前限制

- 当前只有一条 Playwright smoke test，覆盖范围仍然偏轻量
- `apps/vite-frontend/MIGRATION-SUMMARY.md` 是迁移归档，不应把它当成当前实现说明
