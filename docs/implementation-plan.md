# AI-Powered PowerPoint Slide Editor - Implementation Plan

## Overview
Build a web application where users upload a single PowerPoint slide (.pptx), provide natural language instructions on desired changes, and receive an AI-edited slide for download.

**Tech Stack:**
- Frontend: React with react-dropzone for file uploads
- Backend: Node.js/Express with Multer for file handling
- AI: Claude API with Structured Outputs for instruction interpretation
- PPTX Processing: JSZip + xml2js for direct XML manipulation

**Deployment:** Local development environment

---

## Project Structure

```
pptx-ai-editor/
├── backend/
│   ├── src/
│   │   ├── server.js                    # Express server setup
│   │   ├── routes/api.js                # API routes
│   │   ├── controllers/pptxController.js # Main workflow orchestration
│   │   ├── services/
│   │   │   ├── pptxParser.js            # Extract PPTX content/structure
│   │   │   ├── pptxModifier.js          # Apply modifications to PPTX
│   │   │   └── aiService.js             # Claude API integration
│   │   └── middleware/fileUpload.js     # Multer configuration
│   ├── uploads/                          # Temporary file storage
│   ├── output/                           # Modified files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Main application
│   │   ├── components/
│   │   │   ├── FileUploader/            # Drag-drop upload
│   │   │   ├── InstructionInput/        # Instructions textarea
│   │   │   ├── SlidePreview/            # Preview component
│   │   │   ├── ProcessingStatus/        # Loading indicator
│   │   │   └── DownloadButton/          # Download modified file
│   │   └── styles/global.css
│   └── package.json
```

---

## Implementation Steps

### Phase 1: Backend Setup

**1.1 Initialize Backend Project**
```bash
mkdir pptx-ai-editor && cd pptx-ai-editor
mkdir backend && cd backend
npm init -y
```

**1.2 Install Dependencies**
```bash
npm install express multer cors dotenv jszip xml2js @anthropic-ai/sdk uuid express-validator
npm install --save-dev nodemon
```

**1.3 Create Environment Configuration**

Create `.env` file:
```
PORT=5000
CLAUDE_API_KEY=your_claude_api_key_here
UPLOAD_DIR=./uploads
OUTPUT_DIR=./output
MAX_FILE_SIZE=10485760
NODE_ENV=development
```

**1.4 Build Core Backend Files**

Critical files to create in order:

1. **[server.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\server.js)** - Express server with CORS, directory creation, and route mounting

2. **[middleware/fileUpload.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\middleware\fileUpload.js)** - Multer configuration with .pptx validation and file size limits

3. **[services/pptxParser.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\pptxParser.js)** - Extract slide content using JSZip and xml2js:
   - Read PPTX as ZIP archive
   - Parse `ppt/slides/slide1.xml` to extract text elements, shapes, and images
   - Navigate XML structure: `p:sld → p:cSld → p:spTree → p:sp → p:txBody`
   - Return structured data with text content, positions, fonts, colors

4. **[services/aiService.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\aiService.js)** - Claude API integration with Structured Outputs:
   - Use `claude-sonnet-4-5-20250929` model
   - Implement JSON schema for slide operations (text_edit, font_change, color_change, layout_change, image_replace)
   - Send slide content + user instructions to Claude
   - Return structured array of operations to perform

5. **[services/pptxModifier.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\pptxModifier.js)** - Apply AI operations to PPTX:
   - Load PPTX as JSZip object
   - Parse slide XML, modify based on operation type
   - Handle text changes: navigate to `a:t` elements in XML
   - Handle font changes: modify `a:rPr` properties
   - Handle color changes: update `a:solidFill` elements
   - Handle layout: modify position/size attributes
   - Rebuild XML using xml2js Builder
   - Generate modified PPTX file

6. **[controllers/pptxController.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\controllers\pptxController.js)** - Workflow orchestration:
   - `processSlide()`: Parse → AI interpret → Modify → Save → Return download URL
   - `downloadFile()`: Serve modified file with security checks, cleanup after download

7. **[routes/api.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\routes\api.js)** - API endpoints:
   - `POST /api/process` - Upload and process slide
   - `GET /api/download/:filename` - Download modified slide

---

### Phase 2: Frontend Setup

**2.1 Initialize React App**
```bash
cd ..
npx create-react-app frontend
cd frontend
npm install react-dropzone axios
```

**2.2 Create Environment Config**

