// State
let deferredInstallPrompt = null;
let currentSkills = [];
let activeSkill = null;
let isResizing = false;

// Default Skills
const DEFAULT_SKILLS = [
  {
    id: 'skill-prompt-assistant',
    title: 'Dola & AI Studio Workflow Assistant',
    filename: 'prompt-assistant.md',
    content: `# Dola & AI Studio Workflow Assistant\n> Skill kolaborasi interaktif antara Google AI Studio dan Dola Chat\n\n## Instruksi Otomatis:\n1. Analisis prompt dari Google AI Studio dan sederhanakan instruksi sebelum dikirim ke Dola.\n2. Saat membuat kode aplikasi desktop / PWA, selalu sertakan arsitektur berkas dan cara instalasi.\n3. Format kode selalu rapi dan siap dijalankan tanpa error sintaks.\n`
  },
  {
    id: 'skill-crawler-parser',
    title: 'Dola Web Extractor & Research Skill',
    filename: 'web-extractor.md',
    content: `# Dola Web Extractor & Research Skill\n> Format ekstraksi insight riset dan ringkasan website\n\n## Instruksi:\n1. Ekstrak data kunci menjadi tabel ringkas.\n2. Berikan kesimpulan 3 butir penting di awal respons.\n`
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initSkills();
  initResizer();
  initNavigation();
  initModals();
});

// PWA Service Worker & Install Prompt Registration
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[PWA] ServiceWorker terdaftar:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Gagal mendaftarkan ServiceWorker:', err);
      });
    });
  }

  const installBtn = document.getElementById('btn-pwa-install');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.classList.remove('hidden');
    console.log('[PWA] BeforeInstallPrompt siap!');
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log('[PWA] Hasil respons pengguna:', outcome);
    deferredInstallPrompt = null;
    installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    showToast('Aplikasi Dola Multi Browser berhasil diinstal!');
    installBtn.classList.add('hidden');
  });
}

// Navigation & URL Handling
function initNavigation() {
  const leftIframe = document.getElementById('iframe-left');
  const rightIframe = document.getElementById('iframe-right');
  const leftUrl = document.getElementById('left-url');
  const rightUrl = document.getElementById('right-url');

  document.getElementById('left-reload').addEventListener('click', () => {
    leftIframe.src = leftUrl.value;
  });
  document.getElementById('right-reload').addEventListener('click', () => {
    rightIframe.src = rightUrl.value;
  });

  document.getElementById('left-external').addEventListener('click', () => {
    window.open(leftUrl.value, '_blank');
  });
  document.getElementById('right-external').addEventListener('click', () => {
    window.open(rightUrl.value, '_blank');
  });

  leftUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') leftIframe.src = ensureHttps(leftUrl.value);
  });
  rightUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') rightIframe.src = ensureHttps(rightUrl.value);
  });

  // Preset Ratio Buttons
  const p50 = document.getElementById('preset-50');
  const p70 = document.getElementById('preset-70');
  const p30 = document.getElementById('preset-30');
  const leftPanel = document.getElementById('panel-left');

  p50.addEventListener('click', () => {
    setActivePill(p50);
    leftPanel.style.width = '50%';
  });
  p70.addEventListener('click', () => {
    setActivePill(p70);
    leftPanel.style.width = '70%';
  });
  p30.addEventListener('click', () => {
    setActivePill(p30);
    leftPanel.style.width = '30%';
  });
}

