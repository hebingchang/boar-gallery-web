import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  BrowserRouter,
} from "react-router-dom";
import './index.css'
import 'unfonts.css'
import App from "./App.tsx";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import en from "./i18n/en.ts";
import zh_CN from "./i18n/zh_CN.ts";
import ja from "./i18n/ja.ts";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.global = globalThis;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      "zh-CN": zh_CN,
      ja: ja,
    },
    interpolation: {
      escapeValue: false
    }
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </React.StrictMode>,
)
