if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Yerel dosya sisteminde çalışırken hata normal, üretimde çalışır
    });
  });
}
