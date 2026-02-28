为当前更改创建 Commit 和 Push。

1. 用 `git pull` 拉取最新代码
2. 用 `npm run lint` 检查代码规范, 并修复所有问题
3. 用 `npm run format` 格式化整个仓库, 避免未暂存文件因格式差异在提交后仍显示改动
4. 用 `git add .` 添加所有更改
5. 根据更改内容写一条清晰的提交消息并执行 `git commit -m "提交消息"`
6. 提交并推送到当前分支并执行 `git push`
