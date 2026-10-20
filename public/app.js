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
    currentDetailId: null,
    currentRole: null, // 'admin' | 'user' | null
    enteredPin: ''
  };

  const PIN_MAP = {
    '2323': 'user',
    '3434': 'admin'
  };

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

  // ============================================================
  // DASHBOARD
  // ============================================================
  async function loadDashboard(skipCache) {
    if (!skipCache && state.dashboardCache) {
      renderDashboard(state.dashboardCache);
      return;
    }

    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      state.dashboardCache = data;
      renderDashboard(data);
    } catch(e) {
      console.error('Dashboard load error:', e);
    }
  }

  function renderDashboard(data) {
    // Month label
    const [y, m] = data.currentMonth.split('-');
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    $('#dashboardMonth').textContent = `Ringkasan ${monthNames[parseInt(m)-1]} ${y}`;

    // Metrics
    $('#metricTotal').textContent = data.totalThisMonth;
    $('#metricOK').textContent = data.verificationOK;
    $('#metricNOK').textContent = data.verificationNOK;

    // Status bar
    const total = data.totalItems || 1;
    const okPct = Math.round((data.itemOK / total) * 100);
    const nokPct = Math.round((data.itemNOK / total) * 100);
    $('#statusBarOK').style.width = okPct + '%';
    $('#statusBarNOK').style.width = nokPct + '%';
    $('#legendOKCount').textContent = data.itemOK;
    $('#legendNOKCount').textContent = data.itemNOK;

    // Recent table
    const tbody = $('#recentTableBody');
    const empty = $('#recentEmpty');

    if (!data.recentInspections || data.recentInspections.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = data.recentInspections.map(row => `
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

  // ============================================================
  // NEW INSPECTION
  // ============================================================
  async function initNewInspection() {
    // Load machine types
    if (state.machineTypes.length === 0) {
      try {
        const res = await fetch('/api/machine-types');
        state.machineTypes = await res.json();
      } catch(e) { console.error(e); }
    }

    const select = $('#machineType');
    select.innerHTML = '<option value="">— Pilih Tipe Mesin —</option>';
    state.machineTypes.forEach(t => {
      select.innerHTML += '<option value="' + esc(t) + '">' + esc(t) + '</option>';
    });

    // Also populate filter
    const filterSel = $('#filterMachineType');
    filterSel.innerHTML = '<option value="">Semua Tipe Mesin</option>';
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
      const res = await fetch('/api/next-form-id');
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
      const res = await fetch('/api/templates/' + encodeURIComponent(type));
      const tasks = await res.json();
      renderTaskList(tasks);
      $('#taskListCard').style.display = 'block';
      $('#verificationCard').style.display = 'block';
      $('#formActions').style.display = 'flex';
      $('#taskCount').textContent = tasks.length + ' Item';
    } catch(e) { console.error(e); }
  });

  function renderTaskList(tasks) {
    const tbody = $('#taskTableBody');
    tbody.innerHTML = tasks.map(task => {
      // Split task description by ":"
      const parts = task.task_description.split(':');
      const category = parts[0].trim();
      const detail = parts.slice(1).join(':').trim();

      return `
        <tr>
          <td>${task.item_no}</td>
          <td class="task-desc"><strong>${esc(category)}</strong>${detail ? ' : ' + esc(detail) : ''}</td>
          <td>
            <div class="status-radios">
              <input type="radio" class="status-radio" name="status_${task.item_no}" id="ok_${task.item_no}" value="OK">
              <label for="ok_${task.item_no}" class="status-label label-ok">OK</label>
              <input type="radio" class="status-radio" name="status_${task.item_no}" id="nok_${task.item_no}" value="NOT OKE">
              <label for="nok_${task.item_no}" class="status-label label-nok">NOT OKE</label>
            </div>
          </td>
          <td>
            <input type="text" class="task-remark-input" data-item="${task.item_no}" placeholder="Keterangan...">
          </td>
        </tr>
      `;
    }).join('');
  }

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

    // Collect task items
    const taskRows = $$('#taskTableBody tr');
    const items = [];
    let allFilled = true;

    taskRows.forEach((row, i) => {
      const itemNo = i + 1;
      const statusRadio = document.querySelector(`input[name="status_${itemNo}"]:checked`);
      const remarkInput = row.querySelector('.task-remark-input');
      const taskDesc = row.querySelector('.task-desc').textContent;

      if (!statusRadio) {
        allFilled = false;
      }

      items.push({
        item_no: itemNo,
        task_description: taskDesc,
        status: statusRadio ? statusRadio.value : '',
        remarks: remarkInput ? remarkInput.value.trim() : ''
      });
    });

    if (!allFilled) {
      showToast('Semua status task harus diisi (OK / NOT OKE)', 'error');
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
      const res = await fetch('/api/inspections', {
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
      const res = await fetch('/api/inspections?' + params.toString());
      const data = await res.json();
      data._key = cacheKey;
      state.historyCache = data;
      renderHistory(data);
    } catch(e) { console.error(e); }
  }

  function renderHistory(data) {
    const tbody = $('#historyTableBody');
    const empty = $('#historyEmpty');

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '';
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
      const res = await fetch('/api/inspections/' + id);
      const data = await res.json();
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
    tbody.innerHTML = data.items.map(item => {
      const statusClass = item.status === 'OK' ? 's-ok' : (item.status === 'NOT OKE' ? 's-nok' : '');
      return `
        <tr>
          <td>${item.item_no}</td>
          <td>${esc(item.task_description)}</td>
          <td class="detail-status ${statusClass}">${esc(item.status) || '—'}</td>
          <td>${esc(item.remarks) || '—'}</td>
        </tr>
      `;
    }).join('');

    // Verification
    $('#printVerification').innerHTML = 'Hasil Verifikasi : <strong>' + esc(data.verification_result) + '</strong> (dilakukan oleh Group Leader / LPU, coret yang tidak perlu)';

    // Signatures
    $('#printSigMaintenance').textContent = data.maintenance_support_name || '_______________';
    $('#printSigGroupLeader').textContent = data.group_leader_name || '_______________';
    $('#printSigLogistic').textContent = data.logistic_leader_name || '_______________';
  }

  // Print PDF
  $('#btnPrintPDF').addEventListener('click', () => {
    window.print();
  });

  // Export Excel
  $('#btnExportExcel').addEventListener('click', () => {
    if (state.currentDetailId) {
      window.location.href = '/api/inspections/' + state.currentDetailId + '/excel';
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
      const res = await fetch('/api/inspections/' + pendingDeleteId, { method: 'DELETE' });
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
    // Check existing session
    const savedRole = sessionStorage.getItem('pm_user_role');
    if (savedRole && (savedRole === 'admin' || savedRole === 'user')) {
      applyRole(savedRole);
      hidePinOverlay();
    } else {
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

  function verifyPin() {
    const role = PIN_MAP[state.enteredPin];
    if (role) {
      applyRole(role);
      sessionStorage.setItem('pm_user_role', role);
      hidePinOverlay();
      showToast('Masuk sebagai ' + (role === 'admin' ? 'Admin' : 'User'), 'success');
      
      // If user role, make sure they don't land on dashboard
      if (role === 'user') {
        navigateTo('new-inspection', true);
      } else {
        navigateTo('dashboard', true);
      }
    } else {
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
    sessionStorage.removeItem('pm_user_role');
    state.currentRole = null;
    showPinOverlay();
  }

  // ============================================================
  // INIT
  // ============================================================
  initPinAuth();

})();

