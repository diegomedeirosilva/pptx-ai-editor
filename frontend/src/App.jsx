import React, { useState } from 'react';
import FileUploader from './components/FileUploader/FileUploader';
import SlidePreview from './components/SlidePreview/SlidePreview';
import InstructionInput from './components/InstructionInput/InstructionInput';
import ProcessingStatus from './components/ProcessingStatus/ProcessingStatus';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('upload');
  const [slideData, setSlideData] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setError(null);
    setSlideData(null);
    setAiResponse(null);
    setDownloadUrl(null);
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!instructions.trim()) {
      setError('Please enter instructions for editing the slide');
      return;
    }

    setProcessing(true);
    setProcessingStep('upload');
    setError(null);
    setAiResponse(null);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('slide', file);
    formData.append('instructions', instructions);

    try {
      setProcessingStep('parse');

      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      setProcessingStep('ai');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProcessingStep('modify');
      setSlideData(data.slideData);
      setAiResponse(data.aiResponse);

      setProcessingStep('generate');
      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setInstructions('');
    setSlideData(null);
    setAiResponse(null);
    setDownloadUrl(null);
    setError(null);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(`${API_URL}${downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PPTX AI Editor</h1>
        <p>Upload a slide, describe your changes, and download the result</p>
      </header>

      <main className="app-main">
        <FileUploader onFileUpload={handleFileUpload} file={file} />

        <InstructionInput
          value={instructions}
          onChange={setInstructions}
          disabled={processing}
        />

        {error && <div className="error-message">{error}</div>}

        <ProcessingStatus isProcessing={processing} currentStep={processingStep} />

        {!processing && (
          <button
            className="submit-button"
            onClick={handleProcess}
            disabled={!file || !instructions.trim()}
          >
            Process Slide
          </button>
        )}

        {aiResponse && (
          <div className="ai-response">
            <h3>AI Interpretation</h3>
            <p className="ai-explanation">{aiResponse.explanation}</p>

            {aiResponse.operations && aiResponse.operations.length > 0 && (
              <div className="operations-list">
                <h4>Applied Operations:</h4>
                {aiResponse.operations.map((op, index) => (
                  <div key={index} className="operation-item">
                    <span className="operation-type">{op.type}</span>
                    <span className="operation-details">
                      {op.target?.identifier || op.target?.elementType || 'element'}:
                      {op.changes?.text && ` text="${op.changes.text}"`}
                      {op.changes?.color && ` color=${op.changes.color}`}
                      {op.changes?.fontSize && ` size=${op.changes.fontSize}pt`}
                      {op.changes?.fontFamily && ` font=${op.changes.fontFamily}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {downloadUrl && (
              <button className="download-button" onClick={handleDownload}>
                Download Modified Slide
              </button>
            )}
          </div>
        )}

        {slideData && <SlidePreview slideData={slideData} />}

        {(slideData || aiResponse) && (
          <button className="reset-button" onClick={handleReset}>
            Start Over
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
