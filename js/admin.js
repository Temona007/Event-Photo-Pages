(function () {
  var EPSession = window.EPSession;
  var EPStore = window.EPStore;
  var EPUtils = window.EPUtils;

  var session = EPSession.requireAdminPage();
  if (!session) return;

  document.getElementById('btn-logout').addEventListener('click', function () {
    EPSession.setSession(null);
    window.location.href = 'index.html';
  });

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function render() {
    var users = EPStore.getAllUsers();
    var events = EPStore.getAllEvents();

    document.getElementById('users-body').innerHTML = users
      .map(function (u) {
        var canRemove = u.role !== 'admin';
        return (
          '<tr>' +
          '<td>' +
          escapeHtml(u.name || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(u.email) +
          '</td>' +
          '<td>' +
          escapeHtml(u.role) +
          '</td>' +
          '<td>' +
          (canRemove
            ? '<button type="button" class="btn btn--danger btn--small" data-remove-user="' +
              escapeHtml(u.id) +
              '">Remove</button>'
            : '—') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    document.getElementById('events-body').innerHTML = events
      .map(function (ev) {
        var owner = EPStore.getUserById(ev.ownerId);
        return (
          '<tr>' +
          '<td>' +
          escapeHtml(ev.name) +
          '</td>' +
          '<td><code style="font-size:0.85rem">' +
          escapeHtml(ev.slug) +
          '</code></td>' +
          '<td>' +
          (owner ? escapeHtml(owner.email) : '—') +
          '</td>' +
          '<td>' +
          '<button type="button" class="btn btn--danger btn--small" data-remove-event="' +
          escapeHtml(ev.id) +
          '">Remove</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    document.querySelectorAll('[data-remove-user]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-user');
        if (!confirm('Remove this user and their events?')) return;
        if (EPStore.adminRemoveUser(id)) {
          EPUtils.toast('User removed.');
          render();
        } else {
          EPUtils.toast('Could not remove user.');
        }
      });
    });

    document.querySelectorAll('[data-remove-event]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove-event');
        if (!confirm('Remove this event and all its photos?')) return;
        EPStore.adminRemoveEvent(id);
        EPUtils.toast('Event removed.');
        render();
      });
    });
  }

  render();
})();
