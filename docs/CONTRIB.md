# Contributing

这份文档面向“准备在仓库里提交改动”的开发者。项目总览、新手启动方式、环境变量策略请先看根目录 [README.md](../README.md)。

## 开发工作流

1. 安装依赖：`npm install`
2. 启动基础设施：`npm run infra:start`
3. 确认容器状态：`npm run infra:health`
4. 启动开发环境：`npm run dev`
5. 修改代码或文档
6. 在提交前运行与你改动范围匹配的校验命令

### 什么时候改哪份文档

| 场景                                       | 应该更新的文档        |
| ------------------------------------------ | --------------------- |
| 项目总览、上手、环境变量、真实运行方式变化 | 根目录 `README.md`    |
| 贡献流程、提交前检查、协作约定变化         | `docs/CONTRIB.md`     |
| 排障、部署、健康检查、回滚流程变化         | `docs/RUNBOOK.md`     |
| 代码结构、模块边界、依赖关系变化           | `codemaps/*.md`       |
| 某个 workspace 的局部职责变化              | 对应 workspace README |

原则只有一条：同一事实尽量只在一处写全，其余文档只做跳转或局部补充。

## 提交前检查

### 推荐按改动范围执行

| 场景                      | 建议命令                               |
| ------------------------- | -------------------------------------- |
| 改了通用代码路径          | `npm run build`                        |
| 改了格式或文档            | `npm run format`                       |
| 改了 Prisma schema / 迁移 | `npm run build -w packages/db`         |
| 改了 shared DTO / 类型    | `npm run build -w packages/shared`     |
| 改了前端业务逻辑          | `npm run build -w apps/vite-frontend`  |
| 改了后端业务逻辑          | `npm run build -w apps/nestjs-backend` |

### 当前仓库的已知校验限制

| 命令                | 当前状态         | 说明                                                 |
| ------------------- | ---------------- | ---------------------------------------------------- |
| `npm run lint`      | 不能稳定作为基线 | 当前工作区已有未提交文件改动，会干扰 lint 结论       |
| `npm run test:unit` | 可直接使用       | 当前已接通一条后端健康检查单测                       |
| `npm run test:e2e`  | 可直接使用       | 当前已接通后端 Jest E2E 与前端 Playwright smoke test |

如果你补的是文档，不需要为了“看起来完整”而声称这些测试已可用；应如实记录现状。

首次运行 Playwright 测试前，如果本机还没有浏览器二进制，需要执行：

```bash
npx playwright install chromium
```

## 分支、提交与钩子

- 仓库启用了 Husky
- 提交信息会被 Commitlint 校验
- PR 标题也会在 CI 中接受语义化检查

建议使用下面的提交类型：

- `docs`: 文档更新
- `feat`: 新功能
- `fix`: 缺陷修复
- `refactor`: 重构
- `test`: 测试相关
- `ci`: CI/CD 相关

## 文档改动约定

- 以中文为主，保留必要英文术语
- 根 README 是主入口，不要把同一套项目说明复制到多个 README
- 说明“当前状态”时尽量引用真实文件路径、脚本名、接口路径
- 如果某个命令当前不可用，要写明原因，而不是默认它应当成功
- 如果文档引用环境变量，要先确认代码里真的在消费它

## 基础设施与数据库约定

- Postgres 和 Redis 由根目录 `docker-compose.yml` 管理
- 应用运行时默认读取根目录 `.env.development` / `.env.production`
- 根目录 `.env` 只作为 Docker Compose 覆盖文件
- Prisma 相关命令集中在 `packages/db`

常用数据库命令：

```bash
npm run db:generate -w packages/db
npm run migrate:dev -w packages/db
npm run migrate:status -w packages/db
npm run db:studio -w packages/db
```

## PR 说明建议

如果你提交的是基础设施、环境变量或文档修正，PR 描述里至少写清楚：

- 这次变更修正了哪一处“代码与文档不一致”
- 你依据的源码位置是什么
- 哪些命令已经验证，哪些命令因当前仓库缺口未验证

这样后续维护者能快速判断这是“新增行为”还是“文档纠偏”。
