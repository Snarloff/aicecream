#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures::stream::StreamExt;
use std::{fmt::Debug, time::Duration};

use ollama_rs::{
    generation::{
        chat::{request::ChatMessageRequest, ChatMessage, MessageRole},
        images::Image,
        options::GenerationOptions,
    },
    models::LocalModel,
    Ollama,
};

use serde::{Deserialize, Serialize};
use sysinfo::System;
use tauri::{Emitter, Window};

#[derive(Clone, serde::Serialize)]
struct Payload {
    cpu: String,
    mem: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct ContextMessage {
    pub role: String,
    pub content: String,
    pub image: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct PromptConfig {
    pub language_model: String,
    pub temperature: f32,
    pub top_p: f32,
    pub top_k: u32,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct PayloadContext {
    pub model: String,
    pub message: ContextMessage,
    pub created_at: String,
    pub done: bool,
}

#[tauri::command]
fn init_process(window: Window) {
    std::thread::spawn(move || {
        let mut system = System::new_all();

        loop {
            system.refresh_cpu_usage();
            system.refresh_memory();

            let cpu_usage = system.global_cpu_info().cpu_usage();
            let mem_usage_bytes = system.used_memory();
            let mem_usage_gb_rounded =
                (((mem_usage_bytes as f64) / 1_073_741_824.0) * 10.0).round() / 10.0;

            window
                .emit(
                    "system-usage",
                    Payload {
                        cpu: format!("{:.2}%", cpu_usage),
                        mem: format!("{:.2}GB", mem_usage_gb_rounded),
                    },
                )
                .unwrap();

            std::thread::sleep(Duration::from_secs(3));
        }
    });
}

#[tauri::command]
async fn get_models() -> Result<Vec<LocalModel>, String> {
    let ollama = Ollama::default();

    let models = ollama
        .list_local_models()
        .await
        .map_err(|err| format!("Failed to list local models: {}", err))?;

    Ok(models)
}

#[tauri::command]
async fn send_prompt(
    window: Window,
    config: PromptConfig,
    context: Vec<ContextMessage>,
) -> Result<(), String> {
    let ollama = Ollama::default();
    let mut chat_messages = Vec::<ChatMessage>::with_capacity(context.len());

    for message in context {
        let mut chat_message = match message.role.as_str() {
            "user" => ChatMessage::new(MessageRole::User, message.content),
            "assistant" => ChatMessage::assistant(message.content),
            _ => {
                continue;
            } // Ignora roles não reconhecidos
        };

        if let Some(image) = &message.image {
            chat_message = chat_message.add_image(Image::from_base64(image));
        }

        chat_messages.push(chat_message);
    }

    println!("{:?}", chat_messages);

    let options = GenerationOptions::default()
        .temperature(config.temperature)
        .top_p(config.top_p)
        .top_k(config.top_k);

    let mut stream = ollama
        .send_chat_messages_stream(
            ChatMessageRequest::new(config.language_model, chat_messages).options(options),
        )
        .await
        .unwrap();

    while let Some(chunk) = stream.next().await {
        let res = chunk.map_err(|_| "stream.next error")?;

        if let Some(msg) = res.message {
            window
                .emit(
                    "generate-answer-listener",
                    PayloadContext {
                        model: res.model,
                        created_at: res.created_at,
                        done: res.done,
                        message: ContextMessage {
                            role: serde_json::to_string(&msg.role)
                                .unwrap()
                                .trim_matches('"')
                                .to_string(),
                            content: msg.content.into(),
                            image: None,
                        },
                    },
                )
                .unwrap();
        }

        if res.done {
            break;
        }
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            init_process,
            get_models,
            send_prompt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
