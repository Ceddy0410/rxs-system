// Configuration for Backend Server Connection (Tablet & Multi-Screen Support)

export const getServerUrl = (): string => {
  // 1. Stored user server URL in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('rxs_server_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // 2. Check if running inside Capacitor Android native APK or mobile environment
    const isCapacitor = 
      (window as any).Capacitor !== undefined ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      /Android/i.test(navigator.userAgent);

    if (isCapacitor) {
      // Default to host machine IP on local Wi-Fi
      return 'http://192.168.1.66:3001';
    }

    // 3. If running in a browser on local LAN (e.g., http://192.168.1.66:3000)
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
  }

  // Fallback for local laptop dev server
  return '';
};

export const apiFetch = (path: string, options?: RequestInit): Promise<Response> => {
  const base = getServerUrl();
  const url = base ? `${base}${path}` : path;
  return fetch(url, options);
};
