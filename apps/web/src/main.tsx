import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Landing from './tempo/Landing';
import PayPage from './tempo/PayPage';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const page = path.startsWith('/pay/') ? (
  <PayPage sbHash={decodeURIComponent(path.slice(5))} />
) : path === '/console' ? (
  <App />
) : (
  <Landing />
);

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{page}</React.StrictMode>);
