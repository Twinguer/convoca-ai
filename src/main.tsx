
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { triggerScrapeCebraspe } from "./services/concursoService";

// Initialize React Query client
const queryClient = new QueryClient();

// Trigger the scraper to populate initial data
triggerScrapeCebraspe()
  .then(() => console.log("Initial scraping completed"))
  .catch((error) => console.error("Initial scraping failed:", error));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
