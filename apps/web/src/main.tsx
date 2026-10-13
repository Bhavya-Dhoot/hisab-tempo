import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './tempo/Landing';
import './index.css';

// The local console is a separate app; it loads only on /console, so the public pages do not carry its code.
const App = React.lazy(() => import('./App'));
// Each route other than the landing page is its own chunk.
const PayPage = React.lazy(() => import('./tempo/PayPage'));
const StartPage = React.lazy(() => import('./tempo/StartPage'));

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const route = path.startsWith('/pay/') ? (
  <PayPage sbHash={decodeURIComponent(path.slice(5))} />
) : path === '/start' ? (
  <StartPage />
) : path === '/console' ? (
  <App />
) : null;
// The landing page renders at once; the other routes show the page background until their chunk arrives.
const page = route ? <React.Suspense fallback={<div className="min-h-[100dvh] bg-bg" />}>{route}</React.Suspense> : <Landing />;

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{page}</React.StrictMode>);
