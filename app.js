// Global State
let deferredInstallPrompt = null;
let currentMode = 'split'; // 'split', 'panel1', 'panel2'
let customWebList = [];
let skills = [];
let activeSkill = null;
let isResizing = false;

// Default Web Bookmarks
const DEFAULT_WEB_BOOKMARKS = [
  { id: 'bm-1', name: 'SaveVideoRaw', url: 'https://savevideoraw.com/' },
  { id: 'bm-2', name: 'Dola Chat', url: 'https://www.dola.com/chat/' },
  { id: 'bm-3', name: 'Cobalt Video Downloader', url: 'https://cobalt.tools/' }
];

// Default Skills
const DEFAULT_SKILLS = [
  {
    id: 'skill-prompt-1',
    title: 'Dola Video Summary & Prompt Assistant',
    filename: 'video-helper.md',
    content: `# Dola Video Summary & Prompt Assistant\n> Gunakan skill ini bersama SaveVideoRaw untuk mengekstrak dan menganalisis video\n\nInstruksi:\n1. Analisis URL video yang baru diunduh.\n2. Buat ringkasan poin-poin utama video.\n3. Siapkan rekomendasi format ekspor terbaik.\n`
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initDrawer();
  initViewModes();
  initQuickWebAdder();
  initSkills();
  initResizer();
  loadSavedWebs();
});

// 1. PWA ServiceWorker & Install Handlers
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }

  const topInstallBtn = document.getElementById('btn-pwa-install');
  const drawerInstallBtn = document.getElementById('drawer-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    topInstallBtn.classList.remove('hidden');
    drawerInstallBtn.classList.remove('hidden');
  });

  const triggerInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplikasi berhasil dipasang di Android!');
      topInstallBtn.classList.add('hidden');
      drawerInstallBtn.classList.add('hidden');
    }
    deferredInstallPrompt = null;
  };

  topInstallBtn.addEventListener('click', triggerInstall);
  drawerInstallBtn.addEventListener('click', triggerInstall);
}

// 2. Drawer Navigation (Menu Garis Tiga)
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

  // Drawer View Mode Links
  document.getElementById('menu-view-split').addEventListener('click', () => {
    setViewMode('split');
    closeDrawer();
  });
  document.getElementById('menu-view-left').addEventListener('click', () => {
    setViewMode('panel1');
    closeDrawer();
  });
  document.getElementById('menu-view-right').addEventListener('click', () => {
    setViewMode('panel2');
    closeDrawer();
  });

  // Drawer Skills & Extensions
  document.getElementById('drawer-btn-skills').addEventListener('click', () => {
    closeDrawer();
    document.getElementById('modal-skills').classList.remove('hidden');
  });
  document.getElementById('drawer-btn-ext').addEventListener('click', () => {
    closeDrawer();
    document.getElementById('modal-ext').classList.remove('hidden');
  });
}

// 3. View Switcher (2 Tampilan / Split vs Single)
function initViewModes() {
  const tab1 = document.getElementById('view-tab-1');
  const tabSplit = document.getElementById('view-tab-split');
  const tab2 = document.getElementById('view-tab-2');

  tab1.addEventListener('click', () => setViewMode('panel1'));
  tabSplit.addEventListener('click', () => setViewMode('split'));
  tab2.addEventListener('click', () => setViewMode('panel2'));

  // Panel Control Buttons (Reload, Open External, Change URL)
  document.getElementById('reload-panel-1').addEventListener('click', () => {
    document.getElementById('iframe-1').src = document.getElementById('iframe-1').src;
  });
  document.getElementById('reload-panel-2').addEventListener('click', () => {
    document.getElementById('iframe-2').src = document.getElementById('iframe-2').src;
  });

  document.getElementById('ext-panel-1').addEventListener('click', () => {
    window.open(document.getElementById('iframe-1').src, '_blank');
  });
  document.getElementById('ext-panel-2').addEventListener('click', () => {
    window.open(document.getElementById('iframe-2').src, '_blank');
  });

  document.getElementById('change-panel-1').addEventListener('click', () => openChangeUrlModal(1));
  document.getElementById('change-panel-2').addEventListener('click', () => openChangeUrlModal(2));

  // Set default mode
  setViewMode('split');
}

