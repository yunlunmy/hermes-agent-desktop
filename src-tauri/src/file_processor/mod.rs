pub mod ocr;
pub mod image_recognition;
pub mod video_analysis;

use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAnalysisResult {
    pub file_type: FileType,
    pub content: String,
    pub metadata: FileMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileType {
    Image,
    Video,
    Document,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration: Option<f64>,
    pub page_count: Option<u32>,
}

pub async fn analyze_file(file_path: &str) -> Result<FileAnalysisResult, String> {
    let path = Path::new(file_path);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        // Images
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" => {
            let result = image_recognition::analyze_image(file_path).await?;
            Ok(FileAnalysisResult {
                file_type: FileType::Image,
                content: result.description,
                metadata: result.metadata,
            })
        }
        // Videos
        "mp4" | "mov" | "avi" | "webm" | "mkv" => {
            let result = video_analysis::analyze_video(file_path).await?;
            Ok(FileAnalysisResult {
                file_type: FileType::Video,
                content: result.description,
                metadata: result.metadata,
            })
        }
        // Documents
        "pdf" | "txt" | "md" | "doc" | "docx" => {
            let content = ocr::extract_text(file_path).await?;
            Ok(FileAnalysisResult {
                file_type: FileType::Document,
                content,
                metadata: FileMetadata {
                    width: None,
                    height: None,
                    duration: None,
                    page_count: None,
                },
            })
        }
        _ => Err(format!("Unsupported file type: {}", ext)),
    }
}

pub fn detect_file_type(file_path: &str) -> FileType {
    let path = Path::new(file_path);
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" => FileType::Image,
        "mp4" | "mov" | "avi" | "webm" | "mkv" => FileType::Video,
        "pdf" | "txt" | "md" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" => {
            FileType::Document
        }
        _ => FileType::Unknown,
    }
}
