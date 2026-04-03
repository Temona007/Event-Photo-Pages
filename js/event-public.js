(function () {
  var EPStore = window.EPStore;
  var EPUtils = window.EPUtils;

  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');
  var main = document.getElementById('main');
  var fileInput = document.getElementById('guest-file');

  if (!slug) {
    main.innerHTML =
      '<div class="card"><p>Missing event link.</p><a href="index.html">Home</a></div>';
  } else {
    render();
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(iso) {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return iso;
    }
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

  function render() {
    var ev = EPStore.getEventBySlug(slug);
    if (!ev) {
      main.innerHTML =
        '<div class="card"><h2>Event not found</h2><p class="muted">Check the QR code or link.</p><a href="index.html">Home</a></div>';
      return;
    }

    var approved = EPStore.getPhotosForEvent(ev.id, { publicOnly: true });

    main.innerHTML =
      '<div class="card" style="animation-delay: 0s">' +
      '<h1 style="font-family: var(--font-display); font-size: clamp(1.5rem, 4vw, 2rem); margin: 0 0 0.5rem; line-height: 1.2">' +
      escapeHtml(ev.name) +
      '</h1>' +
      (ev.date ? '<p class="muted" style="margin: 0 0 0.75rem">' + formatDate(ev.date) + '</p>' : '') +
      (ev.message ? '<p style="margin: 0 0 1rem">' + escapeHtml(ev.message) + '</p>' : '') +
      '</div>' +
      '<div class="card mt-2" style="animation-delay: 0.06s">' +
      '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-top: 0">Photos</h2>' +
      '<div id="gallery" class="gallery"></div>' +
      (approved.length === 0
        ? '<p class="empty-state muted" style="padding: 1rem 0">No photos yet — be the first to share one.</p>'
        : '') +
      '</div>' +
      '<div class="card mt-2" style="animation-delay: 0.12s">' +
      '<h2 style="font-family: var(--font-display); font-size: 1.2rem; margin-top: 0">Add your photos</h2>' +
      '<p class="muted" style="font-size: 0.9rem; margin-top: -0.25rem">' +
      'No account needed. Uploads are reviewed by the host before appearing above.' +
      '</p>' +
      '<button type="button" class="btn btn--primary btn-block" id="btn-upload">Upload photos</button>' +
      '</div>';

    var gallery = document.getElementById('gallery');
    approved.forEach(function (p, i) {
      var div = document.createElement('div');
      div.className = 'gallery__item';
      div.style.animationDelay = 0.05 * i + 's';
      var img = document.createElement('img');
      img.src = p.dataUrl;
      img.alt = 'Event photo';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      div.appendChild(img);
      gallery.appendChild(div);
    });

    document.getElementById('btn-upload').addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.onchange = function () {
      var files = Array.from(fileInput.files || []);
      fileInput.value = '';
      if (!files.length) return;
      var eventId = ev.id;
      var chain = Promise.resolve();
      var added = 0;
      files.forEach(function (file) {
        chain = chain.then(function () {
          if (!file.type.startsWith('image/')) {
            EPUtils.toast('Please choose image files only.');
            return;
          }
          return readFileAsDataUrl(file).then(function (dataUrl) {
            EPStore.addPhoto({
              eventId: eventId,
              dataUrl: dataUrl,
              uploadedBy: 'guest',
              status: 'pending',
            });
            added++;
          });
        });
      });
      chain.then(function () {
        if (added) {
          EPUtils.toast('Thanks! Your photos were sent for approval.');
        }
      });
    };
  }
})();
