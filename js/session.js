(function (global) {
  const SESSION_KEY = 'eventPhotoPages_session';

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function setSession(user) {
    if (!user) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      })
    );
  }

  function requireAuthPage() {
    const s = getSession();
    if (!s) {
      window.location.href = 'login.html';
      return null;
    }
    return s;
  }

  function requireAdminPage() {
    const s = requireAuthPage();
    if (!s) return null;
    if (s.role !== 'admin') {
      window.location.href = 'dashboard.html';
      return null;
    }
    return s;
  }

  global.EPSession = {
    getSession,
    setSession,
    requireAuthPage,
    requireAdminPage,
  };
})(typeof window !== 'undefined' ? window : this);
