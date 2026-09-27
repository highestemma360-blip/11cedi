import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './auth';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './styles.css';

(function initTheme(){
  try{
    const saved=localStorage.getItem('cedigain-theme');
    const theme=(saved==='dark'||saved==='light')?saved:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    document.documentElement.setAttribute('data-theme',theme);
  }catch{
    document.documentElement.setAttribute('data-theme','light');
  }
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App/>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
