import { useState, useEffect } from "react";
import { ModelSelector, ChatInterface } from "./components";
import { useModelStore } from "./stores/modelStore";
import { useChatStore } from "./stores/chatStore";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'skills' | 'memory' | 'settings'>('chat');
  
  const { checkOllamaStatus } = useModelStore();
  const { createConversation, conversations } = useChatStore();

  // Initialize
  useEffect(() => {
    checkOllamaStatus();
    if (conversations.length === 0) {
      createConversation();
    }
  }, []);

  return (
    <div className="hermes-app">
      {/* Header */}
      <header className="app-header">
        <div className="app-branding">
          <span className="app-icon">🧠</span>
          <h1>Hermes Agent Desktop</h1>
        </div>
        <ModelSelector />
      </header>

      {/* Main Content */}
      <div className="app-body">
        {/* Sidebar */}
        <nav className="app-sidebar">
          <button 
            className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span>💬</span>
            <span>对话</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <span>🛠️</span>
            <span>技能</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            <span>🧠</span>
            <span>记忆</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span>⚙️</span>
            <span>设置</span>
          </button>
        </nav>

        {/* Content Area */}
        <main className="app-content">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'skills' && <SkillsPanel />}
          {activeTab === 'memory' && <MemoryPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

// Placeholder components
function SkillsPanel() {
  return (
    <div className="panel">
      <h2>🛠️ 技能管理</h2>
      <p>Hermes Agent 会自动从对话中学习并创建技能。</p>
      <div className="skills-list">
        <div className="skill-item">
          <h4>代码生成</h4>
          <p>自动生成各种编程语言的代码片段</p>
        </div>
        <div className="skill-item">
          <h4>文档分析</h4>
          <p>分析文档内容并提取关键信息</p>
        </div>
      </div>
    </div>
  );
}

function MemoryPanel() {
  return (
    <div className="panel">
      <h2>🧠 记忆浏览器</h2>
      <p>跨会话记忆和用户建模。</p>
      <div className="memory-list">
        <div className="memory-item">
          <span className="memory-type">用户偏好</span>
          <p>喜欢简洁的回答</p>
        </div>
        <div className="memory-item">
          <span className="memory-type">技术栈</span>
          <p>主要使用 Python 和 TypeScript</p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="panel">
      <h2>⚙️ 设置</h2>
      <div className="settings-section">
        <h3>API 配置</h3>
        <div className="setting-item">
          <label>OpenAI API Key</label>
          <input type="password" placeholder="sk-..." />
        </div>
        <div className="setting-item">
          <label>Anthropic API Key</label>
          <input type="password" placeholder="sk-ant-..." />
        </div>
      </div>
      <div className="settings-section">
        <h3>Ollama 配置</h3>
        <div className="setting-item">
          <label>端点地址</label>
          <input type="text" defaultValue="http://localhost:11434" />
        </div>
      </div>
    </div>
  );
}
