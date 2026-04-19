# 🧠 Hermes Agent Desktop

基于 OpenClaw Desktop 开发的智能 AI 助手桌面应用，集成 Hermes Agent 核心能力，支持多模型智能切换。

## ✨ 核心特性

### 🔄 多模型智能路由
- **智能模式** 🧠 - 根据任务类型自动选择最优模型
- **本地模式** 🏠 - 仅使用本地 Ollama 模型
- **云端模式** ☁️ - 仅使用云端 API (OpenAI/Claude)
- **手动模式** ⚙️ - 手动指定模型

### 🤖 Hermes Agent 集成
- 闭环学习系统
- 技能自创与自改进
- 跨会话记忆召回
- 用户建模 (Honcho)

### 💬 现代化聊天界面
- 类似 ChatGPT 的对话体验
- Markdown 渲染 + 代码高亮
- 多会话管理
- 实时流式响应

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Rust 1.70+
- Windows 10/11

### 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Tauri CLI
npm install -g @tauri-apps/cli

# 安装 Rust (如果未安装)
# 访问 https://rustup.rs/ 下载安装
```

### 开发运行

```bash
# 启动开发服务器
npm run tauri:dev
```

### 构建发布版本

```bash
# 构建 Windows 安装包
npm run tauri:build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/msi/`

## 📁 项目结构

```
hermes-agent-desktop/
├── src/                          # 前端源码 (React + TypeScript)
│   ├── components/               # React 组件
│   │   ├── Chat/                 # 聊天界面
│   │   └── ModelSelector/        # 模型选择器
│   ├── stores/                   # Zustand 状态管理
│   │   ├── modelStore.ts         # 模型状态
│   │   └── chatStore.ts          # 聊天状态
│   ├── App.tsx                   # 主应用组件
│   └── main.tsx                  # 入口文件
├── src-tauri/                    # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs               # 主入口
│   │   └── model_router/         # 模型路由系统
│   │       ├── mod.rs
│   │       ├── router.rs         # 路由核心
│   │       ├── ollama.rs         # Ollama 客户端
│   │       ├── openai.rs         # OpenAI/Claude 客户端
│   │       └── types.rs          # 类型定义
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## 🔧 模型路由系统

### 智能路由逻辑

```rust
// 简单问答 → 本地轻量模型 (Ollama 7B/8B)
// 代码生成 → GPT-4 / Claude / Hermes Pro
// 长文档 → 128K+ 上下文模型
// 工具调用 → Hermes (函数调用优化)
```

### 支持的模型

**本地模型 (Ollama)**
- llama3.1 (8B/70B/405B)
- qwen2.5
- mistral
- mixtral
- gemma2
- phi4

**云端模型**
- GPT-4 / GPT-4 Turbo / GPT-3.5 Turbo
- Claude 3 Opus / Sonnet / Haiku

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.x |
| 后端语言 | Rust |
| 前端框架 | React 19 |
| 构建工具 | Vite 6 |
| 状态管理 | Zustand |
| UI 样式 | CSS3 |
| HTTP 客户端 | reqwest (Rust) |

## 🔌 API 配置

在设置面板中配置以下 API Key：

- **OpenAI API Key** - 用于 GPT 系列模型
- **Anthropic API Key** - 用于 Claude 系列模型
- **Ollama 端点** - 默认 `http://localhost:11434`

## 📝 开发计划

- [x] 基础项目结构
- [x] 模型路由系统 (Rust)
- [x] 前端 UI 组件
- [ ] Hermes Agent Python 集成
- [ ] 技能管理系统
- [ ] 记忆浏览器
- [ ] 自动更新

## 🤝 致谢

- [OpenClaw Desktop](https://github.com/daxiondi/openclaw-desktop) - 基础框架
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) - Agent 核心
- [Tauri](https://tauri.app/) - 桌面应用框架

## 📄 许可证

MIT License
