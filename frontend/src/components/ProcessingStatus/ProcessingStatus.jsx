import React from 'react';
import './ProcessingStatus.css';

const STEPS = [
  { id: 'upload', label: 'Uploading file' },
  { id: 'parse', label: 'Parsing slide content' },
  { id: 'ai', label: 'AI analyzing instructions' },
  { id: 'modify', label: 'Applying changes' },
  { id: 'generate', label: 'Generating download' }
];

function ProcessingStatus({ isProcessing, currentStep }) {
  if (!isProcessing) return null;

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="processing-status">
      <div className="processing-spinner"></div>
      <div className="processing-steps">
        {STEPS.map((step, index) => {
          let status = 'pending';
          if (index < currentIndex) status = 'completed';
          else if (index === currentIndex) status = 'active';
          
          return (
            <div key={step.id} className={'processing-step ' + status}>
              <div className="step-indicator">
                {index < currentIndex ? '\u2713' : index + 1}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProcessingStatus;
