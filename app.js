// Global State
let currentActiveView = 'dola'; // 'dola', 'video', 'custom'
let deferredInstallPrompt = null;
let savedBookmarks = [];
let skills = [];
let activeSkill = null;

// Default Web Bookmarks
const DEFAULT_BOOKMARKS = [
  { id: 'bm-1', name: 'SaveVideoRaw', url: 'https://savevideoraw.com/' },
  { id: 'bm-2', name: 'Cobalt Tools', url: 'https://cobalt.tools/' },
  { id: 'bm-3', name: 'Dola Chat', url: 'https://www.dola.com/chat/' }
];

// Default Skills
const DEFAULT_SKILLS = [
  {
    id: 'skill-1',
    title: 'Dola Video Analyzer & Prompt Pro',
    filename: 'video-helper.md',
    content: `# Dola Video Analyzer & Prompt Pro\n> Prompt khusus kolaborasi dengan SaveVideoRaw\n\nInstruksi:\n1. Bantu pengguna menganalisis konten video yang telah diunduh.\n2. Berikan saran transkrip atau ringkasan poin utama.\n3. Siapkan rekomendasi format video terbaik untuk media sosial.\n`
  },
  {
    id: 'skill-2',
    title: 'Dola AI General Assistant',
    filename: 'general-assistant.md',
    content: `# Dola AI General Assistant\n> Instruksi respons cerdas dan ringkas\n\nInstruksi:\n1. Berikan jawaban langsung ke inti masalah.\n2. Gunakan bahasa Indonesia profesional dan mudah dipahami.\n`
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initNavigation();
  initDrawer();
  initLauncherModal();
  initSkills();
  loadBookmarks();
});

// 1. PWA ServiceWorker & Android Installation
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }

  const drawerInstallBtn = document.getElementById('drawer-btn-install');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    drawerInstallBtn.classList.remove('hidden');
  });

  drawerInstallBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplikasi berhasil dipasang di Android!');
      drawerInstallBtn.classList.add('hidden');
    }
    deferredInstallPrompt = null;
  });
}

// 2. Navigation: SATU TAMPILAN PENUH (Single View Switcher)
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const titleText = document.getElementById('app-title-text');
  const urlDisplay = document.getElementById('current-url-display');
  const loadingBar = document.getElementById('loading-bar');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      if (target === 'add') {
        openLauncherSheet();
      } else if (target === 'skills') {
        openSkillsSheet();
      } else {
        switchScreen(target);
      }
    });
  });

  // Top Bar Actions
  document.getElementById('btn-refresh').addEventListener('click', () => {
    triggerLoading();
    if (currentActiveView === 'dola') {
      document.getElementById('iframe-dola').src = document.getElementById('iframe-dola').src;
    } else if (currentActiveView === 'video') {
      document.getElementById('iframe-video').src = document.getElementById('iframe-video').src;
    } else if (currentActiveView === 'custom') {
      document.getElementById('iframe-custom').src = document.getElementById('iframe-custom').src;
    }
  });

  document.getElementById('btn-add-quick').addEventListener('click', openLauncherSheet);

  document.getElementById('btn-open-external').addEventListener('click', () => {
    let url = 'https://www.dola.com/chat/';
    if (currentActiveView === 'video') url = 'https://savevideoraw.com/';
    if (currentActiveView === 'custom') url = document.getElementById('iframe-custom').src;
    window.open(url, '_blank');
  });

  // Floating Quick Prompt Button
  document.getElementById('fab-skills').addEventListener('click', openSkillsSheet);
}

