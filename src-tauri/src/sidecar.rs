//! Sidecar management for Python agent.
//!
//! This module handles spawning and communicating with the Python agent sidecar.

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU16, Ordering};
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Default port for the Python agent
const DEFAULT_AGENT_PORT: u16 = 19820;

/// AI configuration for requests to the agent
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentAiConfig {
    pub base_url: String,
    pub api_key: String,
    pub model_name: String,
}

/// Request to generate SOP
#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateSopRequest {
    pub prompt: String,
    pub config: AgentAiConfig,
}

/// A single step in the SOP
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentSopStep {
    pub step_type: String,
    pub label: String,
    pub content: Option<String>,
}

/// Generated SOP response
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentGeneratedSop {
    pub title: String,
    pub steps: Vec<AgentSopStep>,
}

/// Health check response
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

/// State for managing the sidecar process
pub struct SidecarState {
    pub port: AtomicU16,
    pub is_running: AtomicBool,
    pub http_client: reqwest::Client,
}

impl Default for SidecarState {
    fn default() -> Self {
        Self {
            port: AtomicU16::new(DEFAULT_AGENT_PORT),
            is_running: AtomicBool::new(false),
            http_client: reqwest::Client::new(),
        }
    }
}

impl SidecarState {
    pub fn new() -> Self {
        Self::default()
    }

    /// Get the base URL for the agent API
    pub fn get_base_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port.load(Ordering::Relaxed))
    }

    /// Check if the agent is healthy
    pub async fn check_health(&self) -> bool {
        let url = format!("{}/health", self.get_base_url());
        match self.http_client.get(&url).send().await {
            Ok(resp) => resp.status().is_success(),
            Err(_) => false,
        }
    }

    /// Wait for the agent to become healthy
    pub async fn wait_for_healthy(&self, max_attempts: u32) -> Result<(), String> {
        for i in 0..max_attempts {
            if self.check_health().await {
                return Ok(());
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            if i % 4 == 0 {
                eprintln!("Waiting for agent to start... attempt {}/{}", i + 1, max_attempts);
            }
        }
        Err("Agent failed to start within timeout".to_string())
    }

    /// Generate SOP using the Python agent
    pub async fn generate_sop(
        &self,
        prompt: String,
        config: AgentAiConfig,
    ) -> Result<AgentGeneratedSop, String> {
        let url = format!("{}/generate-sop", self.get_base_url());
        let request = GenerateSopRequest { prompt, config };

        let response = self
            .http_client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send request to agent: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Agent returned error: {}", error_text));
        }

        response
            .json::<AgentGeneratedSop>()
            .await
            .map_err(|e| format!("Failed to parse agent response: {}", e))
    }
}

/// Spawn the Python agent sidecar
pub async fn spawn_agent_sidecar(app: &tauri::AppHandle) -> Result<(), String> {
    let sidecar_state = app.state::<SidecarState>();

    // Check if already running
    if sidecar_state.is_running.load(Ordering::Relaxed) {
        if sidecar_state.check_health().await {
            return Ok(());
        }
    }

    let port = sidecar_state.port.load(Ordering::Relaxed);
    eprintln!("Spawning Python agent on port {}...", port);

    // Get the sidecar command
    let shell = app.shell();
    let sidecar_command = shell
        .sidecar("zop-agent")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args([port.to_string()]);

    // Spawn the sidecar
    let (mut _rx, _child) = sidecar_command
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    // Wait for the agent to become healthy
    sidecar_state.wait_for_healthy(20).await?;

    sidecar_state.is_running.store(true, Ordering::Relaxed);
    eprintln!("Python agent started successfully!");

    Ok(())
}
