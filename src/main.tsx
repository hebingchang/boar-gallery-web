import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  BrowserRouter,
} from "react-router-dom";
import './index.css'
import 'unfonts.css'
import App from "./App.tsx";

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <Root/>,
//     children: [
//       {
//         path: "",
//         element: <Index/>
//       }
//     ]
//   },
// ]);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.global = globalThis;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </React.StrictMode>,
)
