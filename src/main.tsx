import React from "react";
import ReactDOM from "react-dom/client";
import { VoiceProvider } from '@/context/VoiceContext';
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <VoiceProvider> 
      <App />
    </VoiceProvider>
  </React.StrictMode>
);
