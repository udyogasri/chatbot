import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

window.addEventListener('error', (event) => {
  document.body.innerHTML += `<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding:20px; font-family:monospace;"><h3>Runtime Error:</h3><pre>${event.error?.stack || event.message}</pre></div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML += `<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding:20px; font-family:monospace;"><h3>Promise Error:</h3><pre>${event.reason?.stack || event.reason}</pre></div>`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
