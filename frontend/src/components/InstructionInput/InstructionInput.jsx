import React from 'react';
import './InstructionInput.css';

const EXAMPLE_INSTRUCTIONS = [
  "Make the title blue",
  "Change the title to 'Welcome to Our Presentation'",
  "Make all text larger",
  "Change the font to Arial",
  "Make the body text italic"
];

function InstructionInput({ value, onChange, disabled }) {
  const handleExampleClick = (example) => {
    if (!disabled) {
      onChange(example);
    }
  };

  return (
    <div className="instruction-input">
      <label htmlFor="instructions" className="instruction-label">
        What changes would you like to make?
      </label>

      <textarea
        id="instructions"
        className="instruction-textarea"
        placeholder="Describe the changes you want to make to your slide..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
      />

      <div className="examples-section">
        <span className="examples-label">Try an example:</span>
        <div className="examples-list">
          {EXAMPLE_INSTRUCTIONS.map((example, index) => (
            <button
              key={index}
              type="button"
              className="example-chip"
              onClick={() => handleExampleClick(example)}
              disabled={disabled}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InstructionInput;
