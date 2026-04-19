# Hermes Agent Desktop 构建指南

## 环境准备

### 1. 安装 Node.js

下载并安装 Node.js 18+：
- 官网：https://nodejs.org/
- 或使用 nvm-windows：https://github.com/coreybutler/nvm-windows

验证安装：
```bash
node --version  # v18.x.x 或更高
npm --version
```

### 2. 安装 Rust

下载并运行 Rust 安装程序：
- 官网：https://rustup.rs/
- Windows 下载：https://win.rustup.rs/

验证安装：
```bash
rustc --version  # 1.70+ 或更高
cargo --version
```

### 3. 安装 Tauri 依赖 (Windows)

Tauri 需要 WebView2 和 Visual Studio Build Tools：

**WebView2 Runtime**
- 通常 Windows 10/11 已预装
- 如需安装：https://developer.microsoft.com/en-us/microsoft-edge/webview2/

**Visual Studio Build Tools**
下载并安装 C++ 构建工具：
- 下载：https://visualstudio.microsoft.com/visual-cpp-build-tools/
- 安装时选择："使用 C++ 的桌面开发"

## 项目构建

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/hermes-agent-desktop.git
cd hermes-agent-desktop
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式运行

```bash
npm run tauri:dev
```

这将启动：
- Vite 开发服务器 (http://127.0.0.1:1420)
- Tauri 桌面应用窗口

### 4. 构建发布版本

```bash
npm run tauri:build
```

构建输出：
- Windows Installer (.msi): `src-tauri/target/release/bundle/msi/`
- Windows Executable (.exe): `src-tauri/target/release/`

## 常见问题

### 1. Rust 编译错误

**错误**: `linker link.exe not found`

**解决**: 安装 Visual Studio Build Tools 并选择 C++ 桌面开发

### 2. WebView2 错误

**错误**: `WebView2 not found`

**解决**: 安装 WebView2 Runtime

### 3. 前端依赖错误

**解决**: 删除 node_modules 重新安装
```bash
rm -rf node_modules
npm install
```

### 4. Tauri 命令未找到

**解决**: 全局安装 Tauri CLI
```bash
npm install -g @tauri-apps/cli
```

## 项目配置

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`：
```json
{
  "productName": "Hermes Agent Desktop",
  "version": "0.2.0",
  "identifier": "com.nousresearch.hermes-agent"
}
```

### 修改窗口大小

编辑 `src-tauri/tauri.conf.json`：
```json
{
  "app": {
    "windows": [{
      "width": 1400,
      "height": 900,
      "minWidth": 1000,
      "minHeight": 700
    }]
  }
}
```

### 添加新命令

1. 在 `src-tauri/src/main.rs` 中添加命令函数
2. 在 `invoke_handler` 中注册命令
3. 在前端使用 `invoke()` 调用

## 调试技巧

### 前端调试
- 按 `F12` 打开 DevTools
- 或使用 `Ctrl+Shift+I`

### Rust 调试
```bash
# 带日志运行
cd src-tauri
cargo run --features devtools
```

### 查看日志
```bash
# Windows PowerShell
$env:RUST_LOG="debug"
npm run tauri:dev
```

## 打包分发

### Windows MSI 安装包

构建完成后：
```bash
src-tauri/target/release/bundle/msi/Hermes Agent Desktop_0.2.0_x64_en-US.msi
```

### 便携版

如需便携版（无需安装）：
```bash
# 直接分发 exe
src-tauri/target/release/hermes-agent-desktop.exe
```

注意：便携版需要目标系统已安装 WebView2。

## 更新发布

1. 修改版本号：`package.json` 和 `Cargo.toml`
2. 创建 Git Tag：`git tag v0.2.0`
3. 推送到 GitHub：`git push origin v0.2.0`
4. GitHub Actions 会自动构建并发布

## 参考文档

- [Tauri 文档](https://tauri.app/v1/guides/)
- [Rust 文档](https://doc.rust-lang.org/)
- [React 文档](https://react.dev/)
