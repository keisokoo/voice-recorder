import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss"; // 전역 스타일 파일

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
