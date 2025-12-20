# GitHub 仓库设置脚本
# 使用方法: .\setup-github.ps1 -Username "YOUR_USERNAME" -RepoName "REPO_NAME" [-Token "YOUR_TOKEN"]

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    
    [Parameter(Mandatory=$false)]
    [string]$Token
)

Write-Host "正在设置 GitHub 仓库..." -ForegroundColor Green

# 如果没有提供 Token，尝试从 git credential helper 获取
if (-not $Token) {
    Write-Host "提示: 如果没有 Token，将使用 HTTPS 方式，需要手动输入密码" -ForegroundColor Yellow
}

# 检查是否已有远程仓库
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "检测到已有远程仓库，正在移除..." -ForegroundColor Yellow
    git remote remove origin
}

# 创建 GitHub 仓库（如果提供了 Token）
if ($Token) {
    Write-Host "正在创建 GitHub 仓库..." -ForegroundColor Green
    $headers = @{
        "Authorization" = "token $Token"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $body = @{
        name = $RepoName
        description = "AI 图片标签识别与翻译系统"
        private = $false
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "仓库创建成功: $($response.html_url)" -ForegroundColor Green
    } catch {
        Write-Host "创建仓库失败: $_" -ForegroundColor Red
        Write-Host "将尝试直接添加远程仓库..." -ForegroundColor Yellow
    }
}

# 添加远程仓库
Write-Host "正在添加远程仓库..." -ForegroundColor Green
if ($Token) {
    git remote add origin "https://$Username`:$Token@github.com/$Username/$RepoName.git"
} else {
    git remote add origin "https://github.com/$Username/$RepoName.git"
}

# 重命名分支为 main
Write-Host "正在重命名分支为 main..." -ForegroundColor Green
git branch -M main

# 推送代码
Write-Host "正在推送代码到 GitHub..." -ForegroundColor Green
try {
    if ($Token) {
        git push -u origin main
    } else {
        Write-Host "请在弹出的窗口中输入您的 GitHub 用户名和 Personal Access Token" -ForegroundColor Yellow
        git push -u origin main
    }
    Write-Host "`n✅ 成功！代码已推送到 GitHub" -ForegroundColor Green
    Write-Host "仓库地址: https://github.com/$Username/$RepoName" -ForegroundColor Cyan
} catch {
    Write-Host "推送失败: $_" -ForegroundColor Red
    Write-Host "`n请手动执行以下命令:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
}