function setViewMode(mode) {
  currentMode = mode;
  const p1 = document.getElementById('panel-1');
  const p2 = document.getElementById('panel-2');
  const ws = document.getElementById('workspace');
  const tag = document.getElementById('current-mode-tag');

  const tab1 = document.getElementById('view-tab-1');
  const tabSplit = document.getElementById('view-tab-split');
  const tab2 = document.getElementById('view-tab-2');

  tab1.classList.remove('active');
  tabSplit.classList.remove('active');
  tab2.classList.remove('active');

  p1.classList.remove('panel-hidden', 'panel-full');
  p2.classList.remove('panel-hidden', 'panel-full');
  ws.classList.remove('split-mode');

  if (mode === 'split') {
    tabSplit.classList.add('active');
    ws.classList.add('split-mode');
    tag.textContent = 'Split 2 Tampilan';
    p1.style.width = '';
    p2.style.width = '';
  } else if (mode === 'panel1') {
    tab1.classList.add('active');
    p2.classList.add('panel-hidden');
    p1.classList.add('panel-full');
    tag.textContent = 'SaveVideoRaw Penuh';
  } else if (mode === 'panel2') {
    tab2.classList.add('active');
    p1.classList.add('panel-hidden');
    p2.classList.add('panel-full');
    tag.textContent = 'Dola Chat Penuh';
  }
}

// 4. Quick Add Web Modal & Bookmark System
function initQuickWebAdder() {
  const modal = document.getElementById('modal-add-web');
  const btnTopAdd = document.getElementById('btn-quick-add');
  const btnDrawerAdd = document.getElementById('drawer-add-web-btn');
  const btnClose = document.getElementById('close-add-web-modal');
  const btnCancel = document.getElementById('cancel-add-web');
  const form = document.getElementById('form-add-web');

  const showModal = () => modal.classList.remove('hidden');
  const hideModal = () => modal.classList.add('hidden');

  btnTopAdd.addEventListener('click', showModal);
  btnDrawerAdd.addEventListener('click', () => {
    document.getElementById('side-drawer').classList.remove('open');
    document.getElementById('drawer-backdrop').classList.add('hidden');
    showModal();
  });
  btnClose.addEventListener('click', hideModal);
  btnCancel.addEventListener('click', hideModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('web-name-input').value.trim();
    let url = document.getElementById('web-url-input').value.trim();
    const target = form.elements['target-panel'].value;

    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const newBookmark = { id: 'bm-' + Date.now(), name, url };
    customWebList.push(newBookmark);
    saveWebs();
    renderWebBookmarks();

    if (target === '1') {
      document.getElementById('iframe-1').src = url;
      document.getElementById('title-panel-1').textContent = name;
      showToast(`Web "${name}" dibuka di Panel 1`);
    } else if (target === '2') {
      document.getElementById('iframe-2').src = url;
      document.getElementById('title-panel-2').textContent = name;
      showToast(`Web "${name}" dibuka di Panel 2`);
    } else {
      showToast(`Web "${name}" disimpan ke menu`);
    }

    form.reset();
    hideModal();
  });
}

function openChangeUrlModal(panelNum) {
  const modal = document.getElementById('modal-add-web');
  const form = document.getElementById('form-add-web');
  form.elements['target-panel'].value = String(panelNum);
  modal.classList.remove('hidden');
}

function loadSavedWebs() {
  const saved = localStorage.getItem('dolahub_webs');
  if (saved) {
    try { customWebList = JSON.parse(saved); } catch(e) { customWebList = [...DEFAULT_WEB_BOOKMARKS]; }
  } else {
    customWebList = [...DEFAULT_WEB_BOOKMARKS];
    saveWebs();
  }
  renderWebBookmarks();
}

function saveWebs() {
  localStorage.setItem('dolahub_webs', JSON.stringify(customWebList));
}

