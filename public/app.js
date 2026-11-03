/* ==============================================================
   PREVENTIVE MAINTENANCE — APP.JS
   Single Page Application Controller
   ============================================================== */

(function() {
  'use strict';

  // ============================================================
  // STATE & CACHE
  // ============================================================
  const state = {
    currentPage: 'dashboard',
    dashboardCache: null,
    historyCache: null,
    historyPage: 1,
    machineTypes: [],
    selectedDashboardMachine: '', // '' = Semua, or 'GTP-GIGA', 'AIPS', etc.
    currentDetailId: null,
    currentRole: null, // 'admin' | 'user' | null
    enteredPin: '',
    authToken: sessionStorage.getItem('pm_auth_token') || null
  };

  // Helper untuk melakukan request API dengan token autentikasi
  async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    if (state.authToken) {
      options.headers['X-Auth-Token'] = state.authToken;
    }
    const res = await fetch(url, options);
    if (res.status === 401) {
      // Sesi habis atau token tidak valid -> kunci layar
      lockScreen();
      showToast('Sesi telah berakhir. Silakan masukkan PIN kembali.', 'error');
      throw new Error('Unauthorized');
    }
    return res;
  }

  // ============================================================
  // DOM REFERENCES
  // ============================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================
  // NAVIGATION
  // ============================================================
  function navigateTo(page, skipCache) {
    // Role protection: User is NOT allowed to view dashboard
    if (state.currentRole === 'user' && page === 'dashboard') {
      page = 'new-inspection';
    }

    state.currentPage = page;

    // Update active states
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $$('.mobile-nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));

    // Show page
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#page-${page}`);
    if (target) target.classList.add('active');

    // Load data
    switch(page) {
      case 'dashboard': loadDashboard(skipCache); break;
      case 'new-inspection': initNewInspection(); break;
      case 'history': loadHistory(skipCache); break;
    }
  }

  // Nav click handlers
  $$('.nav-item, .mobile-nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Machine filter button click handlers
  $$('#dashboardMachineFilters .machine-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onSelectDashboardMachine(btn.dataset.machine || '');
    });
  });

  // ============================================================
  // DASHBOARD
  // ============================================================
  async function loadDashboard(skipCache) {
    if (!skipCache && state.dashboardCache) {
      renderDashboard(state.dashboardCache);
      return;
    }

    try {
      const res = await authFetch('/api/dashboard');
      const data = await res.json();
      state.dashboardCache = data;
      renderDashboard(data);
    } catch(e) {
      console.error('Dashboard load error:', e);
    }
  }

  function renderDashboard(data) {
    state.dashboardCache = data;

    // By Machine breakdown data
    const KNOWN_MACHINES = ['GTP-GIGA', 'AIPS', 'Heater DC', 'PC / PCA'];
    const byMachine = data.byMachine || {};

    // Determine active filtered dataset
    const selectedMachine = state.selectedDashboardMachine || '';
    let activeTotal, activeVOk, activeVNok, activeItemOk, activeItemNok, activeTotalItems, activeNokItems, activeRecent;

    if (!selectedMachine) {
      activeTotal = data.totalThisMonth || 0;
      activeVOk = data.verificationOK || 0;
      activeVNok = data.verificationNOK || 0;
      activeItemOk = data.itemOK || 0;
      activeItemNok = data.itemNOK || 0;
      activeTotalItems = data.totalItems || 0;
      activeNokItems = data.nokItems || [];
      activeRecent = data.recentInspections || [];
    } else {
      const mStats = byMachine[selectedMachine] || {
        totalInspections: 0,
        verificationOK: 0,
        verificationNOK: 0,
        itemOK: 0,
        itemNOK: 0,
        totalItems: 0,
        nokItems: []
      };
      activeTotal = mStats.totalInspections;
      activeVOk = mStats.verificationOK;
      activeVNok = mStats.verificationNOK;
      activeItemOk = mStats.itemOK;
      activeItemNok = mStats.itemNOK;
      activeTotalItems = mStats.totalItems;
      activeNokItems = mStats.nokItems || [];
      activeRecent = (data.recentInspections || []).filter(r => (r.machine_type || '').trim() === selectedMachine);
    }

    // Month label
    const [y, m] = (data.currentMonth || '').split('-');
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const monthLabel = m ? `${monthNames[parseInt(m)-1]} ${y}` : '';
    const filterTitle = selectedMachine ? ` • ${selectedMachine}` : ' • Semua Peralatan';
    $('#dashboardMonth').textContent = `Ringkasan ${monthLabel}${filterTitle}`;

    const monitorLabel = $('#monitorActiveMachineLabel');
    if (monitorLabel) {
      monitorLabel.textContent = selectedMachine ? `Filter Aktif: ${selectedMachine}` : 'Semua Peralatan';
    }

    // Update Filter Bar active state & counts
    $$('#dashboardMachineFilters .machine-filter-btn').forEach(btn => {
      const m = btn.dataset.machine || '';
      if (m === selectedMachine) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const filterCountAll = $('#filterCountAll');
    if (filterCountAll) filterCountAll.textContent = data.totalThisMonth || 0;

    KNOWN_MACHINES.forEach(m => {
      const safeId = 'filterBadge_' + m.replace(/[^a-zA-Z0-9]/g, '_');
      const badge = $('#' + safeId);
      if (badge) {
        const mData = byMachine[m];
        const nokCnt = (mData && mData.nokItems) ? mData.nokItems.length : 0;
        if (nokCnt > 0) {
          badge.textContent = `${nokCnt} MASALAH`;
          badge.className = 'filter-badge has-nok';
        } else {
          badge.textContent = '';
          badge.className = 'filter-badge';
        }
      }
    });

    // Render 4 Machine Monitoring Cards
    const grid = $('#machineCardsGrid');
    if (grid) {
      const machineIcons = {
        'GTP-GIGA': '⚙️',
        'AIPS': '🔋',
        'Heater DC': '🔥',
        'PC / PCA': '💻'
      };

      grid.innerHTML = KNOWN_MACHINES.map(m => {
        const stats = byMachine[m] || {
          totalInspections: 0,
          verificationOK: 0,
          verificationNOK: 0,
          itemOK: 0,
          itemNOK: 0,
          totalItems: 0,
          nokItems: []
        };
        const isSelected = selectedMachine === m;
        const nokCount = (stats.nokItems && stats.nokItems.length) || 0;
        const isAlert = nokCount > 0;
        const statusBadge = isAlert
          ? `<span class="machine-card-badge status-nok">⚠️ ${nokCount} MASALAH</span>`
          : (stats.totalInspections > 0
              ? `<span class="machine-card-badge status-ok">✓ AMAN</span>`
              : `<span class="machine-card-badge" style="background:#f1f5f9;color:#64748b;">BELUM INSPEKSI</span>`);

        const tot = stats.totalItems || 1;
        const okPct = stats.totalItems ? Math.round((stats.itemOK / tot) * 100) : (stats.totalInspections > 0 ? 100 : 0);
        const nokPct = stats.totalItems ? Math.round((stats.itemNOK / tot) * 100) : 0;

        return `
          <div class="machine-card ${isSelected ? 'selected' : ''}" onclick="onSelectDashboardMachine('${m}')" title="Klik untuk memfilter ${esc(m)}">
            <div class="machine-card-head">
              <div class="machine-card-title">
                <span class="machine-card-title-icon">${machineIcons[m] || '🔧'}</span>
                <span>${esc(m)}</span>
              </div>
              ${statusBadge}
            </div>
            <div class="machine-card-meta">
              <div class="machine-card-count">
                ${stats.totalInspections} <small>Inspeksi</small>
              </div>
              <div class="machine-card-task-items">
                ${stats.totalItems} Checklist
              </div>
            </div>
            <div class="machine-card-progress">
              <div class="machine-card-progress-ok" style="width: ${okPct}%"></div>
              <div class="machine-card-progress-nok" style="width: ${nokPct}%"></div>
            </div>
            <div class="machine-card-footer">
              <span class="txt-ok">✓ OK: ${stats.itemOK}</span>
              <span class="${nokCount > 0 ? 'txt-nok' : ''}">⚠️ NOT OKE: ${stats.itemNOK}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Top Metrics
    $('#metricTotal').textContent = activeTotal;
    $('#metricOK').textContent = activeVOk;
    $('#metricNOK').textContent = activeVNok;

    // Status bar
    const total = activeTotalItems || 1;
    const okPct = activeTotalItems ? Math.round((activeItemOk / total) * 100) : (activeTotal > 0 ? 100 : 0);
    const nokPct = activeTotalItems ? Math.round((activeItemNok / total) * 100) : 0;
    $('#statusBarOK').style.width = okPct + '%';
    $('#statusBarNOK').style.width = nokPct + '%';
    $('#legendOKCount').textContent = activeItemOk;
    $('#legendNOKCount').textContent = activeItemNok;

    // Render NOT OKE Interactive Findings Widget
    renderNokAlertWidget(activeNokItems, activeItemOk, activeItemNok);

    // Recent table & Mobile cards
    const tbody = $('#recentTableBody');
    const empty = $('#recentEmpty');
    const cardsList = $('#recentCardsList');

    if (!activeRecent || activeRecent.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (cardsList) cardsList.innerHTML = '';
      if (empty) {
        empty.style.display = 'flex';
        const p = empty.querySelector('p');
        if (p) {
          p.textContent = selectedMachine
            ? `Belum ada inspeksi untuk ${selectedMachine} bulan ini.`
            : 'Belum ada data inspeksi bulan ini.';
        }
      }
      return;
    }

    if (empty) empty.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = activeRecent.map(row => `
        <tr>
          <td><strong>${esc(row.form_id)}</strong></td>
          <td>${esc(row.machine_type)}</td>
          <td>${esc(row.equipment_id)}</td>
          <td>${formatDate(row.inspection_date)}</td>
          <td>${verificationBadge(row.verification_result)}</td>
          <td>
            <button class="btn-icon" onclick="viewDetail(${row.id})" title="Lihat Detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (cardsList) {
      cardsList.innerHTML = activeRecent.map(row => `
        <div class="inspection-card">
          <div class="card-top">
            <span class="card-form-id">${esc(row.form_id)}</span>
            ${verificationBadge(row.verification_result)}
          </div>
          <div class="card-body-grid">
            <div class="card-field">
              <span class="card-label">Tipe Peralatan</span>
              <span class="card-val">${esc(row.machine_type)}</span>
            </div>
            <div class="card-field">
              <span class="card-label">ID Alat</span>
              <span class="card-val">${esc(row.equipment_id)}</span>
            </div>
            <div class="card-field">
              <span class="card-label">Lokasi</span>
              <span class="card-val">${esc(row.location || '-')}</span>
            </div>
            <div class="card-field">
              <span class="card-label">Tanggal</span>
              <span class="card-val">${formatDate(row.inspection_date)}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" onclick="viewDetail(${row.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Detail & Cetak</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  function onSelectDashboardMachine(machine) {
    if (state.selectedDashboardMachine === machine) {
      state.selectedDashboardMachine = '';
    } else {
      state.selectedDashboardMachine = machine;
    }
    if (state.dashboardCache) {
      renderDashboard(state.dashboardCache);
    }
  }
  window.onSelectDashboardMachine = onSelectDashboardMachine;

  // ============================================================
  // INTERACTIVE NOT OKE FINDINGS WIDGET
  // ============================================================
  function renderNokAlertWidget(nokItems, okCount, nokCount) {
    const container = $('#nokAlertSection');
    if (!container) return;

    if (nokCount === 0) {
      if (okCount > 0) {
        // All OK celebration banner
        container.style.display = 'block';
        container.innerHTML = `
          <div class="all-ok-banner">
            <div class="all-ok-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="all-ok-text">
              <h3>Seluruh Item Checklist OK (100% Siap Operasi)</h3>
              <p>Tidak ada temuan NOT OKE pada ${okCount} item inspeksi bulan ini. Mesin berjalan optimal.</p>
            </div>
          </div>
        `;
      } else {
        container.style.display = 'none';
      }
      return;
    }

    // Has NOT OKE items
    container.style.display = 'block';
    container.innerHTML = `
      <div class="nok-alert-card" id="nokFindingsCard">
        <div class="nok-alert-header">
          <div class="nok-alert-title-wrap">
            <div class="nok-pulse-badge">
              <span class="pulse-ring"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h3>Perhatian: ${nokItems.length} Temuan NOT OKE Bulan Ini</h3>
              <p>Segera lakukan tindak lanjut perbaikan atau penggantian suku cadang berikut:</p>
            </div>
          </div>
          <span class="nok-count-badge">${nokItems.length} Masalah</span>
        </div>

        <div class="nok-items-grid">
          ${nokItems.map(item => `
            <div class="nok-item-box">
              <div class="nok-item-top">
                <div class="nok-meta-group">
                  <span class="nok-machine-badge">${esc(item.machine_type)}</span>
                  <span class="nok-equip-id"><strong>${esc(item.equipment_id)}</strong>${item.location ? ' • ' + esc(item.location) : ''}</span>
                </div>
                <span class="nok-date">${formatDate(item.inspection_date)}</span>
              </div>

              <div class="nok-task-info">
                <span class="nok-task-num">Item #${item.item_no}</span>
                <p class="nok-task-name">${esc(item.task_description)}</p>
              </div>

              <div class="nok-remarks-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div class="nok-remarks-content">
                  <span class="nok-remarks-label">Keterangan / Alasan NOT OKE:</span>
                  <span class="nok-remarks-text">${esc(item.remarks || 'Tidak ada catatan tambahan')}</span>
                </div>
              </div>

              <div class="nok-item-footer">
                <span class="nok-form-ref">Ref: ${esc(item.form_id)}</span>
                <button class="btn btn-outline nok-action-btn" onclick="viewDetail(${item.inspection_id})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Buka Form Inspeksi</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Wire up interactive progress bar click drill-down
    const nokBar = $('#statusBarNOK');
    const nokLegend = $('#legendNOKCount');
    const highlightTarget = () => {
      const card = $('#nokFindingsCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('flash-highlight');
        setTimeout(() => card.classList.remove('flash-highlight'), 1200);
      }
    };

    if (nokBar) nokBar.onclick = highlightTarget;
    if (nokLegend) nokLegend.parentElement.onclick = highlightTarget;
  }

  // ============================================================
  // NEW INSPECTION
  // ============================================================
  async function initNewInspection() {
    // Load machine types
    if (state.machineTypes.length === 0) {
      try {
        const res = await authFetch('/api/machine-types');
        state.machineTypes = await res.json();
      } catch(e) { console.error(e); }
    }

    const select = $('#machineType');
    select.innerHTML = '<option value="">— Pilih Tipe Peralatan —</option>';
    state.machineTypes.forEach(t => {
      select.innerHTML += '<option value="' + esc(t) + '">' + esc(t) + '</option>';
    });

    // Also populate filter
    const filterSel = $('#filterMachineType');
    filterSel.innerHTML = '<option value="">Semua Tipe Peralatan</option>';
    state.machineTypes.forEach(t => {
      filterSel.innerHTML += '<option value="' + esc(t) + '">' + esc(t) + '</option>';
    });

    // Load next form ID
    await loadNextFormId();

    // Set today
    $('#inspectionDate').value = todayISO();

    // Reset form fields
    $('#equipmentId').value = '';
    $('#location').value = '';
    $('#mtcSupport').value = '';
    $('#taskTableBody').innerHTML = '';
    $('#taskListCard').style.display = 'none';
    $('#verificationCard').style.display = 'none';
    $('#formActions').style.display = 'none';

    // Reset verification radios
    $$('input[name="verificationResult"]').forEach(r => r.checked = false);
    $('#maintenanceName').value = '';
    $('#groupLeaderName').value = '';
    $('#logisticLeaderName').value = '';
  }

  async function loadNextFormId() {
    try {
      const res = await authFetch('/api/next-form-id');
      const data = await res.json();
      $('#formId').value = data.formId;
    } catch(e) { console.error(e); }
  }

  // Machine type change → load task list
  $('#machineType').addEventListener('change', async function() {
    const type = this.value;
    if (!type) {
      $('#taskListCard').style.display = 'none';
      $('#verificationCard').style.display = 'none';
      $('#formActions').style.display = 'none';
      return;
    }

    try {
      const res = await authFetch('/api/templates/' + encodeURIComponent(type));
      const tasks = await res.json();
      renderTaskList(tasks);
      $('#taskListCard').style.display = 'block';
      $('#verificationCard').style.display = 'block';
      $('#formActions').style.display = 'flex';
      $('#taskCount').textContent = tasks.length + ' Item';
    } catch(e) { console.error(e); }
  });

  // Helper to normalize machine type to task folder slug
  function getMachineTaskFolder(machineType) {
    const norm = (machineType || '').trim().toUpperCase();
    if (norm === 'GTP-GIGA') return 'gtp-giga';
    if (norm === 'AIPS') return 'aips';
    if (norm.includes('HEATER')) return 'heater-dc';
    if (norm.includes('PCA') || norm.includes('PC')) return 'pc-pca';
    return null;
  }

  // Helper to get Base64 data URL or fallback path for task images
  function getTaskImageSrc(machineType, itemNo) {
    const folder = getMachineTaskFolder(machineType);
    if (!folder) return null;
    if (typeof window !== 'undefined' && window.MACHINE_TASK_IMAGES && window.MACHINE_TASK_IMAGES[folder] && window.MACHINE_TASK_IMAGES[folder][itemNo]) {
      return window.MACHINE_TASK_IMAGES[folder][itemNo];
    }
    // Backward compatibility for GTP-GIGA
    if (folder === 'gtp-giga' && typeof window !== 'undefined' && window.GTP_GIGA_DATA_URLS && window.GTP_GIGA_DATA_URLS[itemNo]) {
      return window.GTP_GIGA_DATA_URLS[itemNo];
    }
    return `/images/tasks/${folder}/${itemNo}.jpg`;
  }

  function renderTaskList(tasks) {
    const tbody = $('#taskTableBody');
    const machineType = ($('#machineType').value || '').trim();
    const folder = getMachineTaskFolder(machineType);
    const hasImages = !!folder;

    tbody.innerHTML = tasks.map(task => {
      // Split task description by ":"
      const parts = task.task_description.split(':');
      const category = parts[0].trim();
      const detail = parts.slice(1).join(':').trim();

      let imgHtml = '';
      if (hasImages) {
        const imgSrc = getTaskImageSrc(machineType, task.item_no);
        const titleAttr = esc(`Item #${task.item_no} : ${category}`);
        const descAttr = esc(task.task_description);
        imgHtml = `
          <div class="task-thumb-wrap" onclick="openTaskImageModal('${imgSrc}', '${titleAttr}', '${descAttr}')" title="Klik untuk memperbesar gambar">
            <img src="${imgSrc}" alt="Item ${task.item_no}" class="task-thumb-img" loading="lazy">
            <span class="task-thumb-zoom-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </span>
          </div>
        `;
      } else {
        imgHtml = `
          <div class="task-thumb-placeholder" title="Belum ada foto panduan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>-</span>
          </div>
        `;
      }

      return `
        <tr id="task_row_${task.item_no}">
          <td class="td-no">${task.item_no}</td>
          <td class="td-img">${imgHtml}</td>
          <td class="td-desc task-desc"><strong>${esc(category)}</strong>${detail ? ' : ' + esc(detail) : ''}</td>
          <td class="td-status">
            <div class="status-radios">
              <input type="radio" class="status-radio" name="status_${task.item_no}" id="ok_${task.item_no}" value="OK" onchange="onTaskStatusChange(${task.item_no}, 'OK')">
              <label for="ok_${task.item_no}" class="status-label label-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                <span>OK</span>
              </label>

              <input type="radio" class="status-radio" name="status_${task.item_no}" id="nok_${task.item_no}" value="NOT OKE" onchange="onTaskStatusChange(${task.item_no}, 'NOT OKE')">
              <label for="nok_${task.item_no}" class="status-label label-nok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>NOT OKE</span>
              </label>
            </div>
          </td>
          <td class="td-remarks">
            <input type="text" class="task-remark-input" id="remark_${task.item_no}" data-item="${task.item_no}" placeholder="Keterangan (opsional)...">
          </td>
        </tr>
      `;
    }).join('');
  }

  // Handle live toggle between OK and NOT OKE
  window.onTaskStatusChange = function(itemNo, status) {
    const remarkInput = $(`#remark_${itemNo}`);
    if (!remarkInput) return;

    if (status === 'NOT OKE') {
      remarkInput.classList.add('required-nok');
      remarkInput.placeholder = '* Wajib isi alasan NOT OKE...';
      remarkInput.focus();
    } else {
      remarkInput.classList.remove('required-nok');
      remarkInput.placeholder = 'Keterangan (opsional)...';
    }
  };

  // Form submission
  $('#inspectionForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formId = $('#formId').value;
    const machineType = $('#machineType').value;
    const equipmentId = $('#equipmentId').value.trim();
    const location = $('#location').value.trim();
    const mtcSupport = $('#mtcSupport').value.trim();
    const inspectionDate = $('#inspectionDate').value;
    const verificationResult = document.querySelector('input[name="verificationResult"]:checked');

    if (!machineType || !equipmentId || !location || !mtcSupport || !inspectionDate) {
      showToast('Mohon lengkapi semua field informasi alat', 'error');
      return;
    }

    if (!verificationResult) {
      showToast('Mohon pilih Hasil Verifikasi (OK / NOK)', 'error');
      return;
    }

    // Collect and validate task items
    const taskRows = $$('#taskTableBody tr');
    const items = [];
    let allFilled = true;
    let missingRemarkItem = null;

    taskRows.forEach((row, i) => {
      const itemNo = i + 1;
      const statusRadio = document.querySelector(`input[name="status_${itemNo}"]:checked`);
      const remarkInput = $(`#remark_${itemNo}`);
      const remarkVal = remarkInput ? remarkInput.value.trim() : '';
      const taskDesc = row.querySelector('.task-desc').textContent;

      if (!statusRadio) {
        allFilled = false;
      } else if (statusRadio.value === 'NOT OKE' && !remarkVal) {
        if (!missingRemarkItem) {
          missingRemarkItem = { itemNo, input: remarkInput, row };
        }
      }

      items.push({
        item_no: itemNo,
        task_description: taskDesc,
        status: statusRadio ? statusRadio.value : '',
        remarks: remarkVal
      });
    });

    if (!allFilled) {
      showToast('Semua status task harus dipilih (OK / NOT OKE)', 'error');
      return;
    }

    // Strict validation: NOT OKE requires remark
    if (missingRemarkItem) {
      showToast(`Task No. ${missingRemarkItem.itemNo} (NOT OKE) wajib diisi keterangannya!`, 'error');
      missingRemarkItem.input.classList.add('required-nok');
      missingRemarkItem.input.focus();
      missingRemarkItem.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const payload = {
      form_id: formId,
      machine_type: machineType,
      equipment_id: equipmentId,
      location: location,
      mtc_support: mtcSupport,
      inspection_date: inspectionDate,
      verification_result: verificationResult.value,
      maintenance_support_name: $('#maintenanceName').value.trim(),
      group_leader_name: $('#groupLeaderName').value.trim(),
      logistic_leader_name: $('#logisticLeaderName').value.trim(),
      items: items
    };

    try {
      const res = await authFetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast('Inspeksi berhasil disimpan!', 'success');
        // Invalidate caches
        state.dashboardCache = null;
        state.historyCache = null;
        // View detail
        viewDetail(result.id);
      } else {
        showToast('Gagal menyimpan: ' + result.error, 'error');
      }
    } catch(e) {
      showToast('Error koneksi server', 'error');
      console.error(e);
    }
  });

  // Reset button
  $('#btnResetForm').addEventListener('click', () => {
    initNewInspection();
  });

  // ============================================================
  // HISTORY
  // ============================================================
  let searchTimeout = null;

  async function loadHistory(skipCache) {
    const search = $('#searchInput').value.trim();
    const machineType = $('#filterMachineType').value;
    const page = state.historyPage;

    // Simple cache key
    const cacheKey = `${search}|${machineType}|${page}`;
    if (!skipCache && state.historyCache && state.historyCache._key === cacheKey) {
      renderHistory(state.historyCache);
      return;
    }

    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.append('search', search);
    if (machineType) params.append('machine_type', machineType);

    try {
      const res = await authFetch('/api/inspections?' + params.toString());
      const data = await res.json();
      data._key = cacheKey;
      state.historyCache = data;
      renderHistory(data);
    } catch(e) { console.error(e); }
  }

  function renderHistory(data) {
    const tbody = $('#historyTableBody');
    const empty = $('#historyEmpty');
    const cardsList = $('#historyCardsList');

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '';
      if (cardsList) cardsList.innerHTML = '';
      empty.style.display = 'flex';
      $('#pagination').innerHTML = '';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = data.data.map(row => `
      <tr>
        <td><strong>${esc(row.form_id)}</strong></td>
        <td>${esc(row.machine_type)}</td>
        <td>${esc(row.equipment_id)}</td>
        <td>${esc(row.location)}</td>
        <td>${formatDate(row.inspection_date)}</td>
        <td>${verificationBadge(row.verification_result)}</td>
        <td>
          <div style="display:flex; gap:4px;">
            <button class="btn-icon" onclick="viewDetail(${row.id})" title="Lihat Detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" onclick="deleteInspection(${row.id}, '${esc(row.form_id)}')" title="Hapus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (cardsList) {
      cardsList.innerHTML = data.data.map(row => `
        <div class="inspection-card">
          <div class="card-top">
            <span class="card-form-id">${esc(row.form_id)}</span>
            ${verificationBadge(row.verification_result)}
          </div>
          <div class="card-body-grid">
            <div class="card-field">
              <span class="card-label">Tipe Peralatan</span>
              <span class="card-val">${esc(row.machine_type)}</span>
            </div>
            <div class="card-field">
              <span class="card-label">ID Alat</span>
              <span class="card-val">${esc(row.equipment_id)}</span>
            </div>
            <div class="card-field">
              <span class="card-label">Lokasi</span>
              <span class="card-val">${esc(row.location || '-')}</span>
            </div>
            <div class="card-field">
              <span class="card-label">Tanggal</span>
              <span class="card-val">${formatDate(row.inspection_date)}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" onclick="viewDetail(${row.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Detail & Cetak</span>
            </button>
            <button class="btn btn-ghost btn-danger" onclick="deleteInspection(${row.id}, '${esc(row.form_id)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      `).join('');
    }

    // Pagination
    const totalPages = Math.ceil(data.total / data.limit);
    const pag = $('#pagination');
    if (totalPages <= 1) {
      pag.innerHTML = '';
      return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += '<button class="' + (i === data.page ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    pag.innerHTML = html;
  }

  // Search & filter handlers
  $('#searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.historyPage = 1;
      state.historyCache = null;
      loadHistory(true);
    }, 300);
  });

  $('#filterMachineType').addEventListener('change', () => {
    state.historyPage = 1;
    state.historyCache = null;
    loadHistory(true);
  });

  // ============================================================
  // DETAIL VIEW
  // ============================================================
  window.viewDetail = async function(id) {
    state.currentDetailId = id;
    navigateToDetailPage();

    try {
      const res = await authFetch('/api/inspections/' + id);
      const data = await res.json();
      state.currentDetailData = data;
      renderDetail(data);
    } catch(e) {
      showToast('Gagal memuat detail inspeksi', 'error');
      console.error(e);
    }
  };

  function navigateToDetailPage() {
    // Deactivate all nav
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    $$('.mobile-nav-item').forEach(n => n.classList.remove('active'));

    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page-detail').classList.add('active');
    state.currentPage = 'detail';
  }

  
  function renderDetail(data) {
    $('#detailTitle').textContent = 'Detail Inspeksi';
    $('#detailSubtitle').textContent = data.form_id + ' — ' + data.machine_type;

    // Print area
    $('#printMachineType').textContent = data.machine_type;
    $('#printEquipmentId').textContent = data.equipment_id;
    $('#printLocation').textContent = data.location;
    $('#printMtcSupport').textContent = data.mtc_support;
    $('#printDate').textContent = formatDate(data.inspection_date);
    $('#printFormId').textContent = data.form_id;

    // Task table
    const tbody = $('#printTableBody');
    const machineType = (data.machine_type || '').trim();
    const folder = getMachineTaskFolder(machineType);
    const hasImages = !!folder;

    tbody.innerHTML = data.items.map(item => {
      const statusClass = item.status === 'OK' ? 's-ok' : (item.status === 'NOT OKE' ? 's-nok' : '');
      let imgHtml = '';
      if (hasImages) {
        const imgSrc = getTaskImageSrc(machineType, item.item_no);
        const titleAttr = esc(`Item #${item.item_no} : ${item.task_description}`);
        imgHtml = `
          <div class="print-thumb-wrap" onclick="openTaskImageModal('${imgSrc}', '${titleAttr}', '${esc(item.task_description)}')" title="Klik untuk memperbesar">
            <canvas class="print-thumb-canvas" width="186" height="99" data-item-no="${item.item_no}"></canvas>
          </div>
        `;
      } else {
        imgHtml = `<span class="print-no-img">-</span>`;
      }

      const hasRemark = item.remarks && item.remarks.trim() !== '' && item.remarks.trim() !== '-';
      return `
        <tr>
          <td class="td-no">${item.item_no}</td>
          <td class="td-img">${imgHtml}</td>
          <td class="td-desc">${esc(item.task_description)}</td>
          <td class="detail-status ${statusClass}">${esc(item.status) || '-'}</td>
          <td class="td-remarks ${hasRemark ? 'has-remarks' : 'empty-remarks'}">${esc(item.remarks) || '-'}</td>
        </tr>
      `;
    }).join('');

    // Draw photos onto thumbnail canvases directly
    if (hasImages) {
      const canvases = tbody.querySelectorAll('.print-thumb-canvas');
      canvases.forEach(cvs => {
        const itemNo = cvs.dataset.itemNo;
        const src = getTaskImageSrc(machineType, itemNo);
        if (!src) return;
        const ctx = cvs.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        };
        img.src = src;
      });
    }

    // Verification
    $('#printVerification').innerHTML = 'Hasil Verifikasi : <strong>' + esc(data.verification_result) + '</strong> (dilakukan oleh Group Leader / LPU, coret yang tidak perlu)';

    // Signatures
    $('#printSigMaintenance').textContent = data.maintenance_support_name || '_______________';
    $('#printSigGroupLeader').textContent = data.group_leader_name || '_______________';
    $('#printSigLogistic').textContent = data.logistic_leader_name || '_______________';
  }

// ============================================================
  // PURE NATIVE CANVAS REPORT GENERATOR (Zero html2canvas)
  // ============================================================
  let activePreviewBlobUrl = null;

  function openReportPreviewModal(imgUrl, filename, data) {
    const modal = $('#reportPreviewModal');
    if (!modal) return;

    activePreviewBlobUrl = imgUrl;
    const previewImg = $('#reportPreviewImg');
    if (previewImg) previewImg.src = imgUrl;

    const titleEl = $('#reportPreviewTitle');
    if (titleEl) titleEl.textContent = `${data.form_id || 'Laporan'} — ${data.machine_type || ''}`;

    const downloadBtn = $('#btnReportPreviewDownload');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Mengunduh berkas gambar (JPG)...', 'success');
      };
    }

    modal.classList.add('show');
    modal.style.display = 'flex';
  }

  function closeReportPreviewModal() {
    const modal = $('#reportPreviewModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
  }

  $('#btnReportPreviewClose')?.addEventListener('click', closeReportPreviewModal);
  $('#btnReportPreviewDismiss')?.addEventListener('click', closeReportPreviewModal);

  window.getMachineTaskFolder = getMachineTaskFolder;
  window.getTaskImageSrc = getTaskImageSrc;
  window.generateInspectionReportCanvas = generateInspectionReportCanvas;

  async function generateInspectionReportCanvas(data) {
    if (!data || !data.items) {
      throw new Error('Data inspeksi tidak valid');
    }

    const machineType = (data.machine_type || '').trim();
    const folder = getMachineTaskFolder(machineType);
    const hasImages = !!folder;

    // 1. Preload all task images
    const imgMap = new Map();
    if (hasImages) {
      await Promise.all(data.items.map(item => {
        return new Promise(resolve => {
          const src = getTaskImageSrc(machineType, item.item_no);
          if (!src) {
            imgMap.set(item.item_no, null);
            return resolve();
          }
          const img = new Image();
          img.onload = () => { imgMap.set(item.item_no, img); resolve(); };
          img.onerror = () => { imgMap.set(item.item_no, null); resolve(); };
          img.src = src;
        });
      }));
    }

    // 2. Geometry & column layout
    const width = 880;
    const marginX = 20;
    const contentW = width - (marginX * 2);
    const colNoW = 38;
    const colImgW = 86;
    const colDescW = 436;
    const colStatusW = 130;
    const colRemarksW = 150;

    function wrapText(ctx, text, maxWidth) {
      const words = (text || '').split(' ');
      const lines = [];
      let currentLine = '';
      for (const w of words) {
        const testLine = currentLine ? currentLine + ' ' + w : w;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = w;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    const measureCvs = document.createElement('canvas');
    const mCtx = measureCvs.getContext('2d');
    mCtx.font = '500 11px sans-serif';

    const rowHeights = data.items.map(item => {
      const lines = wrapText(mCtx, item.task_description, colDescW - 16);
      const textH = lines.length * 15;
      return Math.max(50, textH + 16);
    });

    const totalTableH = rowHeights.reduce((a, b) => a + b, 0);
    const headerH = 142;
    const tableHeaderH = 30;
    const verificationH = 40;
    const signaturesH = 110;
    const paddingBottom = 20;
    const totalHeight = headerH + tableHeaderH + totalTableH + verificationH + signaturesH + paddingBottom;

    // 3. Create high-resolution 2x Retina canvas
    const cvs = document.createElement('canvas');
    cvs.width = width * 2;
    cvs.height = Math.round(totalHeight * 2);
    const ctx = cvs.getContext('2d');
    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, totalHeight);

    // Document outer frame
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginX, 16, contentW, totalHeight - 32);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FORM PREVENTIVE MAINTENANCE', width / 2, 44);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(data.machine_type || '-', width / 2, 64);

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('QMS-0039442', marginX + contentW - 14, 34);

    // Info Box Divider Lines
    const infoY = 80;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX, infoY);
    ctx.lineTo(marginX + contentW, infoY);
    ctx.moveTo(marginX, infoY + 44);
    ctx.lineTo(marginX + contentW, infoY + 44);
    ctx.stroke();

    // Info Box Content
    const infoCols = [
      { label: 'ID ALAT', val: data.equipment_id, x: marginX + 16 },
      { label: 'LOKASI', val: data.location, x: marginX + 180 },
      { label: 'MTC SUPPORT', val: data.mtc_support, x: marginX + 350 },
      { label: 'TANGGAL', val: formatDate(data.inspection_date), x: marginX + 520 },
      { label: 'FORM ID', val: data.form_id, x: marginX + 680 }
    ];
    infoCols.forEach(c => {
      ctx.textAlign = 'left';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(c.label, c.x, infoY + 16);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(c.val || '-', c.x, infoY + 34);
    });

    // Table Header (Navy)
    const tY = infoY + 44;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(marginX, tY, contentW, tableHeaderH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO', marginX + (colNoW / 2), tY + 19);
    ctx.fillText('GAMBAR', marginX + colNoW + (colImgW / 2), tY + 19);
    ctx.textAlign = 'left';
    ctx.fillText('TASK LIST', marginX + colNoW + colImgW + 12, tY + 19);
    ctx.textAlign = 'center';
    ctx.fillText('STATUS (OK/NOT OKE)', marginX + colNoW + colImgW + colDescW + (colStatusW / 2), tY + 19);
    ctx.textAlign = 'left';
    ctx.fillText('KETERANGAN', marginX + colNoW + colImgW + colDescW + colStatusW + 12, tY + 19);

    // Header vertical lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    let colX = marginX;
    [colNoW, colImgW, colDescW, colStatusW].forEach(w => {
      colX += w;
      ctx.beginPath();
      ctx.moveTo(colX, tY);
      ctx.lineTo(colX, tY + tableHeaderH);
      ctx.stroke();
    });

    // Draw Table Rows
    let currentY = tY + tableHeaderH;
    data.items.forEach((item, idx) => {
      const rH = rowHeights[idx];

      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#fcfcfd';
      ctx.fillRect(marginX, currentY, contentW, rH);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(marginX, currentY, contentW, rH);

      let curColX = marginX;
      [colNoW, colImgW, colDescW, colStatusW].forEach(w => {
        curColX += w;
        ctx.beginPath();
        ctx.moveTo(curColX, currentY);
        ctx.lineTo(curColX, currentY + rH);
        ctx.stroke();
      });

      // No
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(item.item_no), marginX + (colNoW / 2), currentY + (rH / 2) + 4);

      // Gambar (Direct ctx.drawImage)
      const imgObj = imgMap.get(item.item_no);
      const imgBoxW = 72;
      const imgBoxH = 40;
      const imgBoxX = marginX + colNoW + ((colImgW - imgBoxW) / 2);
      const imgBoxY = currentY + ((rH - imgBoxH) / 2);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

      if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
        ctx.drawImage(imgObj, imgBoxX + 1, imgBoxY + 1, imgBoxW - 2, imgBoxH - 2);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('-', imgBoxX + (imgBoxW / 2), imgBoxY + (imgBoxH / 2) + 4);
      }

      // Task Description
      ctx.textAlign = 'left';
      ctx.font = '500 11px sans-serif';
      ctx.fillStyle = '#0f172a';
      const lines = wrapText(ctx, item.task_description, colDescW - 16);
      const lineH = 15;
      const startTextY = currentY + ((rH - (lines.length * lineH)) / 2) + 11;
      lines.forEach((line, lIdx) => {
        ctx.fillText(line, marginX + colNoW + colImgW + 10, startTextY + (lIdx * lineH));
      });

      // Status
      const statusX = marginX + colNoW + colImgW + colDescW + (colStatusW / 2);
      const statusY = currentY + (rH / 2);
      const isOK = item.status === 'OK';
      const isNOK = item.status === 'NOT OKE';

      if (isOK || isNOK) {
        const badgeW = isOK ? 56 : 82;
        const badgeH = 22;
        const bX = statusX - (badgeW / 2);
        const bY = statusY - (badgeH / 2);

        ctx.fillStyle = isOK ? '#ecfdf5' : '#fff1f2';
        ctx.fillRect(bX, bY, badgeW, badgeH);
        ctx.strokeStyle = isOK ? '#a7f3d0' : '#fecdd3';
        ctx.strokeRect(bX, bY, badgeW, badgeH);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = isOK ? '#059669' : '#e11d48';
        ctx.textAlign = 'center';
        ctx.fillText(item.status, statusX, statusY + 3.5);
      } else {
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('-', statusX, statusY + 4);
      }

      // Keterangan
      ctx.textAlign = 'left';
      ctx.font = '10.5px sans-serif';
      ctx.fillStyle = item.remarks ? '#334155' : '#94a3b8';
      ctx.fillText(item.remarks || '-', marginX + colNoW + colImgW + colDescW + colStatusW + 10, currentY + (rH / 2) + 4);

      currentY += rH;
    });

    // Verification Box
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginX, currentY, contentW, verificationH);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(marginX + 0.5, currentY + 0.5, contentW - 1, verificationH - 1);

    ctx.font = '10.5px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('Hasil Verifikasi : ', marginX + 16, currentY + 24);
    const verTextW = ctx.measureText('Hasil Verifikasi : ').width;

    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(data.verification_result || 'OK', marginX + 16 + verTextW, currentY + 24);
    const valW = ctx.measureText(data.verification_result || 'OK').width;

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(' (dilakukan oleh Group Leader / LPU, coret yang tidak perlu)', marginX + 16 + verTextW + valW, currentY + 24);

    // Signatures Section
    const sigY = currentY + verificationH;
    const sigColW = contentW / 3;
    const roles = [
      { title: 'Maintenance Support', name: data.maintenance_support_name || '_______________' },
      { title: 'Group Leader/LPU', name: data.group_leader_name || '_______________' },
      { title: 'Logistik Leader', name: data.logistic_leader_name || '_______________' }
    ];

    roles.forEach((r, idx) => {
      const colCenterX = marginX + (idx * sigColW) + (sigColW / 2);
      ctx.textAlign = 'center';
      ctx.font = '600 10.5px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(r.title, colCenterX, sigY + 26);

      const lineW = 120;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(colCenterX - (lineW / 2), sigY + 74);
      ctx.lineTo(colCenterX + (lineW / 2), sigY + 74);
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(r.name, colCenterX, sigY + 92);
    });

    return cvs;
  }

  // Export JPG (Pure Native Canvas Report Generator)
  const btnExportJPG = $('#btnExportJPG');
  if (btnExportJPG) {
    btnExportJPG.addEventListener('click', async () => {
      if (!state.currentDetailData) {
        showToast('Data laporan belum siap', 'error');
        return;
      }

      showToast('Melukis gambar laporan resmi...', 'info');

      try {
        const data = state.currentDetailData;
        const canvas = await generateInspectionReportCanvas(data);

        const rawFormId = (data.form_id || 'LAPORAN').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `FORM_PREVENTIVE_MTC_${rawFormId}.jpg`;

        canvas.toBlob((blob) => {
          if (!blob) {
            showToast('Gagal memproses gambar laporan', 'error');
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Show Preview Modal
          openReportPreviewModal(url, filename, data);

          showToast('Gambar laporan berhasil dibuat & diunduh (JPG)!', 'success');
        }, 'image/jpeg', 0.95);
      } catch (err) {
        console.error('Export JPG error:', err);
        showToast('Gagal membuat gambar laporan: ' + err.message, 'error');
      }
    });
  }

  // Export Excel (authenticated blob download)
  $('#btnExportExcel').addEventListener('click', async () => {
    if (!state.currentDetailId) return;
    try {
      showToast('Menyiapkan file Excel...', 'info');
      const res = await authFetch('/api/inspections/' + state.currentDetailId + '/excel');
      if (!res.ok) throw new Error('Gagal mengunduh Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PM_${$('#printFormId').textContent || 'inspeksi'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Excel berhasil diunduh!', 'success');
    } catch (e) {
      showToast('Gagal mengunduh file Excel', 'error');
    }
  });

  // Back to history
  $('#btnBackToHistory').addEventListener('click', () => {
    navigateTo('history');
  });

  // ============================================================
  // DELETE
  // ============================================================
  let pendingDeleteId = null;

  window.deleteInspection = function(id, formId) {
    pendingDeleteId = id;
    $('#confirmTitle').textContent = 'Hapus Inspeksi';
    $('#confirmMessage').textContent = 'Apakah Anda yakin ingin menghapus inspeksi ' + formId + '? Data yang dihapus tidak dapat dikembalikan.';
    $('#confirmModal').classList.add('show');
  };

  $('#confirmCancel').addEventListener('click', () => {
    $('#confirmModal').classList.remove('show');
    pendingDeleteId = null;
  });

  $('#confirmOK').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await authFetch('/api/inspections/' + pendingDeleteId, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast('Inspeksi berhasil dihapus', 'success');
        state.dashboardCache = null;
        state.historyCache = null;
        loadHistory(true);
      } else {
        showToast('Gagal menghapus', 'error');
      }
    } catch(e) {
      showToast('Error koneksi', 'error');
    }
    $('#confirmModal').classList.remove('show');
    pendingDeleteId = null;
  });

  // Close modal on overlay click
  $('#confirmModal').addEventListener('click', (e) => {
    if (e.target === $('#confirmModal')) {
      $('#confirmModal').classList.remove('show');
      pendingDeleteId = null;
    }
  });

  // ============================================================
  // TASK IMAGE LIGHTBOX MODAL
  // ============================================================
  window.openTaskImageModal = function(src, title, desc) {
    const modal = $('#taskImageModal');
    if (!modal) return;
    const img = $('#taskImgPreview');
    if (img) img.src = src;

    const badgeEl = $('#taskImgBadge');
    const titleEl = $('#taskImgTitle');
    const descEl = $('#taskImgDesc');

    if (title && title.includes(' : ')) {
      const parts = title.split(' : ');
      if (badgeEl) badgeEl.textContent = parts[0];
      if (titleEl) titleEl.textContent = parts.slice(1).join(' : ');
    } else {
      if (badgeEl) badgeEl.textContent = 'Panduan SOP';
      if (titleEl) titleEl.textContent = title || 'Panduan Visual Komponen';
    }

    if (descEl) descEl.textContent = desc || '';
    modal.classList.add('show');
    modal.style.display = 'flex';
  };

  window.closeTaskImageModal = function() {
    const modal = $('#taskImageModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      const img = $('#taskImgPreview');
      if (img) img.src = '';
    }
  };

  const taskImgCloseBtn = $('#taskImgCloseBtn');
  if (taskImgCloseBtn) {
    taskImgCloseBtn.addEventListener('click', closeTaskImageModal);
  }

  const taskImageModal = $('#taskImageModal');
  if (taskImageModal) {
    taskImageModal.addEventListener('click', (e) => {
      if (e.target === taskImageModal) closeTaskImageModal();
    });
  }

  // Support ESC key to close lightbox modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskImageModal();
    }
  });

  // ============================================================
  // PAGINATION
  // ============================================================
  window.goToPage = function(page) {
    state.historyPage = page;
    state.historyCache = null;
    loadHistory(true);
  };

  // ============================================================
  // UTILITIES
  // ============================================================
  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return parseInt(parts[2]) + ' ' + months[parseInt(parts[1])-1] + ' ' + parts[0];
  }

  function verificationBadge(val) {
    if (val === 'OK') return '<span class="badge badge-ok">OK</span>';
    if (val === 'NOK') return '<span class="badge badge-nok">NOK</span>';
    return '<span class="badge badge-pending">—</span>';
  }

  function showToast(message, type) {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.innerHTML = (type === 'error' ?
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' :
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>'
    ) + '<span>' + message + '</span>';

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ============================================================
  // PIN AUTHENTICATION & KEYPAD LOGIC
  // ============================================================
  function initPinAuth() {
    // Check existing session (check sessionStorage first, then fallback to localStorage)
    const savedRole = sessionStorage.getItem('pm_user_role') || localStorage.getItem('pm_user_role');
    const savedToken = sessionStorage.getItem('pm_auth_token') || localStorage.getItem('pm_auth_token');
    if (savedRole && savedToken && (savedRole === 'admin' || savedRole === 'user')) {
      state.authToken = savedToken;
      sessionStorage.setItem('pm_user_role', savedRole);
      sessionStorage.setItem('pm_auth_token', savedToken);
      localStorage.setItem('pm_user_role', savedRole);
      localStorage.setItem('pm_auth_token', savedToken);
      applyRole(savedRole);
      hidePinOverlay();
      if (savedRole === 'user') {
        navigateTo('new-inspection', true);
      } else {
        navigateTo('dashboard', true);
      }
    } else {
      sessionStorage.removeItem('pm_user_role');
      sessionStorage.removeItem('pm_auth_token');
      localStorage.removeItem('pm_user_role');
      localStorage.removeItem('pm_auth_token');
      state.authToken = null;
      showPinOverlay();
    }

    // Keypad number clicks
    $$('.pin-key[data-num]').forEach(key => {
      key.addEventListener('click', () => {
        handlePinInput(key.dataset.num);
      });
    });

    // Keypad clear
    $('#pinClear').addEventListener('click', () => {
      state.enteredPin = '';
      updatePinDots();
      hidePinError();
    });

    // Keypad backspace
    $('#pinBackspace').addEventListener('click', () => {
      state.enteredPin = state.enteredPin.slice(0, -1);
      updatePinDots();
      hidePinError();
    });

    // Physical keyboard input support
    window.addEventListener('keydown', (e) => {
      const overlay = $('#pinOverlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        if (e.key >= '0' && e.key <= '9') {
          handlePinInput(e.key);
        } else if (e.key === 'Backspace') {
          state.enteredPin = state.enteredPin.slice(0, -1);
          updatePinDots();
          hidePinError();
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
          state.enteredPin = '';
          updatePinDots();
          hidePinError();
        }
      }
    });

    // Lock screen buttons
    $('#btnLock').addEventListener('click', lockScreen);
    const mobileLock = $('#mobileBtnLock');
    if (mobileLock) mobileLock.addEventListener('click', lockScreen);
  }

  function handlePinInput(num) {
    if (state.enteredPin.length >= 4) return;
    state.enteredPin += num;
    updatePinDots();
    hidePinError();

    if (state.enteredPin.length === 4) {
      setTimeout(verifyPin, 150);
    }
  }

  function updatePinDots() {
    const dots = $$('#pinDots .pin-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < state.enteredPin.length);
    });
  }

  async function verifyPin() {
    const pin = state.enteredPin;
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (data.success && data.token) {
        state.authToken = data.token;
        sessionStorage.setItem('pm_auth_token', data.token);
        sessionStorage.setItem('pm_user_role', data.role);
        localStorage.setItem('pm_auth_token', data.token);
        localStorage.setItem('pm_user_role', data.role);
        applyRole(data.role);
        hidePinOverlay();
        showToast('Masuk sebagai ' + (data.role === 'admin' ? 'Admin' : 'User'), 'success');

        if (data.role === 'user') {
          navigateTo('new-inspection', true);
        } else {
          navigateTo('dashboard', true);
        }
      } else {
        showPinError();
        state.enteredPin = '';
        updatePinDots();
      }
    } catch (err) {
      showPinError();
      state.enteredPin = '';
      updatePinDots();
    }
  }

  function showPinError() {
    const err = $('#pinError');
    if (err) err.style.display = 'block';
  }

  function hidePinError() {
    const err = $('#pinError');
    if (err) err.style.display = 'none';
  }

  function showPinOverlay() {
    state.enteredPin = '';
    updatePinDots();
    hidePinError();
    $('#pinOverlay').classList.remove('hidden');
  }

  function hidePinOverlay() {
    $('#pinOverlay').classList.add('hidden');
    state.enteredPin = '';
    updatePinDots();
    hidePinError();
  }

  function applyRole(role) {
    state.currentRole = role;
    document.body.classList.remove('role-admin', 'role-user');
    document.body.classList.add('role-' + role);

    const badge = $('#roleBadge');
    const roleText = $('#roleText');
    if (badge && roleText) {
      badge.className = 'user-role-badge role-' + role;
      roleText.textContent = role === 'admin' ? 'Admin' : 'User';
    }
  }

  function lockScreen() {
    if (state.authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'X-Auth-Token': state.authToken }
      }).catch(() => {});
    }
    sessionStorage.removeItem('pm_user_role');
    sessionStorage.removeItem('pm_auth_token');
    localStorage.removeItem('pm_user_role');
    localStorage.removeItem('pm_auth_token');
    state.currentRole = null;
    state.authToken = null;
    showPinOverlay();
  }

  // ============================================================
  // INIT
  // ============================================================
  initPinAuth();

})();

