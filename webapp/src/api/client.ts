import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// VK's own recommended pattern (github.com/VKCOM/vk-apps-launch-params):
// forward the raw launch-params query string as an explicit header instead
// of relying on Referer, browsers may strip it or it leaks to third-party
// requests made from inside the mini app.
api.interceptors.request.use((config) => {
  const urlParams = new URLSearchParams(window.location.search);

  // In dev mode without real VK params, generate a stable mock identity.
  // Use ?mock_user=driver or ?mock_user=passenger to test two roles in
  // separate browser windows without two VK accounts.
  if (import.meta.env.DEV && !urlParams.has('vk_user_id')) {
    const role = urlParams.get('mock_user') ?? 'passenger';
    const mockUserId = role === 'driver' ? '111111111' : '222222222';
    const mockParams = `vk_user_id=${mockUserId}&vk_ts=${Math.floor(Date.now() / 1000)}`;
    config.headers.Authorization = `Bearer ${mockParams}`;
  } else {
    // Real VK launch params (inside VK iframe or with explicit params)
    config.headers.Authorization = `Bearer ${window.location.search.slice(1)}`;
  }

  return config;
});
