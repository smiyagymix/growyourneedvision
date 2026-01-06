import React from 'react';
import ReactDOM from 'react-dom/client';
import { RemotionRoot } from './apps/media/RemotionRoot';

// This file is used by Remotion for rendering compositions
const rootElement = document.getElementById('remotion-root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<RemotionRoot />);
}

export default RemotionRoot;
