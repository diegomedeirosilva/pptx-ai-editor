const JSZip = require('jszip');
const xml2js = require('xml2js');
const fs = require('fs').promises;

class PPTXParser {
  constructor() {
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  async parse(filePath) {
    const data = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(data);

    // Extract slide content
    const slides = await this.extractSlides(zip);

    // Extract theme info
    const theme = await this.extractTheme(zip);

    // Extract image references
    const images = await this.extractImageReferences(zip);

    return {
      slides,
      theme,
      images,
      slideCount: slides.length
    };
  }

  async extractSlides(zip) {
    const slides = [];
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)[1]);
        const numB = parseInt(b.match(/slide(\d+)/)[1]);
        return numA - numB;
      });

    for (const slideFile of slideFiles) {
      const xmlContent = await zip.files[slideFile].async('string');
      const parsed = await this.parser.parseStringPromise(xmlContent);
      const slideContent = this.parseSlideContent(parsed);
      slides.push({
        file: slideFile,
        ...slideContent
      });
    }

    return slides;
  }

  parseSlideContent(parsed) {
    const elements = [];
    const textElements = [];
    const shapes = [];

    try {
      const slide = parsed['p:sld'];
      const commonSlideData = slide?.['p:cSld'];
      const shapeTree = commonSlideData?.['p:spTree'];

      if (!shapeTree) {
        return { elements, textElements, shapes };
      }

      // Parse all shapes including those in groups
      this.parseShapeTree(shapeTree, elements, textElements, shapes);

    } catch (error) {
      console.error('Error parsing slide content:', error);
    }

    return { elements, textElements, shapes };
  }

  // Recursively parse shape tree including grouped shapes
  parseShapeTree(container, elements, textElements, shapes) {
    // Parse shape elements (p:sp)
    const spElements = this.ensureArray(container['p:sp']);
    for (const sp of spElements) {
      const element = this.parseShapeElement(sp);
      if (element) {
        elements.push(element);
        if (element.text) {
          textElements.push(element);
        }
        shapes.push(element);
      }
    }

    // Parse picture elements (p:pic)
    const picElements = this.ensureArray(container['p:pic']);
    for (const pic of picElements) {
      const element = this.parsePictureElement(pic);
      if (element) {
        elements.push(element);
      }
    }

    // Parse grouped shapes (p:grpSp) - recursively
    const groupElements = this.ensureArray(container['p:grpSp']);
    for (const group of groupElements) {
      // Groups can contain sp, pic, and nested grpSp
      this.parseShapeTree(group, elements, textElements, shapes);
    }
  }

  parseShapeElement(sp) {
    if (!sp) return null;

    const element = {
      type: 'shape',
      id: null,
      name: null,
      text: null,
      textRuns: [],
      position: null,
      size: null,
      placeholder: null
    };

    // Get non-visual properties (name, id)
    const nvSpPr = sp['p:nvSpPr'];
    if (nvSpPr) {
      const cNvPr = nvSpPr['p:cNvPr'];
      if (cNvPr?.$) {
        element.id = cNvPr.$.id;
        element.name = cNvPr.$.name;
      }

      // Check for placeholder type
      const nvPr = nvSpPr['p:nvPr'];
      if (nvPr?.['p:ph']) {
        const ph = nvPr['p:ph'];
        element.placeholder = ph.$?.type || 'body';
      }
    }

    // Get shape properties (position, size)
    const spPr = sp['p:spPr'];
    if (spPr) {
      const xfrm = spPr['a:xfrm'];
      if (xfrm) {
        const off = xfrm['a:off'];
        const ext = xfrm['a:ext'];
        if (off?.$) {
          element.position = {
            x: parseInt(off.$.x) / 914400, // EMUs to inches
            y: parseInt(off.$.y) / 914400
          };
        }
        if (ext?.$) {
          element.size = {
            width: parseInt(ext.$.cx) / 914400,
            height: parseInt(ext.$.cy) / 914400
          };
        }
      }
    }

    // Get text content
    const txBody = sp['p:txBody'];
    if (txBody) {
      const paragraphs = this.ensureArray(txBody['a:p']);
      const textParts = [];

      for (const para of paragraphs) {
        const runs = this.ensureArray(para['a:r']);
        for (const run of runs) {
          const textEl = run['a:t'];
          if (textEl) {
            const text = typeof textEl === 'string' ? textEl : textEl._ || textEl;
            if (text) {
              textParts.push(text);

              // Get text run properties
              const rPr = run['a:rPr'];
              const runInfo = {
                text: text,
                bold: rPr?.$?.b === '1',
                italic: rPr?.$?.i === '1',
                fontSize: rPr?.$?.sz ? parseInt(rPr.$.sz) / 100 : null, // hundredths of a point to points
                fontFamily: null,
                color: null
              };

              // Get font family
              if (rPr?.['a:latin']?.$?.typeface) {
                runInfo.fontFamily = rPr['a:latin'].$.typeface;
              }

              // Get color
              const solidFill = rPr?.['a:solidFill'];
              if (solidFill?.['a:srgbClr']?.$?.val) {
                runInfo.color = '#' + solidFill['a:srgbClr'].$.val;
              }

              element.textRuns.push(runInfo);
            }
          }
        }
      }

      element.text = textParts.join(' ');
    }

    return element;
  }

  parsePictureElement(pic) {
    if (!pic) return null;

    const element = {
      type: 'picture',
      id: null,
      name: null,
      position: null,
      size: null,
      rId: null // relationship ID for the image file
    };

    const nvPicPr = pic['p:nvPicPr'];
    if (nvPicPr?.['p:cNvPr']?.$) {
      element.id = nvPicPr['p:cNvPr'].$.id;
      element.name = nvPicPr['p:cNvPr'].$.name;
    }

    const blipFill = pic['p:blipFill'];
    if (blipFill?.['a:blip']?.$?.['r:embed']) {
      element.rId = blipFill['a:blip'].$['r:embed'];
    }

    const spPr = pic['p:spPr'];
    if (spPr?.['a:xfrm']) {
      const xfrm = spPr['a:xfrm'];
      const off = xfrm['a:off'];
      const ext = xfrm['a:ext'];
      if (off?.$) {
        element.position = {
          x: parseInt(off.$.x) / 914400,
          y: parseInt(off.$.y) / 914400
        };
      }
      if (ext?.$) {
        element.size = {
          width: parseInt(ext.$.cx) / 914400,
          height: parseInt(ext.$.cy) / 914400
        };
      }
    }

    return element;
  }

  async extractTheme(zip) {
    const themeFile = 'ppt/theme/theme1.xml';
    if (!zip.files[themeFile]) {
      return null;
    }

    try {
      const xmlContent = await zip.files[themeFile].async('string');
      const parsed = await this.parser.parseStringPromise(xmlContent);

      const theme = {
        name: null,
        colors: {},
        fonts: {}
      };

      const themeEl = parsed['a:theme'];
      if (themeEl?.$?.name) {
        theme.name = themeEl.$.name;
      }

      // Extract color scheme
      const clrScheme = themeEl?.['a:themeElements']?.['a:clrScheme'];
      if (clrScheme) {
        const colorNames = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
        for (const colorName of colorNames) {
          const colorEl = clrScheme[`a:${colorName}`];
          if (colorEl?.['a:srgbClr']?.$?.val) {
            theme.colors[colorName] = '#' + colorEl['a:srgbClr'].$.val;
          }
        }
      }

      // Extract font scheme
      const fontScheme = themeEl?.['a:themeElements']?.['a:fontScheme'];
      if (fontScheme) {
        const majorFont = fontScheme['a:majorFont']?.['a:latin']?.$?.typeface;
        const minorFont = fontScheme['a:minorFont']?.['a:latin']?.$?.typeface;
        if (majorFont) theme.fonts.major = majorFont;
        if (minorFont) theme.fonts.minor = minorFont;
      }

      return theme;
    } catch (error) {
      console.error('Error parsing theme:', error);
      return null;
    }
  }

  async extractImageReferences(zip) {
    const images = [];
    const mediaFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/media/')
    );

    for (const mediaFile of mediaFiles) {
      const fileName = mediaFile.split('/').pop();
      const extension = fileName.split('.').pop().toLowerCase();
      images.push({
        path: mediaFile,
        fileName,
        type: extension
      });
    }

    return images;
  }

  ensureArray(item) {
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
  }
}

module.exports = new PPTXParser();
