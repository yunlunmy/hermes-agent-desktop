import { useEffect, useState } from 'react';
import { useModelStore, ModelMode } from '../../stores/modelStore';
import './ModelSelector.css';

const modeLabels: Record<ModelMode, { label: string; icon: string; description: string }> = {
  smart: { label: '智能模式', icon: '🧠', description: '根据任务自动选择最优模型' },
  local: { label: '本地模式', icon: '🏠', description: '仅使用本地 Ollama 模型' },
  cloud: { label: '云端模式', icon: '☁️', description: '仅使用云端 API' },
  manual: { label: '手动模式', icon: '⚙️', description: '手动指定模型' },
};

export function ModelSelector() {
  const { 
    mode, 
    availableModels, 
    ollamaStatus, 
    error,
    setMode, 
    fetchAvailableModels, 
    checkOllamaStatus 
  } = useModelStore();
  
  const [selectedManualModel, setSelectedManualModel] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchAvailableModels();
    checkOllamaStatus();
  }, []);

  const handleModeChange = async (newMode: ModelMode) => {
    if (newMode === 'manual' && selectedManualModel) {
      await setMode(newMode, selectedManualModel);
    } else {
      await setMode(newMode);
    }
  };

  const localModels = availableModels.filter(m => m.provider === 'ollama');
  const cloudModels = availableModels.filter(m => m.provider !== 'ollama');

  return (
    <div className="model-selector">
      <div className="model-selector-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="model-mode-icon">{modeLabels[mode].icon}</span>
        <span className="model-mode-label">{modeLabels[mode].label}</span>
        <span className="model-selector-arrow">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="model-selector-dropdown">
          <div className="model-modes">
            {(Object.keys(modeLabels) as ModelMode[]).map((m) => (
              <button
                key={m}
                className={`model-mode-btn ${mode === m ? 'active' : ''}`}
                onClick={() => handleModeChange(m)}
              >
                <span className="mode-icon">{modeLabels[m].icon}</span>
                <div className="mode-info">
                  <span className="mode-label">{modeLabels[m].label}</span>
                  <span className="mode-desc">{modeLabels[m].description}</span>
                </div>
              </button>
            ))}
          </div>

          {mode === 'manual' && (
            <div className="manual-model-select">
              <label>选择模型：</label>
              <select 
                value={selectedManualModel} 
                onChange={(e) => {
                  setSelectedManualModel(e.target.value);
                  setMode('manual', e.target.value);
                }}
              >
                <option value="">-- 选择模型 --</option>
                
                {localModels.length > 0 && (
                  <optgroup label="本地模型 (Ollama)">
                    {localModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {cloudModels.length > 0 && (
                  <optgroup label="云端模型">
                    {cloudModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="ollama-status">
            <h4>Ollama 状态</h4>
            {ollamaStatus ? (
              <div className={`status-indicator ${ollamaStatus.reachable ? 'online' : 'offline'}`}>
                <span className="status-dot" />
                {ollamaStatus.reachable ? (
                  <span>在线 - 发现 {ollamaStatus.models.length} 个模型</span>
                ) : (
                  <span>离线 - {ollamaStatus.error || 'Ollama 未运行'}</span>
                )}
              </div>
            ) : (
              <span>检查中...</span>
            )}
          </div>

          {error && (
            <div className="model-selector-error">
              ❌ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
