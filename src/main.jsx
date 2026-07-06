import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./styles/buttons.css";
import "./styles/variables.css";
import "./styles/formHeader.css";
import "./styles/swal.css";

document.documentElement.dataset.theme =
  localStorage.getItem("theme") || "light";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);