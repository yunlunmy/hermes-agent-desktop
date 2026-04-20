import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useModelStore } from '../../stores/modelStore';
import { ChatMessage } from './ChatMessage';
import { FileUploader, FilePreview, UploadedFile } from '../FileUploader/FileUploader';
import './ChatInterface.css';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    conversations,
    currentConversationId,
    isGenerating,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    sendMessageWithFiles,
    getCurrentConversation,
  } = useChatStore();
  
  const { mode } = useModelStore();

  const currentConversation = getCurrentConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isGenerating) return;
    
    const content = input.trim();
    setInput('');
    
    if (uploadedFiles.length > 0) {
      await sendMessageWithFiles(content, uploadedFiles);
      setUploadedFiles([]);
      setShowUploader(false);
    } else {
      await sendMessage(content);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const modeLabels: Record<string, { icon: string; label: string }> = {
    smart: { icon: '🧠', label: '智能' },
    local: { icon: '🏠', label: '本地' },
    cloud: { icon: '☁️', label: '云端' },
    manual: { icon: '⚙️', label: '手动' },
  };

  return (
    <div className="chat-interface">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <button className="new-chat-btn" onClick={createConversation}>
          <span>+</span> 新对话
        </button>
        
        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              <span className="conversation-title">{conv.title}</span>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <h2>{currentConversation?.title || '新对话'}</h2>
          <div className="model-indicator">
            <span>{modeLabels[mode]?.icon}</span>
            <span>{modeLabels[mode]?.label}模式</span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {currentConversation?.messages.length === 0 ? (
            <div className="welcome-message">
              <h1>🧠 Hermes Agent</h1>
              <p>我是你的 AI 助手，支持多种模型智能切换</p>
              <div className="quick-actions">
                <button onClick={() => sendMessage('你好，介绍一下你自己')}>
                  👋 自我介绍
                </button>
                <button onClick={() => sendMessage('帮我写一个 Python 快速排序')}>
                  💻 写代码
                </button>
                <button onClick={() => sendMessage('解释什么是机器学习')}>
                  📚 问问题
                </button>
              </div>
            </div>
          ) : (
            currentConversation?.messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))
          )}
          {isGenerating && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          {/* File Upload Button */}
          <button 
            type="button" 
            className="upload-toggle-btn"
            onClick={() => setShowUploader(!showUploader)}
            title="上传文件"
          >
            📎
          </button>

          {/* File Uploader Panel */}
          {showUploader && (
            <div className="file-upload-panel">
              <FileUploader onFilesUploaded={handleFilesUploaded} maxFiles={5 - uploadedFiles.length} />
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              {uploadedFiles.map(file => (
                <FilePreview 
                  key={file.id} 
                  file={file} 
                  onRemove={() => handleRemoveFile(file.id)} 
                />
              ))}
            </div>
          )}

          <form className="chat-input-area" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedFiles.length > 0 ? "添加消息描述（可选）..." : "输入消息... (Enter 发送, Shift+Enter 换行)"}
              rows={1}
              disabled={isGenerating}
            />
            <button 
              type="submit" 
              disabled={(!input.trim() && uploadedFiles.length === 0) || isGenerating}
              className="send-btn"
            >
              {isGenerating ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
