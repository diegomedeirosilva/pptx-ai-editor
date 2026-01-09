import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUploader.css';

function FileUploader({ onFileUpload, file }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    multiple: false
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="file-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="file-info">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="file-name">{file.name}</p>
            <p className="file-size">{formatFileSize(file.size)}</p>
            <p className="file-hint">Click or drag to replace</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
              </svg>
            </div>
            <p className="upload-text">
              {isDragActive
                ? 'Drop your PPTX file here'
                : 'Drag & drop a PowerPoint file, or click to select'}
            </p>
            <span className="file-hint">Only .pptx files are accepted</span>
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="rejection-message">
          Only .pptx files are allowed. Please select a valid PowerPoint file.
        </div>
      )}
    </div>
  );
}

export default FileUploader;
