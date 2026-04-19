use super::types::*;
use reqwest::Client;
use std::time::Duration;

pub struct OllamaClient {
    client: Client,
    endpoint: String,
}

impl OllamaClient {
    pub fn new(endpoint: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();
        
        Self { client, endpoint }
    }

    pub async fn is_available(&self) -> bool {
        match self.client
            .get(format!("{}/api/tags", self.endpoint))
            .send()
            .await
        {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    pub async fn list_models(&self) -> Result<Vec<OllamaModel>, String> {
        let response = self.client
            .get(format!("{}/api/tags", self.endpoint))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch models: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Ollama returned status: {}", response.status()));
        }

        let data: OllamaTagsResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(data.models)
    }

    pub async fn chat(&self, model: &str, request: ChatRequest) -> Result<ChatResponse, String> {
        let body = serde_json::json!({
            "model": model,
            "messages": request.messages,
            "stream": false,
            "options": {
                "temperature": request.temperature.unwrap_or(0.7),
            }
        });

        let response = self.client
            .post(format!("{}/api/chat", self.endpoint))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Ollama returned status: {}", response.status()));
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let message = ChatMessage {
            role: data["message"]["role"]
                .as_str()
                .unwrap_or("assistant")
                .to_string(),
            content: data["message"]["content"]
                .as_str()
                .unwrap_or("")
                .to_string(),
        };

        Ok(ChatResponse {
            message,
            model: model.to_string(),
            usage: None,
        })
    }

    pub async fn chat_stream(
        &self,
        model: &str,
        request: ChatRequest,
    ) -> Result<reqwest::Response, String> {
        let body = serde_json::json!({
            "model": model,
            "messages": request.messages,
            "stream": true,
            "options": {
                "temperature": request.temperature.unwrap_or(0.7),
            }
        });

        let response = self.client
            .post(format!("{}/api/chat", self.endpoint))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Ollama returned status: {}", response.status()));
        }

        Ok(response)
    }

    pub fn get_recommended_model(&self, models: &[OllamaModel]) -> Option<String> {
        // Priority order for local models
        let priorities = vec![
            "llama3.1",
            "llama3",
            "qwen2.5",
            "qwen2",
            "mistral",
            "mixtral",
            "gemma2",
            "phi4",
        ];

        for priority in priorities {
            if let Some(model) = models.iter().find(|m| m.model.contains(priority)) {
                return Some(model.model.clone());
            }
        }

        models.first().map(|m| m.model.clone())
    }
}
