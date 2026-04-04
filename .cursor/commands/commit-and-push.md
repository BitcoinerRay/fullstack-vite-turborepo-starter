1. 用 `git add .` 将本次要提交的文件加入暂存区
2. 用 `npm run lint` 跑 ESLint（`eslint --fix`，全仓；本仓库未配置 lint-staged / husky / `.lintstagedrc`）
3. 若上一步自动修复了文件，再次 `git add .` 把修复纳入暂存
4. 根据更改内容写一条清晰的提交消息并执行 `git commit -m "提交消息"`
5. 推送前用 `git pull --rebase` 同步远端（若团队不用 rebase 可改用 `git pull`），减少 push 被拒绝或与远端分叉
6. 推送到当前分支：执行 `git push`

说明：`npm run lint` 会检查整个 `src/` 等 ESLint 覆盖范围，比「只检暂存」慢，但是当前项目唯一的统一自动修复入口。大改或发版前建议再跑 `npm run build` 做 TypeScript 与打包校验。
