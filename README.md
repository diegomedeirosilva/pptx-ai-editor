# PPTX AI Editor

Edit PowerPoint slides using natural language instructions. Upload a slide, describe what you want to change, and download the modified version.

## What it does

- Upload a `.pptx` file
- Describe changes in plain English (e.g., "Change the title to 'Q4 Results'" or "Make the text blue")
- AI interprets your instructions and modifies the slide
- Download the edited file

## Tech Stack

**Backend:** Node.js, Express, JSZip, xml2js, Claude API
**Frontend:** React, react-dropzone

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Claude API key from [Anthropic Console](https://console.anthropic.com)

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/diegomedeirosilva/pptx-ai-editor.git
   cd pptx-ai-editor
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create `backend/.env` file:
   ```
   PORT=5000
   CLAUDE_API_KEY=your_api_key_here
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the App

Start the backend (in one terminal):
```bash
cd backend
npm run dev
```

Start the frontend (in another terminal):
```bash
cd frontend
npm start
```

Open http://localhost:3000 in your browser.

## Project Structure

```
pptx-ai-editor/
├── backend/
│   └── src/
│       ├── server.js           # Express server
│       ├── routes/             # API endpoints
│       ├── controllers/        # Request handling
│       └── services/           # PPTX parsing, AI, modification
├── frontend/
│   └── src/
│       ├── App.jsx             # Main app
│       └── components/         # React components
└── docs/                       # Implementation docs
```

## Supported Edits

- **Text:** Change content, font, size, color
- **Layout:** Move and resize elements
- **Colors:** Update text and background colors

## License

MIT
