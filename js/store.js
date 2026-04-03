/**
 * Demo persistence — localStorage. Replace with API in production.
 */
(function (global) {
  const STORAGE_KEY = 'eventPhotoPages_v1';

  const demoSeed = () => ({
    users: [
      { id: 'u1', email: 'demo@demo.com', password: 'demo123', role: 'user', name: 'Demo User' },
      { id: 'u2', email: 'admin@demo.com', password: 'admin123', role: 'admin', name: 'Admin' },
    ],
    events: [
      {
        id: 'e1',
        slug: 'john-smith-wedding',
        name: 'John & Smith Wedding',
        date: '2026-06-14',
        message: 'Thank you for celebrating with us! Share your photos below.',
        ownerId: 'u1',
        createdAt: new Date().toISOString(),
      },
    ],
    photos: [
      {
        id: 'p1',
        eventId: 'e1',
        dataUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        uploadedBy: 'owner',
        status: 'approved',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        eventId: 'e1',
        dataUrl: 'https://images.unsplash.com/photo-1465495976277-438c216b0fca?w=800&q=80',
        uploadedBy: 'guest',
        status: 'approved',
        createdAt: new Date().toISOString(),
      },
    ],
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const seed = demoSeed();
    save(seed);
    return seed;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getState() {
    return load();
  }

  function login(email, password) {
    const data = load();
    const user = data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    return user || null;
  }

  function signup(email, password, name) {
    const data = load();
    if (data.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { error: 'Email already registered' };
    }
    const id = 'u' + Date.now();
    data.users.push({
      id,
      email: email.trim(),
      password,
      role: 'user',
      name: name || email.split('@')[0],
    });
    save(data);
    return { user: data.users.find((u) => u.id === id) };
  }

  function getUserById(id) {
    return load().users.find((u) => u.id === id) || null;
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function createEvent({ ownerId, name, date, message }) {
    const data = load();
    let base = slugify(name) || 'event';
    let slug = base;
    let n = 1;
    while (data.events.some((e) => e.slug === slug)) {
      slug = base + '-' + n++;
    }
    const ev = {
      id: 'e' + Date.now(),
      slug,
      name: name.trim(),
      date: date || '',
      message: (message || '').trim(),
      ownerId,
      createdAt: new Date().toISOString(),
    };
    data.events.push(ev);
    save(data);
    return ev;
  }

  function getEventBySlug(slug) {
    return load().events.find((e) => e.slug === slug) || null;
  }

  function getEventsForOwner(ownerId) {
    return load().events.filter((e) => e.ownerId === ownerId);
  }

  function deleteEvent(eventId) {
    const data = load();
    data.events = data.events.filter((e) => e.id !== eventId);
    data.photos = data.photos.filter((p) => p.eventId !== eventId);
    save(data);
  }

  function addPhoto({ eventId, dataUrl, uploadedBy, status }) {
    const data = load();
    const photo = {
      id: 'p' + Date.now() + Math.random().toString(36).slice(2, 8),
      eventId,
      dataUrl,
      uploadedBy,
      status,
      createdAt: new Date().toISOString(),
    };
    data.photos.push(photo);
    save(data);
    return photo;
  }

  function getPhotosForEvent(eventId, opts) {
    opts = opts || {};
    let list = load().photos.filter((p) => p.eventId === eventId);
    if (opts.publicOnly) list = list.filter((p) => p.status === 'approved');
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function deletePhoto(photoId) {
    const data = load();
    data.photos = data.photos.filter((p) => p.id !== photoId);
    save(data);
  }

  function setPhotoStatus(photoId, status) {
    const data = load();
    const p = data.photos.find((x) => x.id === photoId);
    if (p) {
      p.status = status;
      save(data);
    }
    return p;
  }

  function getAllUsers() {
    return load().users.map(function (u) {
      const copy = Object.assign({}, u);
      delete copy.password;
      return copy;
    });
  }

  function getAllEvents() {
    return load().events;
  }

  function adminRemoveUser(userId) {
    const data = load();
    if (userId === 'u2') return false;
    data.users = data.users.filter((u) => u.id !== userId);
    const evIds = data.events.filter((e) => e.ownerId === userId).map((e) => e.id);
    data.events = data.events.filter((e) => e.ownerId !== userId);
    data.photos = data.photos.filter((p) => evIds.indexOf(p.eventId) === -1);
    save(data);
    return true;
  }

  function adminRemoveEvent(eventId) {
    deleteEvent(eventId);
  }

  global.EPStore = {
    getState,
    login,
    signup,
    getUserById,
    slugify,
    createEvent,
    getEventBySlug,
    getEventsForOwner,
    deleteEvent,
    addPhoto,
    getPhotosForEvent,
    deletePhoto,
    setPhotoStatus,
    getAllUsers,
    getAllEvents,
    adminRemoveUser,
    adminRemoveEvent,
  };
})(typeof window !== 'undefined' ? window : this);
