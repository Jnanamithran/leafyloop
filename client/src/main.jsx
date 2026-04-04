// client/src/main.jsx
import React        from "react";
import ReactDOM     from "react-dom/client";
import App          from "./App.jsx";
import "./index.css";

// Load Razorpay SDK (needed for checkout)
const rzpScript = document.createElement("script");
rzpScript.src = "https://checkout.razorpay.com/v1/checkout.js";
rzpScript.async = true;
document.head.appendChild(rzpScript);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
