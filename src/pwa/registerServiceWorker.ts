const registerInProduction = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
};

const unregisterInDevelopment = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.error('Service worker cleanup failed:', error);
  }
};

export const setupServiceWorker = () => {
  if (import.meta.env.PROD) {
    registerInProduction();
    return;
  }

  void unregisterInDevelopment();
};
