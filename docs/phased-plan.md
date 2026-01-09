# AI-Powered PowerPoint Slide Editor - Phased Implementation Plan

## Project Overview
Web app where users upload a PowerPoint slide, provide natural language instructions, and receive an AI-edited slide.

**Tech Stack:** React + Node.js/Express + Claude API + JSZip/xml2js

---

## Phase 1: Project Setup & File Upload
**Goal:** Working file upload with validation

### Deliverables:
- Backend Express server running on port 5000
- Frontend React app running on port 3000
- Drag-drop file upload accepting only .pptx files
- File saved to server, success response returned

### Files to Create:
```
pptx-ai-editor/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/api.js
│   │   └── middleware/fileUpload.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/FileUploader/FileUploader.jsx
│   │   └── styles/global.css
│   └── package.json
```

### Testable Milestone:
✅ Upload a .pptx file → See success message → File exists in `uploads/` folder
✅ Upload a .pdf file → See rejection error

---

## Phase 2: PPTX Parsing
**Goal:** Extract and display slide content structure

### Deliverables:
- Parse uploaded PPTX and extract text elements
- Return structured JSON of slide contents
- Display extracted content in frontend

### Files to Create/Modify:
```
backend/src/services/pptxParser.js    # NEW - Extract slide content
backend/src/controllers/pptxController.js  # NEW - Orchestration
frontend/src/components/SlidePreview/SlidePreview.jsx  # NEW - Show content
```

### Testable Milestone:
✅ Upload slide → See list of text elements extracted (titles, body text)
✅ API endpoint `/api/parse` returns JSON with slide structure

---

## Phase 3: AI Integration
**Goal:** Claude interprets instructions and returns structured operations

### Deliverables:
- Claude API integration with Structured Outputs
- Send slide content + instructions → Receive operation list
- Display AI's interpretation in frontend

### Files to Create/Modify:
```
backend/src/services/aiService.js     # NEW - Claude API calls
frontend/src/components/InstructionInput/InstructionInput.jsx  # NEW
```

### Testable Milestone:
✅ Enter "make the title blue" → See AI response: `{type: "color_change", target: "title", color: "#0000FF"}`
✅ AI returns valid JSON matching our schema every time

---

## Phase 4: PPTX Modification
**Goal:** Apply AI operations to modify the actual PPTX file

### Deliverables:
- Modify PPTX XML based on AI operations
- Support text changes, color changes, font changes
- Save modified file to output folder

### Files to Create/Modify:
```
backend/src/services/pptxModifier.js  # NEW - Apply modifications
backend/output/                        # NEW - Output directory
```

### Testable Milestone:
✅ Upload slide with title "Hello" → Instruct "change title to Goodbye" → Download file → Open in PowerPoint → Title says "Goodbye"
✅ Color and font changes visible in downloaded file

---

## Phase 5: Download & Complete Flow
**Goal:** Full end-to-end workflow with download

### Deliverables:
- Download endpoint for modified files
- Processing status indicator
- Complete user flow: Upload → Instruct → Process → Download
- File cleanup after download

### Files to Create/Modify:
```
frontend/src/components/ProcessingStatus/ProcessingStatus.jsx  # NEW
frontend/src/components/DownloadButton/DownloadButton.jsx      # NEW
backend/src/routes/api.js  # Add download endpoint
```

### Testable Milestone:
✅ Complete flow works end-to-end in browser
✅ User can upload, instruct, and download modified slide
✅ Files are cleaned up after download

---

## Phase 6: Polish & Error Handling
**Goal:** Production-ready error handling and UX

### Deliverables:
- Comprehensive error messages for all failure points
- Loading states and progress indicators
- Input validation (empty instructions, file size limits)
- "Edit Another Slide" reset functionality

### Testable Milestone:
✅ All error cases show user-friendly messages
✅ App handles network failures gracefully
✅ User can process multiple slides in sequence

---

## Phase 7: Advanced Shape Operations (Optional)
**Goal:** Create, delete, and reposition shapes

### Deliverables:
- Generate new text box shapes with proper PPTX XML structure
- Delete existing shapes
- Reposition and resize shapes
- Clone/duplicate existing shapes

### Files to Modify:
```
backend/src/services/pptxModifier.js  # Add shape creation methods
backend/src/services/aiService.js     # Add new operation types to prompt
```

### Testable Milestone:
✅ "Add a 4th column" → Creates new text box shape
✅ "Delete the footer" → Removes shape from slide
✅ "Move title to bottom" → Repositions shape

### Technical Challenges:
- Generating valid PPTX XML for new `<p:sp>` elements
- Calculating positions/sizes in EMUs (914400 EMUs = 1 inch)
- Assigning unique shape IDs
- Handling text formatting in new shapes

---

## Summary: Milestones at Each Phase

| Phase | Status | What You Can Test |
|-------|--------|-------------------|
| 1 | ✅ DONE | Upload .pptx file, see it saved on server |
| 2 | ✅ DONE | See extracted text content from your slide |
| 3 | ✅ DONE | Enter instructions, see AI's interpretation |
| 4 | ✅ DONE | Download modified slide, open in PowerPoint |
| 5 | ✅ DONE | Complete end-to-end user experience |
| 6 | PENDING | Robust error handling, smooth UX |
| 7 | OPTIONAL | Create/delete/move shapes |

Each phase builds on the previous and results in something you can run and test. You'll have a working (if limited) app after Phase 1, and progressively add capabilities.

### Current Capabilities (Phases 1-5):
- ✅ Text editing (replace existing text)
- ✅ Translation (translate all text on slide)
- ✅ Color changes
- ✅ Font changes
- ✅ Size changes
- ✅ Works with grouped objects

### Not Yet Supported:
- ❌ Creating new shapes/text boxes
- ❌ Deleting shapes
- ❌ Repositioning shapes
- ❌ Adding images

---

## Quick Start Commands

```bash
# Phase 1 - After setup
cd backend && npm run dev     # Terminal 1
cd frontend && npm start      # Terminal 2
# Visit http://localhost:3000
```

---

## Required Before Starting
- Node.js installed
- Claude API key (from https://console.anthropic.com)
