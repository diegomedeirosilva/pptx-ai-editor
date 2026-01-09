const JSZip = require('jszip');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PPTXModifier {
  async modify(filePath, operations) {
    const data = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(data);

    const slideFile = 'ppt/slides/slide1.xml';
    if (!zip.files[slideFile]) {
      throw new Error('No slide found in PPTX file');
    }

    let xmlContent = await zip.files[slideFile].async('string');

    // Apply operations using string-based replacement to preserve structure
    for (const operation of operations) {
      xmlContent = this.applyOperation(xmlContent, operation);
    }

    zip.file(slideFile, xmlContent);

    const outputFilename = 'modified-' + uuidv4() + '.pptx';
    const outputPath = path.join(process.env.OUTPUT_DIR || './output', outputFilename);

    const outputBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    await fs.writeFile(outputPath, outputBuffer);

    return { filename: outputFilename, path: outputPath };
  }

  applyOperation(xml, operation) {
    const { type, target, changes } = operation;

    switch (type) {
      case 'text_edit':
        return this.applyTextEdit(xml, target, changes);
      case 'color_change':
        return this.applyColorChange(xml, target, changes);
      case 'font_change':
        return this.applyFontChange(xml, target, changes);
      case 'size_change':
        return this.applySizeChange(xml, target, changes);
      case 'translate':
        return this.applyTranslation(xml, target, changes);
      case 'shape_create':
        return this.applyShapeCreate(xml, target, changes);
      case 'shape_delete':
        return this.applyShapeDelete(xml, target, changes);
      default:
        console.warn('Unknown operation type:', type);
        return xml;
    }
  }

  // Text edit: replace specific text with new text
  applyTextEdit(xml, target, changes) {
    if (!changes.text) return xml;

    const oldText = target.originalText || target.identifier;
    const newText = changes.text;

    if (oldText) {
      // Replace specific text within <a:t> tags
      const regex = new RegExp(`(<a:t[^>]*>)${this.escapeRegex(oldText)}(</a:t>)`, 'g');
      return xml.replace(regex, `$1${this.escapeXml(newText)}$2`);
    }

    return xml;
  }

  // Translation: replace multiple text mappings
  applyTranslation(xml, target, changes) {
    if (!changes.translations) return xml;

    let result = xml;
    for (const [original, translated] of Object.entries(changes.translations)) {
      // Replace text content within <a:t> tags only
      const regex = new RegExp(`(<a:t[^>]*>)${this.escapeRegex(original)}(</a:t>)`, 'g');
      result = result.replace(regex, `$1${this.escapeXml(translated)}$2`);
    }
    return result;
  }

  // Color change: add or modify solidFill in text runs
  applyColorChange(xml, target, changes) {
    if (!changes.color) return xml;

    const color = changes.color.replace('#', '').toUpperCase();
    const colorXml = `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;

    // Find all <a:rPr> tags and add/update solidFill
    let result = xml;

    // Remove existing solidFill from rPr
    result = result.replace(/(<a:rPr[^>]*>)[\s\S]*?(<a:solidFill>[\s\S]*?<\/a:solidFill>)/g, '$1');

    // Add new solidFill after opening rPr tag
    result = result.replace(/<a:rPr([^>]*)>/g, `<a:rPr$1>${colorXml}`);

    return result;
  }

  // Font change: modify latin typeface attribute
  applyFontChange(xml, target, changes) {
    if (!changes.fontFamily) return xml;

    const font = changes.fontFamily;

    // Update existing latin font declarations
    let result = xml.replace(/<a:latin([^>]*)\stypeface="[^"]*"/g, `<a:latin$1 typeface="${font}"`);

    // Also update cs (complex script) fonts
    result = result.replace(/<a:cs([^>]*)\stypeface="[^"]*"/g, `<a:cs$1 typeface="${font}"`);

    return result;
  }

  // Size change: modify sz attribute in rPr
  applySizeChange(xml, target, changes) {
    if (!changes.fontSize) return xml;

    const sizeInHundredths = Math.round(changes.fontSize * 100);

    // Update existing sz attributes
    return xml.replace(/(<a:rPr[^>]*)\ssz="[^"]*"/g, `$1 sz="${sizeInHundredths}"`);
  }

  // Create a new text box shape
  applyShapeCreate(xml, target, changes) {
    if (!changes.text) return xml;

    // Position in EMUs (914400 EMU = 1 inch)
    // Default to right side of slide if not specified
    const x = Math.round((changes.x || 7) * 914400);  // inches from left
    const y = Math.round((changes.y || 1.5) * 914400); // inches from top
    const width = Math.round((changes.width || 2) * 914400);
    const height = Math.round((changes.height || 4) * 914400);

    // Generate a unique ID (find max existing ID and increment)
    const idMatches = xml.match(/p:cNvPr[^>]*id="(\d+)"/g) || [];
    let maxId = 0;
    for (const match of idMatches) {
      const idMatch = match.match(/id="(\d+)"/);
      if (idMatch) {
        maxId = Math.max(maxId, parseInt(idMatch[1]));
      }
    }
    const newId = maxId + 1;

    // Get font size in hundredths of a point
    const fontSize = changes.fontSize ? Math.round(changes.fontSize * 100) : 1800; // default 18pt
    const fontFamily = changes.fontFamily || 'Calibri';
    const color = changes.color ? changes.color.replace('#', '').toUpperCase() : '000000';

    // Build text content - handle multi-line text
    const textLines = changes.text.split('\n');
    let paragraphsXml = '';
    for (const line of textLines) {
      paragraphsXml += `<a:p><a:r><a:rPr lang="en-US" sz="${fontSize}" dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${this.escapeXml(fontFamily)}"/></a:rPr><a:t>${this.escapeXml(line)}</a:t></a:r></a:p>`;
    }

    // Create the shape XML
    const shapeXml = `<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${newId}" name="TextBox ${newId}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${x}" y="${y}"/>
          <a:ext cx="${width}" cy="${height}"/>
        </a:xfrm>
        <a:prstGeom prst="rect">
          <a:avLst/>
        </a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" rtlCol="0">
          <a:spAutoFit/>
        </a:bodyPr>
        <a:lstStyle/>
        ${paragraphsXml}
      </p:txBody>
    </p:sp>`;

    // Remove whitespace/newlines from shapeXml for cleaner insertion
    const cleanShapeXml = shapeXml.replace(/>\s+</g, '><').trim();

    // Insert before </p:spTree>
    return xml.replace('</p:spTree>', cleanShapeXml + '</p:spTree>');
  }

  // Delete a shape by matching its text content
  applyShapeDelete(xml, target, changes) {
    if (!target.originalText) return xml;

    // Find and remove the entire <p:sp> element containing this text
    // This is tricky with regex - we need to find the shape that contains this text
    const textToFind = this.escapeRegex(target.originalText);

    // Match a p:sp element that contains the target text
    // This regex finds p:sp elements by looking for balanced tags
    const shapeRegex = new RegExp(
      `<p:sp>(?:(?!<p:sp>)[\\s\\S])*?<a:t[^>]*>${textToFind}</a:t>(?:(?!</p:sp>)[\\s\\S])*?</p:sp>`,
      'g'
    );

    return xml.replace(shapeRegex, '');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  escapeXml(string) {
    return string
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = new PPTXModifier();
