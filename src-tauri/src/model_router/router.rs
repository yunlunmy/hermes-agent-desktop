use super::ollama::OllamaClient;
use super::openai::{AnthropicClient, OpenAIClient};
use super::types::*;
use std::sync::{Arc, Mutex};

pub struct ModelRouter {
    config: Arc<Mutex<RouterConfig>>,
    ollama: Option<OllamaClient>,
    openai: Option<OpenAIClient>,
    anthropic: Option<AnthropicClient>,
}

impl ModelRouter {
    pub fn new(config: RouterConfig) -> Self {
        let ollama = Some(OllamaClient::new(config.ollama_endpoint.clone()));
        
        let openai = config.openai_api_key.as_ref().map(|key| {
            OpenAIClient::new(key.clone(), None)
        });

        let anthropic = config.anthropic_api_key.as_ref().map(|key| {
            AnthropicClient::new(key.clone())
        });

        Self {
            config: Arc::new(Mutex::new(config)),
            ollama,
            openai,
            anthropic,
        }
    }

    pub fn update_config(&self, config: RouterConfig) {
        let mut cfg = self.config.lock().unwrap();
        *cfg = config;
    }

    pub fn get_config(&self) -> RouterConfig {
        self.config.lock().unwrap().clone()
    }

    pub async fn chat(&self, request: ChatRequest) -> Result<ChatResponse, String> {
        let config = self.get_config();
        
        match &config.mode {
            ModelMode::Smart => self.smart_route(request).await,
            ModelMode::Local => self.local_chat(request).await,
            ModelMode::Cloud => self.cloud_chat(request).await,
            ModelMode::Manual(model) => self.manual_chat(model, request).await,
        }
    }

    async fn smart_route(&self, request: ChatRequest) -> Result<ChatResponse, String> {
        let _config = self.get_config();
        let task_type = self.analyze_task(&request);
        
        // Check if Ollama is available for simple tasks
        if let Some(ollama) = &self.ollama {
            if ollama.is_available().await {
                match task_type {
                    TaskType::SimpleQA | TaskType::GeneralChat => {
                        if let Ok(models) = ollama.list_models().await {
                            if let Some(model) = ollama.get_recommended_model(&models) {
                                return ollama.chat(&model, request).await;
                            }
                        }
                    }
                    _ => {}
                }
            }
        }

        // For complex tasks, use cloud models
        match task_type {
            TaskType::Code | TaskType::Reasoning => {
                // Prefer Claude for code tasks
                if let Some(anthropic) = &self.anthropic {
                    return anthropic.chat("claude-3-sonnet-20240229", request).await;
                }
                // Fall back to GPT-4
                if let Some(openai) = &self.openai {
                    return openai.chat("gpt-4", request).await;
                }
            }
            TaskType::LongContext => {
                if let Some(openai) = &self.openai {
                    return openai.chat("gpt-4-turbo-preview", request).await;
                }
            }
            _ => {}
        }

        // Default fallback
        self.cloud_chat(request).await
    }

    async fn local_chat(&self, request: ChatRequest) -> Result<ChatResponse, String> {
        let config = self.get_config();
        
        if let Some(ollama) = &self.ollama {
            if ollama.is_available().await {
                let models = ollama.list_models().await?;
                let model = ollama.get_recommended_model(&models)
                    .unwrap_or_else(|| config.default_local_model.clone());
                return ollama.chat(&model, request).await;
            }
        }

        Err("Ollama is not available. Please make sure Ollama is running.".to_string())
    }

    async fn cloud_chat(&self, request: ChatRequest) -> Result<ChatResponse, String> {
        let config = self.get_config();

        // Try OpenAI first
        if let Some(openai) = &self.openai {
            return openai.chat(&config.default_cloud_model, request).await;
        }

        // Try Anthropic
        if let Some(anthropic) = &self.anthropic {
            return anthropic.chat("claude-3-sonnet-20240229", request).await;
        }

        Err("No cloud API configured. Please add an API key in settings.".to_string())
    }

    async fn manual_chat(&self, model: &str, request: ChatRequest) -> Result<ChatResponse, String> {
        // Check if it's an Ollama model
        if model.contains(":") || model.starts_with("llama") || model.starts_with("qwen") 
            || model.starts_with("mistral") || model.starts_with("gemma") {
            if let Some(ollama) = &self.ollama {
                return ollama.chat(model, request).await;
            }
        }

        // Check for OpenAI models
        if model.starts_with("gpt-") {
            if let Some(openai) = &self.openai {
                return openai.chat(model, request).await;
            }
        }

        // Check for Anthropic models
        if model.starts_with("claude-") {
            if let Some(anthropic) = &self.anthropic {
                return anthropic.chat(model, request).await;
            }
        }

        // Try Ollama as fallback
        if let Some(ollama) = &self.ollama {
            return ollama.chat(model, request).await;
        }

        Err(format!("Model '{}' is not available. Please check your configuration.", model))
    }

