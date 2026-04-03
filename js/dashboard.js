(function () {
  var EPSession = window.EPSession;
  var EPStore = window.EPStore;
  var EPUtils = window.EPUtils;

  var session = EPSession.requireAuthPage();
  if (!session) return;

  document.getElementById('user-greet').textContent = session.name || session.email;
  if (session.role === 'admin') {
    var navAdmin = document.getElementById('nav-admin');
    if (navAdmin) navAdmin.hidden = false;
  }

  document.getElementById('btn-logout').addEventListener('click', function () {
    EPSession.setSession(null);
    window.location.href = 'index.html';
  });

  var createPanel = document.getElementById('create-panel');
  document.getElementById('btn-open-create').addEventListener('click', function () {
    createPanel.style.display = createPanel.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-cancel-create').addEventListener('click', function () {
    createPanel.style.display = 'none';
  });

  document.getElementById('form-create').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('ev-name').value;
    var date = document.getElementById('ev-date').value;
    var message = document.getElementById('ev-msg').value;
    var ev = EPStore.createEvent({ ownerId: session.userId, name: name, date: date, message: message });
    window.location.href = 'manage.html?slug=' + encodeURIComponent(ev.slug);
  });

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(iso) {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return iso;
    }
  }

  function render() {
    var events = EPStore.getEventsForOwner(session.userId);
    var wrap = document.getElementById('event-list-wrap');
    if (!events.length) {
      wrap.innerHTML =
        '<div class="card empty-state">No events yet. Create one to get your QR code and guest link.</div>';
      return;
    }
    wrap.innerHTML =
      '<div class="event-list">' +
      events
        .map(function (ev, i) {
          var n = EPStore.getPhotosForEvent(ev.id).length;
          var url = EPUtils.absoluteEventUrl(ev.slug);
          return (
            '<div class="event-row" style="animation-delay: ' +
            Math.min(i * 0.05, 0.4) +
            's">' +
            '<div>' +
            '<h3>' +
            escapeHtml(ev.name) +
            '</h3>' +
            '<div class="event-meta">' +
            (ev.date ? formatDate(ev.date) + ' · ' : '') +
            n +
            ' photo(s)</div>' +
            '<div class="event-meta" style="word-break: break-all; margin-top: 0.35rem; font-size: 0.8rem">' +
            escapeHtml(url) +
            '</div>' +
            '</div>' +
            '<div class="event-actions">' +
            '<a class="btn btn--primary btn--small" href="manage.html?slug=' +
            encodeURIComponent(ev.slug) +
            '">Manage</a>' +
            '<a class="btn btn--ghost btn--small" href="event.html?slug=' +
            encodeURIComponent(ev.slug) +
            '" target="_blank" rel="noopener">View page</a>' +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>';
  }

  render();
})();
