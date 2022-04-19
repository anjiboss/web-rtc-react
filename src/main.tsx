import { render } from "react-dom";
import "./index.css";
import React from "react";
import App from "./App";
const container = document.getElementById("root");
render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  container
);
