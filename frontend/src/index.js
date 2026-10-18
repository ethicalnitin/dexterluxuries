import React from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first, so page and component stylesheets (imported by App)
// load after them and can refine the shared ui- classes.
import './theme/global.css';
import theme from './theme/theme';
import applyTheme from './theme/applyTheme';
import App from './App';

// Apply the store theme (src/theme/theme.js) before the first render.
applyTheme(theme);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
