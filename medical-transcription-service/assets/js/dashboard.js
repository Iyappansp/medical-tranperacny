/**
 * dashboard.js — Client Portal
 * Handles: file upload, job table, status management, skeleton loaders
 */

'use strict';

// ============================================================
// MOCK DATA
// ============================================================
const MockJobs = [
  { id: 'JOB-2026-001', filename: 'patient_consult_dr_smith_01.mp3', duration: '14:32', uploaded: '2026-01-15', status: 'completed', pages: 6, size: '24.3 MB', specialty: 'Cardiology' },
  { id: 'JOB-2026-002', filename: 'ER_report_afternoon_shift.wav', duration: '08:17', uploaded: '2026-01-16', status: 'processing', pages: null, size: '18.9 MB', specialty: 'Emergency Medicine' },
  { id: 'JOB-2026-003', filename: 'radiology_chest_xray_notes.m4a', duration: '05:44', uploaded: '2026-01-17', status: 'completed', pages: 3, size: '11.2 MB', specialty: 'Radiology' },
  { id: 'JOB-2026-004', filename: 'surgery_debrief_2026_01_17.mp3', duration: '22:08', uploaded: '2026-01-17', status: 'pending', pages: null, size: '42.1 MB', specialty: 'Surgery' },
  { id: 'JOB-2026-005', filename: 'pediatrics_followup_notes.wav', duration: '11:55', uploaded: '2026-01-18', status: 'completed', pages: 5, size: '26.7 MB', specialty: 'Pediatrics' },
  { id: 'JOB-2026-006', filename: 'oncology_treatment_plan.mp3', duration: '31:40', uploaded: '2026-01-19', status: 'error', pages: null, size: '58.4 MB', specialty: 'Oncology' },
];

// ============================================================
// DASHBOARD STATE
// ============================================================
const DashboardState = {
  jobs: [],
  filter: 'all',
  sortBy: 'uploaded',
  sortDir: 'desc',
  searchQuery: '',
  uploadQueue: [],
};

// ============================================================
// UTILITIES
// ============================================================
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(status) {
  const map = {
    completed: { cls: 'badge-success', label: 'Completed' },
    processing: { cls: 'badge-info', label: 'Processing' },
    pending: { cls: 'badge-neutral', label: 'Pending' },
    error: { cls: 'badge-error', label: 'Error' },
  };
  const s = map[status] || map.pending;
  return `<span class="badge ${s.cls}" aria-label="Status: ${s.label}">${s.label}</span>`;
}

// ============================================================
// SKELETON LOADERS
// ============================================================
function showSkeletons(container, count = 5) {
  container.innerHTML = Array.from({ length: count }, () => `
    <tr>
      <td><div class="flex gap-3 items-center">
        <div class="skeleton skeleton-avatar" style="width:36px;height:36px;border-radius:6px"></div>
        <div style="flex:1"><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:60%"></div></div>
      </div></td>
      <td><div class="skeleton skeleton-badge"></div></td>
      <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:80px"></div></td>
      <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:60px"></div></td>
      <td><div class="skeleton skeleton-btn"></div></td>
    </tr>
  `).join('');
}

function showStatSkeletons() {
  document.querySelectorAll('[data-stat-value]').forEach(el => {
    el.innerHTML = '<div class="skeleton" style="height:32px;width:60px;display:inline-block"></div>';
  });
}

// ============================================================
// STATS CARDS
// ============================================================
function updateStats() {
  const jobs = DashboardState.jobs;
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    pending: jobs.filter(j => j.status === 'pending').length,
  };

  document.querySelectorAll('[data-stat-value]').forEach(el => {
    const key = el.dataset.statValue;
    if (stats[key] !== undefined) {
      el.textContent = stats[key];
    }
  });
}

