(function () {
  var EPSession = window.EPSession;
  var EPStore = window.EPStore;
  var EPUtils = window.EPUtils;

  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');
  var main = document.getElementById('main');
  var ownerFile = document.getElementById('owner-file');

  document.getElementById('btn-logout').addEventListener('click', function () {
    EPSession.setSession(null);
    window.location.href = 'index.html';
  });

  var session = EPSession.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  if (!slug) {
    main.innerHTML = '<div class="card"><p>Missing event.</p></div>';
    return;
  }

  var ev = EPStore.getEventBySlug(slug);
  if (!ev) {
    main.innerHTML = '<div class="card"><h2>Not found</h2></div>';
    return;
  }
  if (session.role !== 'admin' && ev.ownerId !== session.userId) {
    window.location.href = 'dashboard.html';
    return;
  }

  init(ev);

  function qrDataUrl(text, size) {
    if (typeof QRious === 'undefined') {
      return null;
    }
    var canvas = document.createElement('canvas');
    new QRious({
      element: canvas,
      value: text,
      size: size,
      level: 'H',
    });
    return canvas.toDataURL('image/png');
  }

  function init(ev) {
    var eventUrl = EPUtils.absoluteEventUrl(ev.slug);

    main.innerHTML =
      '<div class="card">' +
      '<h1 style="font-family: var(--font-display); margin: 0 0 0.5rem; font-size: 1.5rem">' +
      escapeHtml(ev.name) +
      '</h1>' +
      '<p class="muted" style="margin: 0; word-break: break-all; font-size: 0.9rem">' +
      escapeHtml(eventUrl) +
      '</p>' +
      '<div class="divider"></div>' +
      '<h2 style="font-family: var(--font-display); font-size: 1.15rem; margin: 0 0 0.75rem">QR code</h2>' +
      '<p class="muted" style="font-size: 0.9rem; margin-top: 0">Print-ready PNG — scans open your public page.</p>' +
      '<div id="qr-host" class="qr-wrap mt-2"></div>' +
      '<button type="button" class="btn btn--primary btn-block mt-2" id="btn-dl-qr">Download PNG (high resolution)</button>' +
      '</div>' +
      '<div class="card mt-2">' +
      '<h2 style="font-family: var(--font-display); font-size: 1.15rem; margin: 0 0 0.75rem">Pending guest uploads</h2>' +
      '<div id="pending-wrap"></div>' +
      '</div>' +
      '<div class="card mt-2">' +
      '<h2 style="font-family: var(--font-display); font-size: 1.15rem; margin: 0 0 0.75rem">All photos</h2>' +
      '<p class="muted" style="font-size: 0.85rem; margin-top: -0.25rem">' +
      'Add your own shots or remove any image (including guest uploads).' +
      '</p>' +
      '<button type="button" class="btn btn--primary" id="btn-owner-upload">Add photos</button>' +
      '<div id="all-gallery" class="gallery mt-2"></div>' +
      '</div>';

    var qrHost = document.getElementById('qr-host');
    var hiResDataUrl = '';

    var preview = qrDataUrl(eventUrl, 240);
    if (preview) {
      var img = document.createElement('img');
      img.src = preview;
      img.alt = 'QR code';
      qrHost.appendChild(img);
      hiResDataUrl = qrDataUrl(eventUrl, 1024) || '';
    } else {
      qrHost.innerHTML =
        '<p class="qr-hint">Could not load QR library. Check your network and reload.</p>';
    }

    document.getElementById('btn-dl-qr').addEventListener('click', function () {
      if (!hiResDataUrl) {
        hiResDataUrl = qrDataUrl(eventUrl, 1024) || '';
      }
      if (!hiResDataUrl) {
        EPUtils.toast('Could not generate download.');
        return;
      }
      var a = document.createElement('a');
      a.href = hiResDataUrl;
      a.download = 'qr-' + ev.slug + '.png';
      a.click();
      EPUtils.toast('Download started.');
    });

    function renderGalleries() {
      var all = EPStore.getPhotosForEvent(ev.id);
      var pending = all.filter(function (p) {
        return p.status === 'pending';
      });

      var pendingWrap = document.getElementById('pending-wrap');
      if (!pending.length) {
        pendingWrap.innerHTML = '<p class="muted" style="margin: 0">No pending uploads.</p>';
      } else {
        pendingWrap.innerHTML =
          '<div class="gallery">' +
          pending
            .map(function (p) {
              return (
                '<div class="gallery__item" data-id="' +
                p.id +
                '">' +
                '<img src="' +
                p.dataUrl +
                '" alt="Pending" loading="lazy" />' +
                '<div style="position:absolute; bottom:0; left:0; right:0; padding:6px; background:linear-gradient(transparent,rgba(0,0,0,.75)); display:flex; gap:6px; justify-content:center">' +
                '<button type="button" class="btn btn--primary btn--small" data-approve="' +
                p.id +
                '">Approve</button>' +
                '<button type="button" class="btn btn--danger btn--small" data-reject="' +
                p.id +
                '">Delete</button>' +
                '</div>' +
                '</div>'
              );
            })
            .join('') +
          '</div>';

        pendingWrap.querySelectorAll('[data-approve]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            EPStore.setPhotoStatus(btn.getAttribute('data-approve'), 'approved');
            EPUtils.toast('Approved.');
            renderGalleries();
          });
        });
        pendingWrap.querySelectorAll('[data-reject]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            EPStore.deletePhoto(btn.getAttribute('data-reject'));
            EPUtils.toast('Removed.');
            renderGalleries();
          });
        });
      }

      fillGallery('all-gallery', all, true);
    }

    function fillGallery(id, photos, showDelete) {
      var el = document.getElementById(id);
      el.innerHTML = '';
      if (!photos.length) {
        el.innerHTML = '<p class="muted empty-state" style="grid-column: 1/-1">No photos yet.</p>';
        return;
      }
      photos.forEach(function (p, i) {
        var div = document.createElement('div');
        div.className = 'gallery__item';
        div.style.animationDelay = i * 0.03 + 's';
        var img = document.createElement('img');
        img.src = p.dataUrl;
        img.alt = 'Photo';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        div.appendChild(img);
        if (showDelete) {
          var del = document.createElement('button');
          del.type = 'button';
          del.className = 'delete';
          del.setAttribute('aria-label', 'Delete photo');
          del.textContent = '×';
          del.addEventListener('click', function () {
            if (confirm('Delete this photo?')) {
              EPStore.deletePhoto(p.id);
              EPUtils.toast('Deleted.');
              renderGalleries();
            }
          });
          div.appendChild(del);
        }
        if (p.status === 'pending') {
          var b = document.createElement('span');
          b.className = 'badge';
          b.style.cssText = 'position:absolute;top:6px;left:6px';
          b.textContent = 'Pending';
          div.appendChild(b);
        } else if (p.uploadedBy === 'guest') {
          var b2 = document.createElement('span');
          b2.className = 'badge badge--ok';
          b2.style.cssText = 'position:absolute;top:6px;left:6px';
          b2.textContent = 'Guest';
          div.appendChild(b2);
        }
        el.appendChild(div);
      });
    }

    document.getElementById('btn-owner-upload').addEventListener('click', function () {
      ownerFile.click();
    });
    ownerFile.onchange = function () {
      var files = Array.from(ownerFile.files || []);
      ownerFile.value = '';
      var chain = Promise.resolve();
      files.forEach(function (file) {
        if (!file.type.startsWith('image/')) return;
        chain = chain.then(function () {
          return readFileAsDataUrl(file).then(function (dataUrl) {
            EPStore.addPhoto({
              eventId: ev.id,
              dataUrl: dataUrl,
              uploadedBy: 'owner',
              status: 'approved',
            });
          });
        });
      });
      chain.then(function () {
        EPUtils.toast('Photos added.');
        renderGalleries();
      });
    };

    renderGalleries();
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        resolve(r.result);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