function renderWebBookmarks() {
  const container = document.getElementById('custom-web-list');
  container.innerHTML = '';

  customWebList.forEach((bm) => {
    const item = document.createElement('div');
    item.className = 'web-bookmark-item';
    item.innerHTML = `
      <span>${escapeHtml(bm.name)}</span>
      <div class="web-bookmark-actions">
        <button class="mini-action-btn" title="Buka di Panel 1">P1</button>
        <button class="mini-action-btn" title="Buka di Panel 2">P2</button>
        <button class="mini-action-btn" title="Hapus" style="color:#f87171;">✕</button>
      </div>
    `;

    const [btnP1, btnP2, btnDel] = item.querySelectorAll('.mini-action-btn');

    btnP1.addEventListener('click', () => {
      document.getElementById('iframe-1').src = bm.url;
      document.getElementById('title-panel-1').textContent = bm.name;
      showToast(`Dibuka di Panel 1: ${bm.name}`);
      document.getElementById('side-drawer').classList.remove('open');
      document.getElementById('drawer-backdrop').classList.add('hidden');
    });

    btnP2.addEventListener('click', () => {
      document.getElementById('iframe-2').src = bm.url;
      document.getElementById('title-panel-2').textContent = bm.name;
      showToast(`Dibuka di Panel 2: ${bm.name}`);
      document.getElementById('side-drawer').classList.remove('open');
      document.getElementById('drawer-backdrop').classList.add('hidden');
    });

    btnDel.addEventListener('click', () => {
      customWebList = customWebList.filter(x => x.id !== bm.id);
      saveWebs();
      renderWebBookmarks();
    });

    container.appendChild(item);
  });
}

// 5. Resizer Logic (Desktop & Tablet)
function initResizer() {
  const divider = document.getElementById('resizer-divider');
  const p1 = document.getElementById('panel-1');
  const ws = document.getElementById('workspace');

  divider.addEventListener('mousedown', () => {
    isResizing = true;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing || currentMode !== 'split') return;
    const rect = ws.getBoundingClientRect();
    const newWidth = e.clientX - rect.left;
    if (newWidth > 180 && newWidth < rect.width - 180) {
      const pct = (newWidth / rect.width) * 100;
      p1.style.width = `${pct}%`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = 'default';
    }
  });
}

// 6. Skill Hub Management
function initSkills() {
  const saved = localStorage.getItem('dolahub_skills');
  if (saved) {
    try { skills = JSON.parse(saved); } catch(e) { skills = [...DEFAULT_SKILLS]; }
  } else {
    skills = [...DEFAULT_SKILLS];
    saveSkills();
  }
  renderSkills();

  // Close modals
  document.getElementById('close-skills-modal').addEventListener('click', () => {
    document.getElementById('modal-skills').classList.add('hidden');
  });
  document.getElementById('close-ext-modal').addEventListener('click', () => {
    document.getElementById('modal-ext').classList.add('hidden');
  });

  // Upload Skill File
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
      showToast(`Skill "${title}" berhasil diimpor!`);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function saveSkills() {
  localStorage.setItem('dolahub_skills', JSON.stringify(skills));
  document.getElementById('drawer-skill-count').textContent = skills.length;
}

function renderSkills() {
  const nav = document.getElementById('skill-sidebar-list');
  nav.innerHTML = '';
  document.getElementById('drawer-skill-count').textContent = skills.length;

  skills.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'skill-tab-card' + (activeSkill && activeSkill.id === s.id ? ' active' : '');
    card.innerHTML = `
      <strong>${escapeHtml(s.title)}</strong>
      <small>📄 ${escapeHtml(s.filename)}</small>
    `;
    card.addEventListener('click', () => selectSkill(s));
    nav.appendChild(card);
  });

  if (!activeSkill && skills.length > 0) selectSkill(skills[0]);
}

function selectSkill(s) {
  activeSkill = s;
  document.querySelectorAll('.skill-tab-card').forEach(c => c.classList.remove('active'));
  renderSkills();

  const view = document.getElementById('skill-content-view');
  view.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h4 style="color:white; font-size:14px;">${escapeHtml(s.title)}</h4>
        <small style="color:#94a3b8;">${escapeHtml(s.filename)}</small>
      </div>
      <div style="display:flex; gap:6px;">
        <button id="btn-copy-skill" class="btn-primary-small">📋 Salin</button>
        <button id="btn-del-skill" class="btn-secondary" style="color:#f87171;">🗑️ Hapus</button>
      </div>
    </div>
    <pre>${escapeHtml(s.content)}</pre>
  `;

  document.getElementById('btn-copy-skill').addEventListener('click', () => {
    navigator.clipboard.writeText(s.content);
    showToast('Prompt berhasil disalin ke clipboard!');
  });

  document.getElementById('btn-del-skill').addEventListener('click', () => {
    if (confirm(`Hapus skill "${s.title}"?`)) {
      skills = skills.filter(x => x.id !== s.id);
      saveSkills();
      activeSkill = null;
      renderSkills();
      view.innerHTML = '<div class="empty-placeholder">Skill telah dihapus.</div>';
    }
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
