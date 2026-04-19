# GitHub Actions 构建指南

## 快速开始

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`hermes-agent-desktop`
3. 选择 **Private**（私有）或 **Public**（公开）
4. 点击 **Create repository**

### 2. 上传代码到 GitHub

```bash
# 在 hermes-agent-desktop 文件夹中执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/hermes-agent-desktop.git
git push -u origin main
```

### 3. 触发自动构建

上传代码后，GitHub Actions 会自动开始构建：

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 查看构建进度（约 10-15 分钟）

### 4. 下载安装包

构建完成后：

1. 点击 **Actions** → 选择最新的工作流运行
2. 页面底部 **Artifacts** 区域
3. 下载以下文件：
   - `hermes-agent-desktop-windows-msi` - Windows MSI 安装包
   - `hermes-agent-desktop-windows-setup` - Windows 安装程序（推荐）
   - `hermes-agent-desktop-windows-portable` - 便携版（无需安装）

## 文件说明

| 文件名 | 类型 | 用途 |
|--------|------|------|
| `hermes-agent-desktop_0.2.0_x64-setup.exe` | NSIS 安装程序 | 推荐，支持自动更新 |
| `hermes-agent-desktop_0.2.0_x64_en-US.msi` | MSI 安装包 | 企业部署 |
| `hermes-agent-desktop.exe` | 便携版 | 无需安装，直接运行 |

## 自动更新配置（可选）

如需启用自动更新功能，需要配置签名密钥：

### 生成签名密钥

```bash
# 安装 Tauri CLI
cargo install tauri-cli

# 生成密钥
cargo tauri signer generate
```

### 配置 GitHub Secrets

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 添加以下 Secrets：
   - `TAURI_SIGNING_PRIVATE_KEY`：生成的私钥内容
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：私钥密码

## 手动触发构建

如需重新构建：

1. 进入 **Actions** 标签
2. 选择 **Build Hermes Agent Desktop** 工作流
3. 点击 **Run workflow** → 选择分支 → **Run workflow**

## 常见问题

### Q: 构建失败怎么办？

A: 点击失败的构建 → **Re-run jobs** → **Re-run all jobs**

### Q: 如何修改应用信息？

A: 编辑 `src-tauri/tauri.conf.json` 文件：
- `productName`：应用名称
- `version`：版本号
- `identifier`：应用标识符

### Q: 如何更新版本？

A: 修改以下文件的版本号：
1. `package.json` - `"version": "0.2.0"`
2. `src-tauri/tauri.conf.json` - `"version": "0.2.0"`
3. `src-tauri/Cargo.toml` - `version = "0.2.0"`

然后提交并推送：
```bash
git add .
git commit -m "Bump version to 0.2.1"
git push
```

## 下一步

1. 下载安装包并安装
2. 启动应用，配置模型 API 密钥
3. 开始使用 Hermes Agent Desktop！