// ============================================================
// JOBS TABLE
// ============================================================
function filteredJobs() {
  let jobs = [...DashboardState.jobs];

  if (DashboardState.filter !== 'all') {
    jobs = jobs.filter(j => j.status === DashboardState.filter);
  }

  if (DashboardState.searchQuery) {
    const q = DashboardState.searchQuery.toLowerCase();
    jobs = jobs.filter(j =>
      j.filename.toLowerCase().includes(q) ||
      j.id.toLowerCase().includes(q) ||
      j.specialty.toLowerCase().includes(q)
    );
  }

  jobs.sort((a, b) => {
    let va = a[DashboardState.sortBy];
    let vb = b[DashboardState.sortBy];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return DashboardState.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return DashboardState.sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return jobs;
}

function renderJobs() {
  const tbody = document.querySelector('[data-jobs-tbody]');
  const emptyState = document.querySelector('[data-jobs-empty]');
  if (!tbody) return;

  const jobs = filteredJobs();

  if (jobs.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = jobs.map(job => `
    <tr data-job-id="${job.id}">
      <td>
        <div class="flex gap-3 items-center">
          <div class="file-icon" aria-hidden="true">🎙️</div>
          <div>
            <div class="job-filename font-ui font-semibold text-sm" style="color:var(--text-primary);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${job.filename}">${job.filename}</div>
            <div class="text-xs text-muted font-ui">${job.id} · ${job.specialty}</div>
          </div>
        </div>
      </td>
      <td>${getStatusBadge(job.status)}</td>
      <td class="hide-mobile font-ui text-sm" style="color:var(--text-secondary)">${formatDate(job.uploaded)}</td>
      <td class="hide-mobile font-ui text-sm" style="color:var(--text-secondary)">${job.duration}</td>
      <td>
        <div class="flex gap-2">
          ${job.status === 'completed'
      ? `<button class="btn btn-sm btn-success" onclick="DashboardActions.download('${job.id}')" aria-label="Download transcript for ${job.filename}">↓ Download</button>`
      : job.status === 'error'
        ? `<button class="btn btn-sm btn-danger" onclick="DashboardActions.retry('${job.id}')" aria-label="Retry job ${job.id}">↺ Retry</button>`
        : `<button class="btn btn-sm btn-ghost" disabled aria-label="Job ${job.status}">···</button>`
    }
          <button class="btn btn-sm btn-ghost btn-icon" onclick="DashboardActions.viewDetails('${job.id}')" aria-label="View details for ${job.id}">👁</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================================
// JOB DETAIL MODAL
// ============================================================
function showJobModal(job) {
  let modal = document.getElementById('job-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'job-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.5)';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="card" style="width:100%;max-width:560px;padding:0;overflow:hidden" role="document">
      <div class="card-header">
        <div>
          <h3 id="modal-title" style="font-family:var(--font-ui);font-size:1rem;font-weight:700">Job Details</h3>
          <p class="text-xs text-muted font-ui" style="margin:0">${job.id}</p>
        </div>
        <button class="btn btn-ghost btn-icon" onclick="document.getElementById('job-modal').remove()" aria-label="Close modal">✕</button>
      </div>
      <div class="card-body">
        <dl style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${[
      ['File Name', job.filename],
      ['Status', getStatusBadge(job.status)],
      ['Specialty', job.specialty],
      ['Duration', job.duration],
      ['Uploaded', formatDate(job.uploaded)],
      ['File Size', job.size],
      ['Pages', job.pages ? job.pages + ' pages' : '—'],
    ].map(([k, v]) => `
            <div>
              <dt class="text-xs text-muted font-ui" style="text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${k}</dt>
              <dd class="font-ui text-sm" style="color:var(--text-primary)">${v}</dd>
            </div>
          `).join('')}
        </dl>
      </div>
      <div class="card-footer" style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('job-modal').remove()">Close</button>
        ${job.status === 'completed'
      ? `<button class="btn btn-primary btn-sm" onclick="DashboardActions.download('${job.id}');document.getElementById('job-modal').remove()">↓ Download Transcript</button>`
      : ''}
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Trap focus
  setTimeout(() => {
    const first = modal.querySelector('button');
    if (first) first.focus();
  }, 50);
}

// ============================================================
// DASHBOARD ACTIONS
// ============================================================
window.DashboardActions = {
  download(jobId) {
    const job = DashboardState.jobs.find(j => j.id === jobId);
    if (!job) return;
    window.Toast?.show(`Downloading transcript for ${job.filename}…`, 'success');
    // Simulate download
    const a = document.createElement('a');
    const content = `MEDICAL TRANSCRIPTION\n${'='.repeat(40)}\nJob ID: ${job.id}\nFile: ${job.filename}\nSpecialty: ${job.specialty}\nDate: ${formatDate(job.uploaded)}\nDuration: ${job.duration}\n\n[Transcript content would appear here]\n\nThis is a demo transcript file.\n`;
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = job.filename.replace(/\.[^.]+$/, '') + '_transcript.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  retry(jobId) {
    const job = DashboardState.jobs.find(j => j.id === jobId);
    if (!job) return;
    job.status = 'pending';
    renderJobs();
    window.Toast?.show(`Job ${jobId} requeued for processing.`, 'info');
  },

  viewDetails(jobId) {
    const job = DashboardState.jobs.find(j => j.id === jobId);
    if (job) showJobModal(job);
  },
};

// ============================================================
// FILE UPLOAD — Drag & Drop Zone
// ============================================================
function initUploadZone() {
  const zone = document.querySelector('[data-upload-zone]');
  const fileInput = document.querySelector('[data-file-input]');
  const uploadBtn = document.querySelector('[data-upload-btn]');
  const uploadList = document.querySelector('[data-upload-list]');
  const submitBtn = document.querySelector('[data-submit-upload]');

  if (!zone || !fileInput) return;

  const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac'];
  const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

  function handleFiles(files) {
    let added = 0;
    Array.from(files).forEach(file => {
      if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i)) {
        window.Toast?.show(`${file.name}: Unsupported format. Use MP3, WAV, M4A, or FLAC.`, 'error');
        return;
      }
      if (file.size > MAX_SIZE) {
        window.Toast?.show(`${file.name}: File exceeds 200 MB limit.`, 'error');
        return;
      }
      if (DashboardState.uploadQueue.find(f => f.name === file.name && f.size === file.size)) return;
      DashboardState.uploadQueue.push(file);
      added++;
    });
    if (added > 0) renderUploadList();
  }

  function renderUploadList() {
    if (!uploadList) return;
    if (DashboardState.uploadQueue.length === 0) {
      uploadList.innerHTML = '';
      if (submitBtn) submitBtn.style.display = 'none';
      return;
    }

    uploadList.innerHTML = DashboardState.uploadQueue.map((file, i) => `
      <div class="upload-item flex items-center gap-3" style="padding:10px;background:var(--surface-secondary);border-radius:8px;margin-top:8px">
        <span style="font-size:1.25rem" aria-hidden="true">🎵</span>
        <div style="flex:1;min-width:0">
          <div class="font-ui text-sm font-semibold" style="color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</div>
          <div class="text-xs text-muted font-ui">${formatFileSize(file.size)}</div>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="DashboardState.uploadQueue.splice(${i},1);DashboardActions && renderUploadList && renderUploadList()" aria-label="Remove ${file.name}" style="color:var(--color-error)">✕</button>
      </div>
    `).join('');

    // Update submit button
    if (submitBtn) {
      submitBtn.style.display = 'flex';
      submitBtn.textContent = `Upload ${DashboardState.uploadQueue.length} File${DashboardState.uploadQueue.length > 1 ? 's' : ''}`;
    }
  }

  // Make renderUploadList accessible globally for inline onclick
  window.renderUploadList = renderUploadList;

  // Drag events
  ['dragenter', 'dragover'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
    });
  });
  zone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  if (uploadBtn) uploadBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  // Submit upload
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (DashboardState.uploadQueue.length === 0) return;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Uploading…';

      setTimeout(() => {
        DashboardState.uploadQueue.forEach(file => {
          const newJob = {
            id: 'JOB-2026-' + String(Date.now()).slice(-4),
            filename: file.name,
            duration: '--:--',
            uploaded: new Date().toISOString().split('T')[0],
            status: 'pending',
            pages: null,
            size: formatFileSize(file.size),
            specialty: 'General',
          };
          DashboardState.jobs.unshift(newJob);
        });

        DashboardState.uploadQueue = [];
        renderUploadList();
        renderJobs();
        updateStats();

        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Files';
        submitBtn.style.display = 'none';

        window.Toast?.show('Files uploaded successfully! Jobs queued for transcription.', 'success');
      }, 2000);
    });
  }
}

// ============================================================
// FILTER TABS
// ============================================================
function initFilters() {
  document.querySelectorAll('[data-filter-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      DashboardState.filter = btn.dataset.filterBtn;
      document.querySelectorAll('[data-filter-btn]').forEach(b => {
        b.classList.toggle('active-filter', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      renderJobs();
    });
  });

  // Search
  const search = document.querySelector('[data-search-input]');
  if (search) {
    search.addEventListener('input', (e) => {
      DashboardState.searchQuery = e.target.value;
      renderJobs();
    });
  }

  // Sort headers
  document.querySelectorAll('[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (DashboardState.sortBy === key) {
        DashboardState.sortDir = DashboardState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        DashboardState.sortBy = key;
        DashboardState.sortDir = 'asc';
      }
      renderJobs();
    });
  });
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function initSidebarNav() {
  document.querySelectorAll('[data-nav-item]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('[data-nav-item]').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const target = item.dataset.navItem;
      document.querySelectorAll('[data-panel]').forEach(panel => {
        if (panel.dataset.panel === target) {
          panel.classList.add('active');
          panel.style.display = 'block';
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      });
    });
  });

  // Mobile Toggle Logic
  const menuToggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  const body = document.body;

  if (menuToggle && overlay) {
    const toggleSidebar = () => {
      body.classList.toggle('sidebar-open');
    };

    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Close sidebar when a nav item is clicked (on mobile)
    document.querySelectorAll('[data-nav-item]').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          body.classList.remove('sidebar-open');
        }
      });
    });
  }
}

// ============================================================
// INIT DASHBOARD
// ============================================================
function initDashboard() {
  // Show skeletons
  const tbody = document.querySelector('[data-jobs-tbody]');
  if (tbody) showSkeletons(tbody);
  showStatSkeletons();

  // Simulate API load
  setTimeout(() => {
    DashboardState.jobs = [...MockJobs];
    renderJobs();
    updateStats();
    initUploadZone();
    initFilters();
    initSidebarNav();
  }, 1200);
}

// ============================================================
// LOGOUT MODAL
// ============================================================
function openLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) modal.classList.add('active');
}

function closeLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) modal.classList.remove('active');
}

function handleLogout() {
  const modal = document.getElementById('logout-modal');
  if (modal) {
    const card = modal.querySelector('.modal-card');
    card.innerHTML = `
      <div class="flex flex-col items-center py-4">
        <div class="spinner mb-4"></div>
        <p class="font-bold">Signing you out safely...</p>
      </div>
    `;
  }
  
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 1500);
}

// Attach to window for inline HTML access
window.openLogoutModal = openLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.handleLogout = handleLogout;

document.addEventListener('DOMContentLoaded', initDashboard);
