use super::types::*;
use reqwest::Client;
use std::time::Duration;

pub struct OpenAIClient {
    client: Client,
    api_key: String,
    base_url: String,
}

impl OpenAIClient {
    pub fn new(api_key: String, base_url: Option<String>) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();

        let base_url = base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());
        
        Self { client, api_key, base_url }
    }

    pub async fn chat(&self, model: &str, request: ChatRequest) -> Result<ChatResponse, String> {
        let body = serde_json::json!({
            "model": model,
            "messages": request.messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "stream": false,
        });

        let response = self.client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("OpenAI API error: {}", error_text));
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let message = ChatMessage {
            role: data["choices"][0]["message"]["role"]
                .as_str()
                .unwrap_or("assistant")
                .to_string(),
            content: data["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("")
                .to_string(),
        };

        let usage = data["usage"].as_object().map(|u| Usage {
            prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
        });

        Ok(ChatResponse {
            message,
            model: model.to_string(),
            usage,
        })
    }

    #[allow(dead_code)]
    pub async fn chat_stream(
        &self,
        model: &str,
        request: ChatRequest,
    ) -> Result<reqwest::Response, String> {
        let body = serde_json::json!({
            "model": model,
            "messages": request.messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "stream": true,
        });

        let response = self.client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("OpenAI API error: {}", error_text));
        }

        Ok(response)
    }

    #[allow(dead_code)]
    pub async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        let response = self.client
            .get(format!("{}/models", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch models: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("OpenAI API returned status: {}", response.status()));
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let models: Vec<ModelInfo> = data["data"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|m| {
                let id = m["id"].as_str()?;
                Some(ModelInfo {
                    id: id.to_string(),
                    name: id.to_string(),
                    provider: "openai".to_string(),
                    description: String::new(),
                    context_length: 8192,
                    capabilities: vec!["chat".to_string()],
                })
            })
            .collect();

        Ok(models)
    }
}

pub struct AnthropicClient {
    client: Client,
    api_key: String,
}

impl AnthropicClient {
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();

        Self { client, api_key }
    }

    pub async fn chat(&self, model: &str, request: ChatRequest) -> Result<ChatResponse, String> {
        // Convert messages to Anthropic format
        let mut system = String::new();
        let mut messages = vec![];

        for msg in &request.messages {
            if msg.role == "system" {
                system = msg.content.clone();
            } else {
                messages.push(serde_json::json!({
                    "role": msg.role,
                    "content": msg.content,
                }));
            }
        }

        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "system": system,
            "temperature": request.temperature.unwrap_or(0.7),
            "max_tokens": 4096,
        });

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Anthropic API error: {}", error_text));
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = data["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let message = ChatMessage {
            role: "assistant".to_string(),
            content,
        };

        let usage = data["usage"].as_object().map(|u| Usage {
            prompt_tokens: u["input_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["output_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: (u["input_tokens"].as_u64().unwrap_or(0) + u["output_tokens"].as_u64().unwrap_or(0)) as u32,
        });

        Ok(ChatResponse {
            message,
            model: model.to_string(),
            usage,
        })
    }
}
