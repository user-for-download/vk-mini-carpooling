import { createRoot } from 'react-dom/client';
import bridge from '@vkontakte/vk-bridge';
import '@vkontakte/vkui/dist/vkui.css';
import { App } from './App';

if (import.meta.env.DEV) {
  // Mobile console for debugging on real devices. Dev-only import so it
  // never ships in the production bundle.
  import('eruda').then(({ default: eruda }) => eruda.init());
}

// Required before the app can exchange any other events with the VK client.
// Without this call, VKWebAppGetUserInfo / theme events / everything else
// silently does nothing.
bridge.send('VKWebAppInit');

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(<App />);