function switchScreen(viewName, customUrl = null, customTitle = null) {
  currentActiveView = viewName;

  // Sembunyikan semua layer dan aktifkan hanya layer yang dipilih
  document.querySelectorAll('.app-screen-layer').forEach(layer => layer.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.drawer-nav-item').forEach(d => d.classList.remove('active'));

  const titleText = document.getElementById('app-title-text');
  const urlDisplay = document.getElementById('current-url-display');

  if (viewName === 'dola') {
    document.getElementById('layer-dola').classList.add('active');
    document.getElementById('tab-dola').classList.add('active');
    document.getElementById('drawer-nav-dola').classList.add('active');
    titleText.textContent = 'Dola AI Chat';
    urlDisplay.textContent = 'dola.com/chat';
  } else if (viewName === 'video') {
    document.getElementById('layer-video').classList.add('active');
    document.getElementById('tab-video').classList.add('active');
    document.getElementById('drawer-nav-video').classList.add('active');
    titleText.textContent = 'SaveVideoRaw';
    urlDisplay.textContent = 'savevideoraw.com';
  } else if (viewName === 'custom') {
    document.getElementById('layer-custom').classList.add('active');
    if (customUrl) {
      document.getElementById('iframe-custom').src = customUrl;
    }
    titleText.textContent = customTitle || 'Web Tambahan';
    urlDisplay.textContent = (customUrl || document.getElementById('iframe-custom').src).replace(/^https?:\/\//i, '');
  }

  triggerLoading();
}

function triggerLoading() {
  const bar = document.getElementById('loading-bar');
  bar.classList.add('loading');
  setTimeout(() => bar.classList.remove('loading'), 1200);
}

// 3. Side Navigation Drawer (Garis Tiga)
function initDrawer() {
  const hamburger = document.getElementById('btn-hamburger');
  const drawer = document.getElementById('side-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const closeBtn = document.getElementById('drawer-close');

  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.remove('hidden');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.add('hidden');
  };

  hamburger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Drawer Navigation Items
  document.getElementById('drawer-nav-dola').addEventListener('click', () => {
    switchScreen('dola');
    closeDrawer();
  });
  document.getElementById('drawer-nav-video').addEventListener('click', () => {
    switchScreen('video');
    closeDrawer();
  });
  document.getElementById('drawer-btn-add-web').addEventListener('click', () => {
    closeDrawer();
    openLauncherSheet();
  });
  document.getElementById('drawer-nav-skills').addEventListener('click', () => {
    closeDrawer();
    openSkillsSheet();
  });
  document.getElementById('drawer-nav-ext').addEventListener('click', () => {
    closeDrawer();
    document.getElementById('modal-ext').classList.remove('hidden');
  });
  document.getElementById('close-ext-modal').addEventListener('click', () => {
    document.getElementById('modal-ext').classList.add('hidden');
  });
}

// 4. Quick Add Web Modal & Bookmark System
function initLauncherModal() {
  const modal = document.getElementById('modal-web-launcher');
  const closeBtn = document.getElementById('close-launcher-modal');
  const cancelBtn = document.getElementById('btn-cancel-launcher');
  const form = document.getElementById('form-launcher');

  const hide = () => modal.classList.add('hidden');
  closeBtn.addEventListener('click', hide);
  cancelBtn.addEventListener('click', hide);

  // Preset Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('input-web-name').value = chip.dataset.name;
      document.getElementById('input-web-url').value = chip.dataset.url;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-web-name').value.trim();
    let url = document.getElementById('input-web-url').value.trim();

    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    // Simpan ke daftar bookmark
    const exists = savedBookmarks.some(b => b.url === url);
    if (!exists) {
      savedBookmarks.push({ id: 'bm-' + Date.now(), name, url });
      saveBookmarks();
      renderBookmarks();
    }

    // Langsung buka di Satu Layar Utama Penuh
    switchScreen('custom', url, name);
    showToast(`Membuka "${name}" di Layar Utama`);
    hide();
    form.reset();
  });
}

function openLauncherSheet() {
  document.getElementById('modal-web-launcher').classList.remove('hidden');
}

function loadBookmarks() {
  const saved = localStorage.getItem('dolapro_bookmarks');
  if (saved) {
    try { savedBookmarks = JSON.parse(saved); } catch (e) { savedBookmarks = [...DEFAULT_BOOKMARKS]; }
  } else {
    savedBookmarks = [...DEFAULT_BOOKMARKS];
    saveBookmarks();
  }
  renderBookmarks();
}

function saveBookmarks() {
  localStorage.setItem('dolapro_bookmarks', JSON.stringify(savedBookmarks));
}

