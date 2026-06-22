# AI Chat Assistant

A full-stack, responsive AI Chat Assistant built with **React (Vite + Material UI)** for a premium dark-themed, glassmorphic UI, and **FastAPI** on the backend using the **Google Gemini SDK**.

---

## Project Structure

```text
chatbot/
├── README.md
├── backend/
│   ├── app.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── services/
│       └── gemini_service.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── ChatInput.jsx
        │   ├── ChatWindow.jsx
        │   └── MessageBubble.jsx
        └── services/
            └── api.js
```

---

## Features

- **Premium Aesthetics**: Glassmorphism dark mode, glowing gradients, hover effects, and slide-in micro-animations.
- **Asynchronous Communications**: FastAPI with Gemini `google-generativeai` SDK integration.
- **Dynamic UX**: Scrollable chat layout with auto-scroll anchors, a pulsing loading state while waiting for the AI response, and clear user/AI bubble alignment.
- **Robust Exception Handling**: Custom validation and informative error screens if backend or Gemini keys are misconfigured.
- **CORS Configured**: Configured to connect easily from the Vite local port (`5173`) to the FastAPI server (`8000`).

---

## Installation & Setup

### 1. Prerequisites
- Python 3.8+
- Node.js 16+

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your environment variables:
   - Rename `.env.example` to `.env` or create a new `.env` file:
     ```env
     GEMINI_API_KEY=your_actual_gemini_api_key
     ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```

---

## Running Locally

To run the application, you need to start both the backend server and the frontend dev server.

### Start the FastAPI Backend
From the `backend/` directory (with virtual environment activated):
```bash
uvicorn main:app --reload
```
*(Alternatively, you can run `uvicorn app:app --reload`)*

The backend API will run at: [http://localhost:8000](http://localhost:8000)

### Start the Vite Frontend
From the `frontend/` directory:
```bash
npm run dev
```
The frontend dev server will start at: [http://localhost:5173](http://localhost:5173)

---

## Verification Flow

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Enter your message in the text input area (press `Enter` or click the Send button).
3. The interface will display a pulsing AI bubble loader during generation.
4. When response completes, the AI response will render in a slate-colored bubble on the left and auto-scroll will glide to the bottom of the feed.
