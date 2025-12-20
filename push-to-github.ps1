# 自动推送到 GitHub 脚本
$repoName = "translateWeb"
Write-Host ""
Write-Host "=== GitHub 仓库推送脚本 ===" -ForegroundColor Cyan
Write-Host "仓库名称: $repoName" -ForegroundColor Yellow
Write-Host ""

# 检查是否已有远程仓库
$hasRemote = $false
$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    $hasRemote = $true
    Write-Host "检测到已有远程仓库: $remoteUrl" -ForegroundColor Yellow
} else {
    Write-Host "未检测到远程仓库，需要设置" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请提供以下信息:" -ForegroundColor Cyan
    $username = Read-Host "GitHub 用户名"
    
    if ([string]::IsNullOrWhiteSpace($username)) {
        Write-Host "错误: 用户名不能为空" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "正在添加远程仓库..." -ForegroundColor Green
    git remote add origin "https://github.com/$username/$repoName.git"
    Write-Host "远程仓库已添加: https://github.com/$username/$repoName.git" -ForegroundColor Green
}

# 重命名分支为 main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host ""
    Write-Host "正在重命名分支为 main..." -ForegroundColor Green
    git branch -M main
}

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "检测到未提交的更改，正在添加..." -ForegroundColor Yellow
    git add .
    git commit -m "Update: prepare for GitHub push"
}

# 推送代码
Write-Host ""
Write-Host "正在推送到 GitHub..." -ForegroundColor Green
Write-Host "提示: 如果要求输入密码，请使用 Personal Access Token" -ForegroundColor Yellow
Write-Host "获取 Token: https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "成功！代码已推送到 GitHub" -ForegroundColor Green
    $finalUrl = git remote get-url origin
    Write-Host "仓库地址: $finalUrl" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "推送失败，请检查:" -ForegroundColor Red
    Write-Host "1. 是否已在 GitHub 上创建了名为 '$repoName' 的仓库" -ForegroundColor White
    Write-Host "2. GitHub 用户名是否正确" -ForegroundColor White
    Write-Host "3. 是否使用了正确的 Personal Access Token" -ForegroundColor White
    Write-Host ""
    Write-Host "手动创建仓库: https://github.com/new" -ForegroundColor Cyan
}