function renderBookmarks() {
  const list = document.getElementById('drawer-bookmark-list');
  list.innerHTML = '';

  savedBookmarks.forEach(bm => {
    const item = document.createElement('div');
    item.className = 'bm-item';
    item.innerHTML = `
      <span>${escapeHtml(bm.name)}</span>
      <div class="bm-btns">
        <button class="bm-btn-open">Buka</button>
        <button class="bm-btn-del" title="Hapus">✕</button>
      </div>
    `;

    item.querySelector('.bm-btn-open').addEventListener('click', () => {
      if (bm.url.includes('dola.com')) {
        switchScreen('dola');
      } else if (bm.url.includes('savevideoraw')) {
        switchScreen('video');
      } else {
        switchScreen('custom', bm.url, bm.name);
      }
      document.getElementById('side-drawer').classList.remove('open');
      document.getElementById('drawer-backdrop').classList.add('hidden');
      showToast(`Layar: ${bm.name}`);
    });

    item.querySelector('.bm-btn-del').addEventListener('click', () => {
      savedBookmarks = savedBookmarks.filter(x => x.id !== bm.id);
      saveBookmarks();
      renderBookmarks();
    });

    list.appendChild(item);
  });
}

// 5. Skill Hub
function initSkills() {
  const saved = localStorage.getItem('dolapro_skills');
  if (saved) {
    try { skills = JSON.parse(saved); } catch(e) { skills = [...DEFAULT_SKILLS]; }
  } else {
    skills = [...DEFAULT_SKILLS];
    saveSkills();
  }
  renderSkills();

  document.getElementById('close-skills-modal').addEventListener('click', () => {
    document.getElementById('modal-skills').classList.add('hidden');
  });

  // Upload Skill File (.md / .txt)
  const fileInput = document.getElementById('skill-file-input');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.name;

      const newSkill = {
        id: 'skill-' + Date.now(),
        title,
        filename: file.name,
        content
      };
      skills.push(newSkill);
      saveSkills();
      renderSkills();
      selectSkill(newSkill);
      showToast(`Skill "${title}" tersimpan!`);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function openSkillsSheet() {
  document.getElementById('modal-skills').classList.remove('hidden');
}

function saveSkills() {
  localStorage.setItem('dolapro_skills', JSON.stringify(skills));
  document.getElementById('bottom-skill-badge').textContent = skills.length;
}

function renderSkills() {
  const container = document.getElementById('skill-chips-nav');
  container.innerHTML = '';
  document.getElementById('bottom-skill-badge').textContent = skills.length;

  skills.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'skill-chip-item' + (activeSkill && activeSkill.id === s.id ? ' active' : '');
    chip.textContent = s.title;
    chip.addEventListener('click', () => selectSkill(s));
    container.appendChild(chip);
  });

  if (!activeSkill && skills.length > 0) selectSkill(skills[0]);
}

function selectSkill(s) {
  activeSkill = s;
  document.querySelectorAll('.skill-chip-item').forEach(c => c.classList.remove('active'));
  renderSkills();

  const box = document.getElementById('skill-detail-box');
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="color:white; font-size:13px;">${escapeHtml(s.title)}</strong>
        <div style="font-size:11px; color:#94a3b8;">${escapeHtml(s.filename)}</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button id="btn-copy-prompt" style="background:#6366f1; color:white; border:none; padding:5px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">📋 Salin</button>
        <button id="btn-delete-skill" style="background:#1e293b; color:#f87171; border:1px solid #334155; padding:5px 8px; border-radius:6px; font-size:12px; cursor:pointer;">🗑️</button>
      </div>
    </div>
    <pre>${escapeHtml(s.content)}</pre>
  `;

  document.getElementById('btn-copy-prompt').addEventListener('click', () => {
    navigator.clipboard.writeText(s.content);
    showToast('Prompt berhasil disalin ke clipboard!');
  });

  document.getElementById('btn-delete-skill').addEventListener('click', () => {
    if (confirm(`Hapus skill "${s.title}"?`)) {
      skills = skills.filter(x => x.id !== s.id);
      saveSkills();
      activeSkill = null;
      renderSkills();
      box.innerHTML = '<div class="empty-hint">Skill telah dihapus.</div>';
    }
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2200);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
