const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY,
      });
    }
    return this.client;
  }

  async interpretInstructions(slideContent, userInstructions) {
    const client = this.getClient();

    // Build a simplified representation of the slide content for the AI
    const slideDescription = this.buildSlideDescription(slideContent);

    const systemPrompt = `You are a PowerPoint slide editing assistant. Your job is to interpret user instructions and convert them into specific, structured operations that can be applied to modify a PowerPoint slide.

You will receive:
1. A description of the current slide content (text elements, their properties, theme info)
2. User instructions describing what changes they want

You must respond with a JSON object containing:
- "operations": an array of specific operations to perform
- "explanation": a human-readable summary of what will be changed

Each operation should have:
- "type": one of "text_edit", "translate", "font_change", "color_change", "size_change", "shape_create", "shape_delete"
- "target": which element to modify
- "changes": the specific changes to make

IMPORTANT OPERATION FORMATS:

For text_edit (changing specific text):
{
  "type": "text_edit",
  "target": { "originalText": "exact text to find" },
  "changes": { "text": "replacement text" }
}

For translate (translating ALL text on slide):
{
  "type": "translate",
  "target": { "scope": "all" },
  "changes": {
    "translations": {
      "Original text 1": "Translated text 1",
      "Original text 2": "Translated text 2"
    }
  }
}

For color_change:
{ "type": "color_change", "target": {}, "changes": { "color": "#0066CC" } }

For font_change:
{ "type": "font_change", "target": {}, "changes": { "fontFamily": "Arial" } }

For size_change:
{ "type": "size_change", "target": {}, "changes": { "fontSize": 24 } }

For shape_create (creating a NEW text box - use when asked to add columns, elements, text boxes):
{
  "type": "shape_create",
  "target": {},
  "changes": {
    "text": "Text content here\nSecond line here",
    "x": 7,
    "y": 1.5,
    "width": 2,
    "height": 4,
    "fontSize": 18,
    "fontFamily": "Calibri",
    "color": "#000000"
  }
}
Note: x, y, width, height are in INCHES from top-left. Standard slide is 10x7.5 inches.
- For adding a 4th column to a 3-column layout, x should be around 7-8 inches
- For adding rows, adjust y position accordingly

For shape_delete (removing a text element):
{
  "type": "shape_delete",
  "target": { "originalText": "exact text to find and delete" },
  "changes": {}
}

CRITICAL RULES:
- For translations: Include EVERY text element in the translations object
- Use the EXACT original text as keys (copy from the slide content provided)
- For colors, use hex format (#RRGGBB)
- For font sizes, use points (e.g., 24)
- When asked to ADD new content (columns, text boxes, elements), use shape_create
- When asked to REMOVE/DELETE content, use shape_delete
- Position new shapes intelligently based on existing content layout`;

    const userPrompt = `Current Slide Content:
${slideDescription}

User Instructions:
"${userInstructions}"

Analyze the slide content and generate the operations needed to fulfill the user's request. Respond with valid JSON only.`;

    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: systemPrompt
      });

      // Extract the text content from the response
      const responseText = message.content[0].text;

      // Parse the JSON response
      const parsed = this.parseAIResponse(responseText);

      return parsed;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  buildSlideDescription(slideContent) {
    const lines = [];

    if (slideContent.slides && slideContent.slides.length > 0) {
      const slide = slideContent.slides[0];

      lines.push('Text Elements (each line is a separate text run that can be translated):');
      lines.push('(Position info in inches from top-left, slide is 10x7.5 inches)');
      if (slide.textElements && slide.textElements.length > 0) {
        let runIndex = 1;
        slide.textElements.forEach((element) => {
          // Show position info for better spatial understanding
          let posInfo = '';
          if (element.position) {
            posInfo = ` [at x=${element.position.x.toFixed(1)}", y=${element.position.y.toFixed(1)}"]`;
          }

          // List each text run separately - these are the actual <a:t> contents
          if (element.textRuns && element.textRuns.length > 0) {
            for (const run of element.textRuns) {
              if (run.text && run.text.trim()) {
                lines.push(`  ${runIndex}. "${run.text}"${posInfo}`);
                runIndex++;
              }
            }
          }
        });
        if (runIndex === 1) {
          lines.push('  (No text found)');
        }
      } else {
        lines.push('  (No text elements found)');
      }
    }

    if (slideContent.theme) {
      lines.push('\nTheme:');
      if (slideContent.theme.name) {
        lines.push(`  Name: ${slideContent.theme.name}`);
      }
      if (slideContent.theme.fonts) {
        if (slideContent.theme.fonts.major) lines.push(`  Heading font: ${slideContent.theme.fonts.major}`);
        if (slideContent.theme.fonts.minor) lines.push(`  Body font: ${slideContent.theme.fonts.minor}`);
      }
      if (slideContent.theme.colors && Object.keys(slideContent.theme.colors).length > 0) {
        lines.push(`  Colors: ${Object.entries(slideContent.theme.colors).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}`);
      }
    }

    if (slideContent.images && slideContent.images.length > 0) {
      lines.push(`\nImages: ${slideContent.images.map(img => img.fileName).join(', ')}`);
    }

    return lines.join('\n');
  }

  parseAIResponse(responseText) {
    // Try to extract JSON from the response
    let jsonStr = responseText;

    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate the structure
      if (!parsed.operations) {
        parsed.operations = [];
      }
      if (!parsed.explanation) {
        parsed.explanation = 'Changes will be applied as requested.';
      }

      // Normalize operations
      parsed.operations = parsed.operations.map(op => this.normalizeOperation(op));

      return parsed;
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  normalizeOperation(op) {
    // Ensure operation has required fields
    const normalized = {
      type: op.type || 'text_edit',
      target: op.target || {},
      changes: op.changes || {}
    };

    // Normalize color values to uppercase hex
    if (normalized.changes.color) {
      let color = normalized.changes.color;
      if (!color.startsWith('#')) {
        color = '#' + color;
      }
      normalized.changes.color = color.toUpperCase();
    }

    return normalized;
  }
}

module.exports = new AIService();
