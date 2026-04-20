import { useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './FileUploader.css';

export interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  path: string;
  content?: string;
  thumbnail?: string;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 20 * 1024 * 1024, // 20MB
};

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

export function FileUploader({ onFilesUploaded, maxFiles = 5 }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File): 'image' | 'video' | 'document' | null => {
    if (ALLOWED_TYPES.image.includes(file.type)) return 'image';
    if (ALLOWED_TYPES.video.includes(file.type)) return 'video';
    if (ALLOWED_TYPES.document.includes(file.type)) return 'document';
    
    // Fallback to extension detection
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) return 'image';
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext || '')) return 'video';
    if (['pdf', 'txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'document';
    
    return null;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const type = detectFileType(file);
    
    if (!type) {
      return { valid: false, error: `不支持的文件类型: ${file.type || file.name}` };
    }

    const maxSize = MAX_FILE_SIZE[type];
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return { valid: false, error: `文件过大: ${file.name} (最大 ${maxSizeMB}MB)` };
    }

    return { valid: true };
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    const type = detectFileType(file)!;
    const id = Math.random().toString(36).substring(2, 15);
    
    // Generate thumbnail for images
    let thumbnail: string | undefined;
    if (type === 'image') {
      thumbnail = await generateImageThumbnail(file);
    }

    // For documents, try to extract text content
    let content: string | undefined;
    if (type === 'document' && file.type === 'text/plain') {
      content = await file.text();
    }

    return {
      id,
      name: file.name,
      type,
      size: file.size,
      path: file.name, // In real implementation, this would be the saved path
      content,
      thumbnail,
    };
  };

  const generateImageThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const fileArray = Array.from(files).slice(0, maxFiles);
      const uploadedFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error);
          continue;
        }

        const uploadedFile = await processFile(file);
        uploadedFiles.push(uploadedFile);
      }

      if (uploadedFiles.length > 0) {
        onFilesUploaded(uploadedFiles);
      }
    } catch (err) {
      setError(`上传失败: ${err}`);
    } finally {
      setUploading(false);
    }
  }, [maxFiles, onFilesUploaded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="file-uploader">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[...ALLOWED_TYPES.image, ...ALLOWED_TYPES.video, ...ALLOWED_TYPES.document].join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-icon">
          {uploading ? '⏳' : '📎'}
        </div>
        <div className="upload-text">
          {uploading ? '处理中...' : '点击或拖拽上传文件'}
        </div>
        <div className="upload-hint">
          支持图片、视频、文档 (图片≤10MB, 视频≤100MB, 文档≤20MB)
        </div>
      </div>

      {error && (
        <div className="upload-error">
          ❌ {error}
        </div>
      )}
    </div>
  );
}

// File preview component for uploaded files
export function FilePreview({ file, onRemove }: { file: UploadedFile; onRemove?: () => void }) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  return (
    <div className="file-preview">
      {file.type === 'image' && file.thumbnail ? (
        <img src={file.thumbnail} alt={file.name} className="file-thumbnail" />
      ) : (
        <div className="file-icon">{getFileIcon(file.type)}</div>
      )}
      
      <div className="file-info">
        <span className="file-name" title={file.name}>
          {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
        </span>
        <span className="file-size">{formatFileSize(file.size)}</span>
      </div>
      
      {onRemove && (
        <button className="file-remove" onClick={onRemove} title="移除文件">
          ✕
        </button>
      )}
    </div>
  );
}
