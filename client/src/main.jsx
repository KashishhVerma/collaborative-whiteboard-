import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { store } from "./store/store.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#16161a",
            color: "#e8e8f0",
            border: "1px solid #1e1e24",
            borderRadius: "10px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#7c5cfc", secondary: "#fff" } },
          duration: 2500,
        }}
      />
    </BrowserRouter>
  </Provider>
);
