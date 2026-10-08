import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './expansion.css';
import './living.css';
import './life.css';
import './mobile.css';
createRoot(document.getElementById('root')!).render(<App />);

if(import.meta.env.PROD&&'serviceWorker' in navigator){window.addEventListener('load',()=>void navigator.serviceWorker.register('/sw.js').catch(()=>{}));}