function setActivePill(btn) {
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function ensureHttps(url) {
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

// Resizer logic
function initResizer() {
  const divider = document.getElementById('divider');
  const leftPanel = document.getElementById('panel-left');
  const workspace = document.getElementById('workspace');

  divider.addEventListener('mousedown', () => {
    isResizing = true;
    divider.classList.add('active');
    document.body.style.cursor = 'col-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const bounds = workspace.getBoundingClientRect();
    const newWidth = e.clientX - bounds.left;
    const minWidth = 200;
    const maxWidth = bounds.width - 200;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      const percentage = (newWidth / bounds.width) * 100;
      leftPanel.style.width = `${percentage}%`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      divider.classList.remove('active');
      document.body.style.cursor = 'default';
    }
  });
}

// Skills Management (Local Storage + Import)
function initSkills() {
  const saved = localStorage.getItem('dola_skills');
  if (saved) {
    try {
      currentSkills = JSON.parse(saved);
    } catch (e) {
      currentSkills = [...DEFAULT_SKILLS];
    }
  } else {
    currentSkills = [...DEFAULT_SKILLS];
    saveSkills();
  }
  renderSkillsNav();

  // Import Skill File Handler
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
        title: title,
        filename: file.name,
        content: content
      };

      currentSkills.push(newSkill);
      saveSkills();
      renderSkillsNav();
      selectSkill(newSkill);
      showToast(`Skill "${title}" berhasil ditambahkan!`);
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function saveSkills() {
  localStorage.setItem('dola_skills', JSON.stringify(currentSkills));
  document.getElementById('skill-count').textContent = currentSkills.length;
}

function renderSkillsNav() {
  const navList = document.getElementById('skill-nav-list');
  navList.innerHTML = '';
  document.getElementById('skill-count').textContent = currentSkills.length;

  if (currentSkills.length === 0) {
    navList.innerHTML = '<div class="empty-state">Belum ada skill tersimpan.</div>';
    return;
  }

  currentSkills.forEach((skill) => {
    const card = document.createElement('div');
    card.className = 'skill-card' + (activeSkill && activeSkill.id === skill.id ? ' active' : '');
    card.innerHTML = `
      <h4>${escapeHtml(skill.title)}</h4>
      <p>📄 ${escapeHtml(skill.filename || 'SKILL.md')}</p>
    `;
    card.addEventListener('click', () => selectSkill(skill));
    navList.appendChild(card);
  });

  if (!activeSkill && currentSkills.length > 0) {
    selectSkill(currentSkills[0]);
  }
}

function selectSkill(skill) {
  activeSkill = skill;
  document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('active'));
  renderSkillsNav();

  const preview = document.getElementById('skill-preview-area');
  preview.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3>${escapeHtml(skill.title)}</h3>
        <small style="color: #94a3b8;">Berkas: ${escapeHtml(skill.filename || 'SKILL.md')}</small>
      </div>
      <div style="display:flex; gap: 8px;">
        <button id="btn-copy-prompt" class="action-btn">📋 Salin Instruksi</button>
        <button id="btn-delete-skill" class="action-btn secondary" style="color: #f87171;">🗑️ Hapus</button>
      </div>
    </div>
    <pre>${escapeHtml(skill.content)}</pre>
  `;

  document.getElementById('btn-copy-prompt').addEventListener('click', () => {
    navigator.clipboard.writeText(skill.content);
    showToast('Instruksi skill berhasil disalin ke clipboard!');
  });

  document.getElementById('btn-delete-skill').addEventListener('click', () => {
    if (confirm(`Yakin ingin menghapus skill "${skill.title}"?`)) {
      currentSkills = currentSkills.filter(s => s.id !== skill.id);
      saveSkills();
      activeSkill = null;
      renderSkillsNav();
      document.getElementById('skill-preview-area').innerHTML = '<div class="empty-state">Skill berhasil dihapus.</div>';
      showToast('Skill dihapus.');
    }
  });
}

// Modals
function initModals() {
  const modalSkills = document.getElementById('modal-skills');
  const modalExt = document.getElementById('modal-ext');

  document.getElementById('btn-skills-hub').addEventListener('click', () => {
    modalSkills.classList.remove('hidden');
  });
  document.getElementById('modal-skills-close').addEventListener('click', () => {
    modalSkills.classList.add('hidden');
  });

  document.getElementById('btn-ext-hub').addEventListener('click', () => {
    modalExt.classList.remove('hidden');
  });
  document.getElementById('modal-ext-close').addEventListener('click', () => {
    modalExt.classList.add('hidden');
  });
}

// Helpers
function openPopup(panel) {
  const url = panel === 'left' ? document.getElementById('left-url').value : document.getElementById('right-url').value;
  window.open(url, panel + '_popup', 'width=700,height=900,menubar=no,toolbar=no,location=yes');
}

function openDirect(panel) {
  const url = panel === 'left' ? document.getElementById('left-url').value : document.getElementById('right-url').value;
  window.open(url, '_blank');
}

function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
