# Hermes Agent Desktop - 一键上传到 GitHub
# 此脚本帮助你将代码上传到 GitHub 并触发自动构建

param(
    [Parameter(Mandatory=$true)]
    [string]$GithubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "hermes-agent-desktop",
    
    [Parameter(Mandatory=$false)]
    [switch]$Private = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hermes Agent Desktop - GitHub 上传工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
Write-Host "[1/6] 检查 Git 安装..." -ForegroundColor Yellow
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    Write-Host "Git 未安装，正在通过 winget 安装..." -ForegroundColor Red
    winget install Git.Git
    Write-Host "Git 安装完成，请重新运行此脚本" -ForegroundColor Green
    exit
}
Write-Host "✓ Git 已安装" -ForegroundColor Green

# 检查是否在正确的目录
Write-Host "[2/6] 检查项目目录..." -ForegroundColor Yellow
$requiredFiles = @("package.json", "src-tauri", "src")
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}
if ($missingFiles.Count -gt 0) {
    Write-Host "错误：缺少以下文件/文件夹：" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "请确保在 hermes-agent-desktop 目录中运行此脚本" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 项目目录正确" -ForegroundColor Green

# 初始化 Git 仓库
Write-Host "[3/6] 初始化 Git 仓库..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
} else {
    Write-Host "✓ Git 仓库已存在" -ForegroundColor Green
}

# 配置 Git 用户信息（如果未设置）
$userName = git config user.name
$userEmail = git config user.email
if (-not $userName) {
    $defaultName = $env:USERNAME
    $inputName = Read-Host "请输入 Git 用户名 [$defaultName]"
    if ([string]::IsNullOrWhiteSpace($inputName)) { $inputName = $defaultName }
    git config user.name $inputName
}
if (-not $userEmail) {
    $inputEmail = Read-Host "请输入 Git 邮箱"
    git config user.email $inputEmail
}

# 添加远程仓库
Write-Host "[4/6] 配置远程仓库..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$GithubUsername/$RepoName.git"
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "远程仓库已存在：$existingRemote" -ForegroundColor Yellow
    $changeRemote = Read-Host "是否更换远程仓库？ (y/N)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote remove origin
        git remote add origin $remoteUrl
        Write-Host "✓ 远程仓库已更新" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "✓ 远程仓库已添加：$remoteUrl" -ForegroundColor Green
}

# 添加文件并提交
Write-Host "[5/6] 添加文件到 Git..." -ForegroundColor Yellow
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "Initial commit: Hermes Agent Desktop v0.2.0"
    Write-Host "✓ 文件已提交" -ForegroundColor Green
} else {
    Write-Host "✓ 没有需要提交的更改" -ForegroundColor Green
}

# 推送到 GitHub
Write-Host "[6/6] 推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "提示：如果这是第一次推送，Git 会要求你登录 GitHub" -ForegroundColor Cyan
Write-Host "      请按照提示完成身份验证" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  上传成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "GitHub 仓库地址：" -ForegroundColor Cyan
    Write-Host "  $remoteUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "  1. 访问：$remoteUrl" -ForegroundColor White
    Write-Host "  2. 点击 'Actions' 标签查看构建进度" -ForegroundColor White
    Write-Host "  3. 构建完成后，在 Actions 页面下载安装包" -ForegroundColor White
    Write-Host ""
    Write-Host "构建时间：约 10-15 分钟" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  推送失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "  1. GitHub 仓库不存在" -ForegroundColor White
    Write-Host "  2. 没有权限推送" -ForegroundColor White
    Write-Host "  3. 网络连接问题" -ForegroundColor White
    Write-Host ""
    Write-Host "解决方法：" -ForegroundColor Yellow
    Write-Host "  1. 访问 https://github.com/new 创建仓库 '$RepoName'" -ForegroundColor White
    Write-Host "  2. 确保仓库名称为：$RepoName" -ForegroundColor White
    Write-Host "  3. 重新运行此脚本" -ForegroundColor White
    Write-Host ""
}
