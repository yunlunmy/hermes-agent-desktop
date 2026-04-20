import { useState, useEffect } from "react";
import { ModelSelector, ChatInterface, FileUploader, FilePreview } from "./components";
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
  const [activeTab, setActiveTab] = useState<'general' | 'browser' | 'api' | 'relay' | 'feishu'>('general');
  const [browserMode, setBrowserMode] = useState<'openclaw' | 'chrome'>('openclaw');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [relayStatus, setRelayStatus] = useState<{ installed: boolean; path?: string } | null>(null);
  const [feishuConfig, setFeishuConfig] = useState({ appId: '', appSecret: '' });

  // Load settings on mount
  useEffect(() => {
    // In production, these would load from Tauri store
    checkRelayStatus();
  }, []);

  const checkRelayStatus = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke('get_browser_relay_status');
      setRelayStatus(status as any);
    } catch (e) {
      console.error('Failed to check relay status:', e);
    }
  };

  const saveSettings = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_router_config', {
        config: {
          ollamaEndpoint,
          openaiApiKey: openaiKey,
          anthropicApiKey: anthropicKey,
        }
      });
      alert('设置已保存');
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  return (
    <div className="settings-panel">
      <h2>⚙️ 设置</h2>
      
      {/* Settings Tabs */}
      <div className="settings-tabs">
        <button 
          className={activeTab === 'general' ? 'active' : ''}
          onClick={() => setActiveTab('general')}
        >
          通用
        </button>
        <button 
          className={activeTab === 'browser' ? 'active' : ''}
          onClick={() => setActiveTab('browser')}
        >
          浏览器
        </button>
        <button 
          className={activeTab === 'api' ? 'active' : ''}
          onClick={() => setActiveTab('api')}
        >
          API 配置
        </button>
        <button 
          className={activeTab === 'relay' ? 'active' : ''}
          onClick={() => setActiveTab('relay')}
        >
          中继扩展
        </button>
        <button 
          className={activeTab === 'feishu' ? 'active' : ''}
          onClick={() => setActiveTab('feishu')}
        >
          飞书
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="settings-section">
          <h3>通用设置</h3>
          <div className="setting-item">
            <label>Ollama 端点地址</label>
            <input 
              type="text" 
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <p className="setting-hint">本地 Ollama 服务的地址</p>
          </div>
        </div>
      )}

      {/* Browser Settings */}
      {activeTab === 'browser' && (
        <div className="settings-section">
          <h3>浏览器模式</h3>
          <div className="setting-item">
            <label className="radio-label">
              <input 
                type="radio" 
                name="browser-mode"
                checked={browserMode === 'openclaw'}
                onChange={() => setBrowserMode('openclaw')}
              />
              <div>
                <strong>OpenClaw 模式</strong>
                <p className="setting-hint">使用 OpenClaw 内置浏览器，支持更多自动化功能</p>
              </div>
            </label>
          </div>
          <div className="setting-item">
            <label className="radio-label">
              <input 
                type="radio" 
                name="browser-mode"
                checked={browserMode === 'chrome'}
                onChange={() => setBrowserMode('chrome')}
              />
              <div>
                <strong>Chrome 模式</strong>
                <p className="setting-hint">使用系统 Chrome 浏览器</p>
              </div>
            </label>
          </div>
          <button className="save-btn" onClick={saveSettings}>
            保存浏览器设置
          </button>
        </div>
      )}

      {/* API Settings */}
      {activeTab === 'api' && (
        <div className="settings-section">
          <h3>API 配置</h3>
          <div className="setting-item">
            <label>OpenAI API Key</label>
            <input 
              type="password" 
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="setting-hint">用于访问 GPT-4 等 OpenAI 模型</p>
          </div>
          <div className="setting-item">
            <label>Anthropic API Key</label>
            <input 
              type="password" 
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <p className="setting-hint">用于访问 Claude 等 Anthropic 模型</p>
          </div>
          <button className="save-btn" onClick={saveSettings}>
            保存 API 配置
          </button>
        </div>
      )}

      {/* Relay Settings */}
      {activeTab === 'relay' && (
        <div className="settings-section">
          <h3>浏览器中继扩展</h3>
          <div className="setting-item">
            <p>状态: {relayStatus?.installed ? '✅ 已安装' : '❌ 未安装'}</p>
            {relayStatus?.path && (
              <p className="setting-hint">路径: {relayStatus.path}</p>
            )}
          </div>
          <div className="setting-actions">
            <button onClick={checkRelayStatus}>刷新状态</button>
            <button onClick={async () => {
              try {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('prepare_browser_relay');
                checkRelayStatus();
              } catch (e) {
                alert('安装失败: ' + e);
              }
            }}>
              安装扩展
            </button>
          </div>
          <div className="help-text">
            <h4>安装步骤:</h4>
            <ol>
              <li>点击"安装扩展"按钮</li>
              <li>打开 Chrome 浏览器</li>
              <li>进入 chrome://extensions/</li>
              <li>开启"开发者模式"</li>
              <li>加载已解压的扩展程序</li>
            </ol>
          </div>
        </div>
      )}

      {/* Feishu Settings */}
      {activeTab === 'feishu' && (
        <div className="settings-section">
          <h3>飞书渠道配置</h3>
          <div className="setting-item">
            <label>App ID</label>
            <input 
              type="text" 
              value={feishuConfig.appId}
              onChange={(e) => setFeishuConfig({...feishuConfig, appId: e.target.value})}
              placeholder="cli_xxxxxxxx"
            />
          </div>
          <div className="setting-item">
            <label>App Secret</label>
            <input 
              type="password" 
              value={feishuConfig.appSecret}
              onChange={(e) => setFeishuConfig({...feishuConfig, appSecret: e.target.value})}
              placeholder="输入 App Secret"
            />
          </div>
          <button className="save-btn" onClick={async () => {
            try {
              const { invoke } = await import('@tauri-apps/api/core');
              await invoke('save_feishu_channel_config', {
                appId: feishuConfig.appId,
                appSecret: feishuConfig.appSecret
              });
              alert('飞书配置已保存');
            } catch (e) {
              alert('保存失败: ' + e);
            }
          }}>
            保存飞书配置
          </button>
        </div>
      )}
    </div>
  );
}
