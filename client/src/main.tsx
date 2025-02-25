import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('Application starting...');

const root = document.getElementById('root');
if (!root) {
    console.error('Root element not found!');
} else {
    console.log('Mounting React application...');
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
