import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Root from "./routes/root";
import './index.css'
import { NextUIProvider } from "@nextui-org/react";
import Index from "./routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    children: [
      {
        path: "",
        element: <Index/>
      }
    ]
  },
]);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.global = globalThis;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      <RouterProvider router={router}/>
    </NextUIProvider>
  </React.StrictMode>,
)
