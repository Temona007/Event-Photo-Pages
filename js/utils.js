(function (global) {
  function absoluteEventUrl(slug) {
    return new URL('event.html?slug=' + encodeURIComponent(slug), window.location.href).href;
  }

  var toastTimer;
  function toast(message, duration) {
    duration = duration === undefined ? 2800 : duration;
    var el = document.getElementById('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('toast--show');
    }, duration);
  }

  global.EPUtils = {
    absoluteEventUrl: absoluteEventUrl,
    toast: toast,
  };
})(typeof window !== 'undefined' ? window : this);
