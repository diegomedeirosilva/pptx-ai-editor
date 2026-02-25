# CLAUDE.md

## Project Overview

PPTX AI Editor is a web application that lets users edit PowerPoint presentations via natural language. Users upload a `.pptx` file, describe desired changes in plain English, and the app uses Claude to interpret instructions and modify the slide XML, producing a downloadable modified file.

## Architecture

```
pptx-ai-editor/
├── backend/          # Express.js REST API (Node.js)
│   └── src/
│       ├── server.js              # Entry point, Express setup (port 5000)
│       ├── routes/api.js          # Route definitions
│       ├── controllers/pptxController.js  # Request orchestration
│       ├── services/
│       │   ├── pptxParser.js      # PPTX ZIP/XML extraction (JSZip + xml2js)
│       │   ├── aiService.js       # Claude API integration
│       │   └── pptxModifier.js    # XML manipulation to apply edits
│       └── middleware/fileUpload.js  # Multer config for .pptx uploads
├── frontend/         # React SPA (Create React App)
│   └── src/
│       ├── index.js               # React entry point
│       ├── App.jsx                # Main component, state management
│       ├── styles/global.css      # Global styles
│       └── components/
│           ├── FileUploader/      # Drag-drop file upload
│           ├── InstructionInput/  # Natural language input
│           ├── ProcessingStatus/  # Progress indicator
│           └── SlidePreview/      # Extracted content display
└── docs/             # Implementation plans and roadmap
```

## Tech Stack

- **Backend**: Node.js, Express.js, JSZip, xml2js, `@anthropic-ai/sdk`
- **Frontend**: React 18, react-dropzone, Create React App
- **Language**: JavaScript (CommonJS in backend, ES modules/JSX in frontend)
- **AI Model**: Claude (configured in `aiService.js`)
- **No TypeScript, no linting, no test framework configured**

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Add CLAUDE_API_KEY
npm run dev             # Starts on http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm start               # Starts on http://localhost:3000
```

## Environment Variables

**Backend** (`backend/.env`):
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `CLAUDE_API_KEY` | — | **Required.** Anthropic API key |
| `UPLOAD_DIR` | `./uploads` | Temp upload storage |
| `OUTPUT_DIR` | `./output` | Modified file output |
| `MAX_FILE_SIZE` | `10485760` | Upload limit in bytes (10 MB) |
| `NODE_ENV` | `development` | Environment flag |

**Frontend** (`frontend/.env`):
| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000` | Backend URL |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload a `.pptx` file (field: `slide`) |
| `POST` | `/api/parse` | Upload and parse, returns extracted structure |
| `POST` | `/api/process` | Full pipeline: upload, parse, AI interpret, modify, return download URL |
| `GET` | `/api/download/:filename` | Download modified file (auto-deletes after serving) |

All upload endpoints expect `multipart/form-data` with the file in a field named `slide`.

## Key Workflows

### Processing Pipeline (POST /api/process)
1. File uploaded via Multer to `uploads/` directory
2. `pptxParser` extracts PPTX as ZIP, parses slide XML with xml2js
3. `aiService` sends slide structure + user instructions to Claude, receives JSON operations
4. `pptxModifier` applies operations via string-based XML manipulation
5. Modified PPTX saved to `output/`, download URL returned
6. Files auto-cleaned after download

### Supported AI Operations
- `text_edit` — Replace text content
- `translate` — Translate slide text
- `font_change` — Change font family
- `color_change` — Change text color
- `size_change` — Change font size
- `shape_create` — Add new text boxes
- `shape_delete` — Remove elements

## Code Conventions

### General
- No TypeScript — plain JavaScript throughout
- Backend uses CommonJS (`require`/`module.exports`)
- Frontend uses ES module imports and JSX
- No linter or formatter configured; follow existing style
- camelCase for variables/functions, PascalCase for React components and classes

### Backend
- Services exported as class instances (singletons): `module.exports = new PptxParser()`
- Controllers are class methods bound to routes
- Multer middleware handles file validation (`.pptx` only, 10 MB max)
- UUID-based filenames prevent collisions
- PPTX XML uses EMU units: `914400 EMU = 1 inch`

### Frontend
- Component-per-folder pattern: `ComponentName/ComponentName.jsx` + `ComponentName.css`
- State managed with React `useState` hooks in `App.jsx` (no external state library)
- API URL configured via `REACT_APP_API_URL` env var
- CSS-only styling (no preprocessor, no CSS-in-JS)

### Error Handling
- Backend: try-catch in controllers, global error middleware in `server.js`
- Multer errors caught in route-level middleware in `api.js`
- Frontend: try-catch around fetch calls, error state displayed to user
- Path traversal prevention on download endpoint

## File Handling

- Uploaded files go to `backend/uploads/` (gitignored)
- Modified files go to `backend/output/` (gitignored)
- Both directories are auto-created on server startup
- Files are cleaned up after processing/download

## Important Technical Details

- PPTX files are ZIP archives containing XML — `pptxParser.js` unzips and parses them
- `pptxModifier.js` uses **string-based XML replacement** (not AST transforms) to preserve original formatting
- The AI service builds a text description of slide contents and asks Claude for a JSON array of operations
- Grouped shapes are parsed recursively in `pptxParser.js`
- XML special characters are escaped before insertion in `pptxModifier.js`

## Dependencies Worth Knowing

| Package | Purpose |
|---|---|
| `jszip` | Read/write PPTX as ZIP |
| `xml2js` | Parse slide XML to JS objects and back |
| `@anthropic-ai/sdk` | Claude API client |
| `multer` | Multipart file upload handling |
| `react-dropzone` | Drag-and-drop file uploads in frontend |
| `nodemon` | Dev-only auto-restart |

## What's Not Set Up

- **Testing**: No test framework or test files exist
- **Linting/Formatting**: No ESLint, Prettier, or similar
- **CI/CD**: No GitHub Actions or pipelines
- **Docker**: No containerization
- **TypeScript**: Not used anywhere
