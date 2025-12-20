# 快速上传到 GitHub

## 方法一：使用批处理脚本（推荐，Windows）

直接双击运行 `github-setup.bat`，按提示输入您的 GitHub 用户名即可。

## 方法二：手动命令

如果您已经在 GitHub 上创建了仓库，执行以下命令：

```bash
# 1. 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/translateWeb.git

# 2. 推送代码
git push -u origin main
```

## 方法三：如果还没有创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称填写：`translateWeb`
3. 选择 Public 或 Private
4. **不要**勾选 "Initialize with README"
5. 点击 "Create repository"
6. 然后使用方法二推送代码

## 身份验证

如果推送时要求输入密码：
- **用户名**：您的 GitHub 用户名
- **密码**：使用 Personal Access Token（不是账户密码）
  - 生成地址：https://github.com/settings/tokens
  - 权限：至少勾选 `repo` 权限

## 当前状态

✅ Git 仓库已初始化
✅ 所有文件已提交
✅ 分支已重命名为 main
⏳ 等待连接到 GitHub 并推送

