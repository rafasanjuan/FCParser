// =========================================================
// * Volt React Dashboard
// =========================================================

// * Product Page: https://themesberg.com/product/dashboard/volt-react
// * Copyright 2021 Themesberg (https://www.themesberg.com)
// * Official Repository: https://github.com/themesberg/volt-react-dashboard
// * License: MIT License (https://themesberg.com/licensing)

// * Designed and coded by https://themesberg.com

// =========================================================

// * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. Please contact us to request a removal.

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from "react-router-dom";

// core styles
import "./scss/volt.scss";

// vendor styles
import "@fortawesome/fontawesome-free/css/all.css";
import "react-datetime/css/react-datetime.css";
import '@elastic/eui/dist/eui_theme_light.css';
import '@elastic/charts/dist/theme_only_light.css';
import { EuiProvider } from '@elastic/eui';

import HomePage from "./pages/HomePage";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ScrollToTop from "./components/ScrollToTop";

ReactDOM.render(
  <EuiProvider colorMode="light">
    <HashRouter>
      <ScrollToTop />
      <HomePage />
    </HashRouter>
  </EuiProvider>,
  document.getElementById("root")
);