Create `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

**2.3 Build Frontend Components**

1. **[App.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\App.jsx)** - Main application:
   - State management: file, instructions, processing, result, error
   - Form submission workflow
   - Conditional rendering: upload form vs. results view
   - Reset functionality

2. **[FileUploader.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\components\FileUploader\FileUploader.jsx)** - Drag-drop upload:
   - Use react-dropzone with .pptx MIME type restriction
   - Visual feedback for drag state
   - Display uploaded file info

3. **[InstructionInput.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\components\InstructionInput\InstructionInput.jsx)** - Instructions textarea:
   - Multi-line text input
   - Example instructions for user guidance
   - Click examples to auto-fill

4. **[SlidePreview.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\components\SlidePreview\SlidePreview.jsx)** - Preview uploaded file:
   - Show file name and size
   - Note: Full visual preview requires PPTX→image conversion (optional enhancement)

5. **[ProcessingStatus.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\components\ProcessingStatus\ProcessingStatus.jsx)** - Loading indicator:
   - Animated spinner
   - Step-by-step status display

6. **[DownloadButton.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\components\DownloadButton\DownloadButton.jsx)** - Download modified file:
   - Trigger download from backend URL

---

## Technical Implementation Details

### PPTX File Format

PPTX files are ZIP archives containing XML files:
- `ppt/slides/slide1.xml` - Main slide content
- `ppt/theme/theme1.xml` - Theme colors and fonts
- `ppt/media/` - Images
- `ppt/_rels/` - Relationships between elements

### XML Namespaces (Critical for parsing)
- `p:` - Presentation ML (slides, shapes)
- `a:` - Drawing ML (text, formatting)
- `r:` - Relationships

### AI Structured Output Schema

```json
{
  "operations": [
    {
      "type": "text_edit | font_change | color_change | layout_change | image_replace | size_change",
      "target": {
        "elementType": "text | shape | image",
        "identifier": "title | body | specific element description",
        "selector": "CSS-like selector or index"
      },
      "changes": {
        "text": "new text content",
        "fontFamily": "Arial",
        "fontSize": 24,
        "color": "#0000FF",
        "position": { "x": 100, "y": 200 }
      }
    }
  ],
  "explanation": "Human-readable description of changes made"
}
```

### Workflow Sequence

1. User uploads .pptx file → Multer saves to `uploads/`
2. User enters instructions → Frontend sends FormData to `/api/process`
3. Backend parses PPTX → Extract slide structure and content
4. Backend calls Claude API → Get structured operation list
5. Backend modifies PPTX XML → Apply each operation
6. Backend saves modified file → Store in `output/` with unique name
7. Frontend receives download URL → User downloads modified slide
8. Backend cleanup → Delete uploaded and output files after download

---

## Editing Capabilities

### Text Editing
- Modify text content in text boxes
- Change font family, size, color
- Update formatting (bold, italic, alignment)

### Image Operations
- Replace images (requires updating `ppt/media/` and relationships)
- Resize and reposition images

### Layout Changes
- Move elements (modify x/y coordinates in XML)
- Resize shapes and text boxes
- Change alignment

### Color/Theme Changes
- Background colors
- Text colors (modify `a:solidFill` elements)
- Theme color palette updates

---

## Error Handling Strategy

1. **File Validation**: Check MIME type and file size on client and server
2. **XML Parsing**: Try-catch around all XML operations with fallback errors
3. **AI API**: Retry logic for transient failures, validation of structured output
4. **File Cleanup**: Automatic deletion after download, scheduled cleanup for orphaned files
5. **User Feedback**: Clear error messages for each failure point

---

## Testing Approach

**Backend Tests:**
- Test PPTX parsing with sample files (simple text, images, complex layouts)
- Test AI service with various instruction types
- Test modification functions individually
- Integration test: full upload → process → download workflow

**Frontend Tests:**
- File upload component with valid/invalid files
- Instruction input validation
- API communication and error handling

**Manual Testing Scenarios:**
1. Upload slide → Change title text → Verify download
2. Upload slide → Change colors → Verify visual changes
3. Upload slide with images → Modify layout → Verify positioning
4. Test error cases: invalid file, empty instructions, large files

---

## Running the Application

**Start Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Start Frontend:**
```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

**Required Setup:**
1. Obtain Claude API key from https://console.anthropic.com
2. Add API key to `backend/.env`
3. Ensure both servers are running
4. Upload a .pptx file and provide instructions

---

## Future Enhancements (Out of Scope for Initial Version)

- Visual preview of original and modified slides (requires PPTX→PNG conversion)
- Support for multi-slide presentations
- Batch operations across multiple slides
- Template library for common modifications
- User authentication and file history
- Real-time collaboration features
- Export to other formats (PDF, images)

---

## Critical Files Summary

**Most Complex/Critical:**
1. [pptxParser.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\pptxParser.js) - PPTX structure extraction
2. [aiService.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\aiService.js) - AI instruction interpretation
3. [pptxModifier.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\services\pptxModifier.js) - XML modification logic
4. [pptxController.js](C:\Users\Diego Silva\pptx-ai-editor\backend\src\controllers\pptxController.js) - Workflow orchestration
5. [App.jsx](C:\Users\Diego Silva\pptx-ai-editor\frontend\src\App.jsx) - Frontend state management

---

## Key Technical Challenges

1. **PPTX XML Complexity**: The XML structure is deeply nested and varies by slide layout. Solution: Start with simple text modifications, gradually add support for more element types.

2. **AI Output Consistency**: Natural language is ambiguous. Solution: Use Claude's Structured Outputs with strict schema validation.

3. **Relationship Integrity**: PPTX files have complex relationship files linking slides, images, themes. Solution: Preserve existing relationships when modifying, update only when necessary.

4. **File Cleanup**: Prevent disk space issues from accumulated temp files. Solution: Delete files after download, implement scheduled cleanup task.

This plan provides a complete foundation for building the AI-powered PowerPoint editor. Implementation should proceed in phases, testing thoroughly at each step before moving to the next.
