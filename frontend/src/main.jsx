import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <--- WAJIB ADA: Tanpa ini, tampilan hitam putih!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)