    fn analyze_task(&self, request: &ChatRequest) -> TaskType {
        let content = request.messages.iter()
            .map(|m| m.content.clone())
            .collect::<Vec<_>>()
            .join(" ");

        let content_lower = content.to_lowercase();

        // Code-related keywords
        let code_keywords = ["code", "function", "programming", "debug", "error", "python", "javascript", "rust", "java", "c++"];
        for keyword in &code_keywords {
            if content_lower.contains(keyword) {
                return TaskType::Code;
            }
        }

        // Reasoning keywords
        let reasoning_keywords = ["analyze", "compare", "evaluate", "reason", "logic", "solve", "math"];
        for keyword in &reasoning_keywords {
            if content_lower.contains(keyword) {
                return TaskType::Reasoning;
            }
        }

        // Check message length for long context
        let total_length: usize = request.messages.iter().map(|m| m.content.len()).sum();
        if total_length > 8000 {
            return TaskType::LongContext;
        }

        // Simple questions
        let simple_keywords = ["what", "who", "when", "where", "how are you", "hello", "hi"];
        for keyword in &simple_keywords {
            if content_lower.starts_with(keyword) || content_lower.contains(keyword) {
                return TaskType::SimpleQA;
            }
        }

        TaskType::GeneralChat
    }

    pub async fn list_available_models(&self) -> Result<Vec<ModelInfo>, String> {
        let mut all_models = vec![];

        // Add Ollama models
        if let Some(ollama) = &self.ollama {
            if ollama.is_available().await {
                if let Ok(models) = ollama.list_models().await {
                    for model in models {
                        all_models.push(ModelInfo {
                            id: model.model.clone(),
                            name: model.name.clone(),
                            provider: "ollama".to_string(),
                            description: format!("Local model: {}", model.parameter_size.as_deref().unwrap_or("unknown")),
                            context_length: 8192,
                            capabilities: vec!["chat".to_string(), "local".to_string()],
                        });
                    }
                }
            }
        }

        // Add cloud models
        let cloud_models = vec![
            ModelInfo {
                id: "gpt-4".to_string(),
                name: "GPT-4".to_string(),
                provider: "openai".to_string(),
                description: "OpenAI GPT-4".to_string(),
                context_length: 8192,
                capabilities: vec!["chat".to_string(), "code".to_string()],
            },
            ModelInfo {
                id: "gpt-4-turbo-preview".to_string(),
                name: "GPT-4 Turbo".to_string(),
                provider: "openai".to_string(),
                description: "OpenAI GPT-4 Turbo (128K context)".to_string(),
                context_length: 128000,
                capabilities: vec!["chat".to_string(), "code".to_string(), "long-context".to_string()],
            },
            ModelInfo {
                id: "gpt-3.5-turbo".to_string(),
                name: "GPT-3.5 Turbo".to_string(),
                provider: "openai".to_string(),
                description: "OpenAI GPT-3.5 Turbo".to_string(),
                context_length: 16385,
                capabilities: vec!["chat".to_string()],
            },
            ModelInfo {
                id: "claude-3-opus-20240229".to_string(),
                name: "Claude 3 Opus".to_string(),
                provider: "anthropic".to_string(),
                description: "Anthropic Claude 3 Opus".to_string(),
                context_length: 200000,
                capabilities: vec!["chat".to_string(), "code".to_string(), "long-context".to_string()],
            },
            ModelInfo {
                id: "claude-3-sonnet-20240229".to_string(),
                name: "Claude 3 Sonnet".to_string(),
                provider: "anthropic".to_string(),
                description: "Anthropic Claude 3 Sonnet".to_string(),
                context_length: 200000,
                capabilities: vec!["chat".to_string(), "code".to_string(), "long-context".to_string()],
            },
            ModelInfo {
                id: "claude-3-haiku-20240307".to_string(),
                name: "Claude 3 Haiku".to_string(),
                provider: "anthropic".to_string(),
                description: "Anthropic Claude 3 Haiku".to_string(),
                context_length: 200000,
                capabilities: vec!["chat".to_string()],
            },
        ];

        all_models.extend(cloud_models);

        Ok(all_models)
    }

    pub async fn check_ollama_status(&self) -> OllamaStatus {
        if let Some(ollama) = &self.ollama {
            let reachable = ollama.is_available().await;
            let models = if reachable {
                ollama.list_models().await.unwrap_or_default()
                    .into_iter()
                    .map(|m| m.model)
                    .collect()
            } else {
                vec![]
            };

            OllamaStatus {
                endpoint: self.get_config().ollama_endpoint,
                reachable,
                models,
                error: if !reachable {
                    Some("Ollama is not running".to_string())
                } else {
                    None
                },
            }
        } else {
            OllamaStatus {
                endpoint: self.get_config().ollama_endpoint,
                reachable: false,
                models: vec![],
                error: Some("Ollama client not initialized".to_string()),
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum TaskType {
    SimpleQA,
    GeneralChat,
    Code,
    Reasoning,
    LongContext,
}
