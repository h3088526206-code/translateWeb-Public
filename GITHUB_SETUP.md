# GitHub 上传指南

## ✅ 已完成
- ✅ Git 仓库已初始化
- ✅ 文件已添加到 Git
- ✅ 初始提交已创建

## 📋 下一步：上传到 GitHub

### 方法一：通过 GitHub 网站创建仓库（推荐）

1. **登录 GitHub**
   - 访问 https://github.com
   - 登录您的账户

2. **创建新仓库**
   - 点击右上角的 "+" 号，选择 "New repository"
   - 仓库名称建议：`translateWeb` 或 `ai-image-labeling-system`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
   - 点击 "Create repository"

3. **连接本地仓库并推送**
   
   在项目目录下运行以下命令（将 `YOUR_USERNAME` 替换为您的 GitHub 用户名）：
   
   ```bash
   # 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   
   # 将代码推送到 GitHub
   git branch -M main
   git push -u origin main
   ```

### 方法二：使用 GitHub CLI（如果已安装）

```bash
# 创建仓库并推送
gh repo create translateWeb --public --source=. --remote=origin --push
```

### 方法三：使用 SSH（如果已配置 SSH 密钥）

```bash
# 添加 SSH 远程仓库
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送代码
git branch -M main
git push -u origin main
```

## 🔐 身份验证

如果推送时要求输入用户名和密码：
- **用户名**：您的 GitHub 用户名
- **密码**：使用 Personal Access Token（不是账户密码）
  - 生成 Token：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - 权限选择：至少勾选 `repo` 权限

## 📝 常用 Git 命令

```bash
# 查看状态
git status

# 查看提交历史
git log

# 添加文件
git add .

# 创建提交
git commit -m "提交说明"

# 推送到 GitHub
git push

# 查看远程仓库
git remote -v
```

## ⚠️ 注意事项

1. **敏感信息**：确保 `.env` 文件已添加到 `.gitignore`（已完成）
2. **大文件**：`node_modules` 已忽略，不会上传
3. **上传的文件**：`uploads/` 和 `labels/` 目录已忽略，不会上传用户数据

## 🎉 完成

推送成功后，您就可以在 GitHub 上看到您的代码了！

