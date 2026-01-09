import React from 'react';
import './SlidePreview.css';

function SlidePreview({ slideData }) {
  if (!slideData) {
    return null;
  }

  const { slides, theme, images } = slideData;

  return (
    <div className="slide-preview">
      <h3>Slide Content</h3>

      {slides && slides.length > 0 && (
        <div className="slide-content">
          {slides.map((slide, slideIndex) => (
            <div key={slideIndex} className="slide-section">
              <h4>Slide {slideIndex + 1}</h4>

              {slide.textElements && slide.textElements.length > 0 ? (
                <div className="text-elements">
                  {slide.textElements.map((element, elemIndex) => (
                    <div key={elemIndex} className="text-element">
                      <div className="element-header">
                        <span className="element-type">
                          {element.placeholder || element.name || 'Text Box'}
                        </span>
                        {element.textRuns && element.textRuns[0]?.fontSize && (
                          <span className="element-meta">
                            {element.textRuns[0].fontSize}pt
                          </span>
                        )}
                      </div>
                      <div className="element-text">
                        "{element.text}"
                      </div>
                      {element.textRuns && element.textRuns.length > 0 && (
                        <div className="element-formatting">
                          {element.textRuns[0].fontFamily && (
                            <span className="format-tag">
                              {element.textRuns[0].fontFamily}
                            </span>
                          )}
                          {element.textRuns[0].color && (
                            <span
                              className="format-tag color-tag"
                              style={{ backgroundColor: element.textRuns[0].color }}
                            >
                              {element.textRuns[0].color}
                            </span>
                          )}
                          {element.textRuns[0].bold && (
                            <span className="format-tag">Bold</span>
                          )}
                          {element.textRuns[0].italic && (
                            <span className="format-tag">Italic</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-content">No text elements found</p>
              )}
            </div>
          ))}
        </div>
      )}

      {theme && (
        <div className="theme-section">
          <h4>Theme: {theme.name || 'Default'}</h4>
          {theme.fonts && (
            <div className="theme-fonts">
              {theme.fonts.major && <span>Heading: {theme.fonts.major}</span>}
              {theme.fonts.minor && <span>Body: {theme.fonts.minor}</span>}
            </div>
          )}
          {theme.colors && Object.keys(theme.colors).length > 0 && (
            <div className="theme-colors">
              {Object.entries(theme.colors).slice(0, 6).map(([name, color]) => (
                <div
                  key={name}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  title={`${name}: ${color}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {images && images.length > 0 && (
        <div className="images-section">
          <h4>Images ({images.length})</h4>
          <div className="image-list">
            {images.map((img, idx) => (
              <span key={idx} className="image-tag">
                {img.fileName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SlidePreview;
