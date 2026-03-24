/* ── State ── */
const state = {
  gatePasses: [],
  rooms: [],
  messMenu: [],
  visitors: [],
  complaints: [],
  students: [],
  smsLog: [],
  attendance: {},
  settings: { hostel: '', warden: '', institution: '' },
  editingRoomIndex: null,
};
 
/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initClock();
  setupNav();
  setupSidebarToggle();
  initAttendanceDate();
  renderAll();
 
  // Show setup modal if first time
  if (!state.settings.warden) {
    setTimeout(() => showSetupModal(), 400);
  }
});
 
/* ── Persist ── */
function saveState() {
  localStorage.setItem('hostelsync_state', JSON.stringify(state));
}
 
function loadState() {
  const saved = localStorage.getItem('hostelsync_state');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  }
}
 
/* ── Clock ── */
function initClock() {
  function tick() {
    const now = new Date();
    const opts = { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: true };
    document.getElementById('liveClock').textContent = now.toLocaleString('en-IN', opts);
  }
  tick();
  setInterval(tick, 1000);
}
 
/* ── Nav ── */
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      showPage(page);
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}
 
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
  // Update title
  const titles = {
    dashboard:     ['Dashboard', 'Overview & Quick Stats'],
    gatepasses:    ['Gate Passes', 'Digital approval workflow'],
    rooms:         ['Room Management', 'Real-time allocation'],
    mess:          ['Mess & Menu', 'Voting & weekly schedule'],
    visitors:      ['Visitor Log', 'Entry & exit tracking'],
    complaints:    ['Complaints', 'Escalation with SLA tracking'],
    notifications: ['SMS Notifications', 'Parent communication'],
    attendance:    ['Attendance', 'Daily roll call'],
  };
  const info = titles[pageId] || [pageId, ''];
  document.getElementById('pageTitle').textContent = info[0];
  document.getElementById('pageBreadcrumb').textContent = info[1];
  // Render page-specific content
  renderPage(pageId);
}
 
function renderPage(pageId) {
  switch (pageId) {
    case 'dashboard':     renderDashboard(); break;
    case 'gatepasses':    renderGatePasses('all'); break;
    case 'rooms':         renderRooms(); break;
    case 'mess':          renderMess('all'); break;
    case 'visitors':      renderVisitors(); break;
    case 'complaints':    renderComplaints('all'); break;
    case 'notifications': renderSMSLog(); break;
    case 'attendance':    renderAttendance(); break;
  }
}
 
function renderAll() {
  renderDashboard();
  updateBadges();
}

/* ── Sidebar Toggle ── */
function setupSidebarToggle() {
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

/* ── Setup ── */
function showSetupModal() {
  document.getElementById('setup-hostel').value = state.settings.hostel || '';
  document.getElementById('setup-warden').value = state.settings.warden || '';
  document.getElementById('setup-institution').value = state.settings.institution || '';
  openModal('modal-setup');
}

function saveSetup() {
  const hostel = document.getElementById('setup-hostel').value.trim();
  const warden = document.getElementById('setup-warden').value.trim();
  const institution = document.getElementById('setup-institution').value.trim();
  if (!warden) return showToast('Warden name is required.', 'error');
  state.settings = { hostel, warden, institution };
  document.getElementById('warden-name-display').textContent = warden || 'Warden';
  saveState();
  closeModal('modal-setup');
  showToast('Settings saved!', 'success');
}

/* ── DASHBOARD ── */
function renderDashboard() {
  const { gatePasses, rooms, visitors, complaints, students } = state;

  // Update warden name
  if (state.settings.warden) {
    document.getElementById('warden-name-display').textContent = state.settings.warden;
  }

  // Stats
  const pending = gatePasses.filter(g => g.status === 'pending').length;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const available = rooms.filter(r => r.status === 'available').length;
  const todayVisitors = visitors.filter(v => v.date === todayStr()).length;
  const openComplaints = complaints.filter(c => c.status !== 'resolved').length;
  const totalStudents = students.length;

  const statsHTML = `
    <div class="stat-card">
      <div class="stat-icon teal"><i class="fa-solid fa-users"></i></div>
      <div>
        <div class="stat-value">${totalStudents}</div>
        <div class="stat-label">Total Students</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon coral"><i class="fa-solid fa-door-open"></i></div>
      <div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">Pending Gate Passes</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green"><i class="fa-solid fa-bed"></i></div>
      <div>
        <div class="stat-value">${available}</div>
        <div class="stat-label">Rooms Available</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange"><i class="fa-solid fa-users-line"></i></div>
      <div>
        <div class="stat-value">${occupied}</div>
        <div class="stat-label">Rooms Occupied</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon teal"><i class="fa-solid fa-person-walking-arrow-right"></i></div>
      <div>
        <div class="stat-value">${todayVisitors}</div>
        <div class="stat-label">Visitors Today</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div>
        <div class="stat-value">${openComplaints}</div>
        <div class="stat-label">Open Complaints</div>
      </div>
    </div>
  `;
  document.getElementById('statsGrid').innerHTML = statsHTML;

  // Pending gate passes widget
  const pendingPasses = gatePasses.filter(g => g.status === 'pending').slice(0, 4);
  const gpEl = document.getElementById('dash-gatepass-list');
  if (pendingPasses.length === 0) {
    gpEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-check-circle" style="font-size:2rem; color:var(--teal-300);"></i><p>No pending approvals</p></div>`;
  } else {
    gpEl.innerHTML = pendingPasses.map(gp => `
      <div class="dash-gp-item">
        <div>
          <div class="dash-gp-name">${gp.student}</div>
          <div class="dash-gp-meta">Room ${gp.room} · ${gp.destination}</div>
        </div>
        <div style="display:flex;gap:5px;">
          <button class="btn-approve" onclick="approveGatePass('${gp.id}')">Approve</button>
          <button class="btn-reject" onclick="rejectGatePass('${gp.id}')">Reject</button>
        </div>
      </div>
    `).join('');
  }

  // Active complaints widget
  const activeComps = complaints.filter(c => c.status !== 'resolved').slice(0, 3);
  const compEl = document.getElementById('dash-complaint-list');
  if (activeComps.length === 0) {
    compEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-face-smile" style="font-size:2rem; color:var(--teal-300);"></i><p>No active complaints</p></div>`;
  } else {
    compEl.innerHTML = activeComps.map(c => `
      <div class="dash-gp-item">
        <div>
          <div class="dash-gp-name">${c.category} — ${c.name}</div>
          <div class="dash-gp-meta">Room ${c.room} · <span class="badge badge-${c.priority}" style="padding:1px 7px;">${c.priority}</span></div>
        </div>
        <span class="badge badge-${c.status}">${c.status}</span>
      </div>
    `).join('');
  }

  // Today's visitors widget
  const todayVis = visitors.filter(v => v.date === todayStr()).slice(0, 4);
  const visEl = document.getElementById('dash-visitor-list');
  if (todayVis.length === 0) {
    visEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-person-walking-arrow-right" style="font-size:2rem; color:var(--teal-300);"></i><p>No visitors logged today</p></div>`;
  } else {
    visEl.innerHTML = todayVis.map(v => `
      <div class="dash-gp-item">
        <div>
          <div class="dash-gp-name">${v.name}</div>
          <div class="dash-gp-meta">${v.relation} of ${v.student} · Room ${v.room}</div>
        </div>
        <span class="badge badge-${v.outTime ? 'left' : 'inside'}">${v.outTime ? 'Left' : 'Inside'}</span>
      </div>
    `).join('');
  }

  // Mess vote summary
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  const todayMess = state.messMenu.filter(m => m.day === today);
  const messEl = document.getElementById('dash-mess-summary');
  if (todayMess.length === 0) {
    messEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-utensils" style="font-size:2rem; color:var(--teal-300);"></i><p>No menu for today yet</p></div>`;
  } else {
    messEl.innerHTML = todayMess.map(m => `
      <div class="dash-gp-item">
        <div>
          <div class="dash-gp-name">${m.meal}</div>
          <div class="dash-gp-meta">${m.items}</div>
        </div>
        <div style="font-size:0.78rem; color:var(--teal-600);">👍 ${m.upvotes || 0}</div>
      </div>
    `).join('');
  }

  updateBadges();
}

/* ── GATE PASSES ── */
function openGatePassModal() {
  clearForm(['gp-student','gp-room','gp-destination','gp-out','gp-return','gp-parentphone','gp-notes']);
  document.getElementById('gp-reason').selectedIndex = 0;
  openModal('modal-gatepass');
}

function submitGatePass() {
  const student = v('gp-student');
  const room = v('gp-room');
  const destination = v('gp-destination');
  const out = v('gp-out');
  const ret = v('gp-return');
  const reason = v('gp-reason');
  if (!student || !room || !destination || !out || !ret || !reason) {
    return showToast('Please fill all required fields.', 'error');
  }
  const gp = {
    id: uid(),
    student, room, destination,
    out, return: ret, reason,
    parentPhone: v('gp-parentphone'),
    notes: v('gp-notes'),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.gatePasses.unshift(gp);
  saveState();
  closeModal('modal-gatepass');
  showToast('Gate pass request submitted!', 'success');
  renderGatePasses('all');
  renderDashboard();
}

function approveGatePass(id) {
  const gp = state.gatePasses.find(g => g.id === id);
  if (!gp) return;
  gp.status = 'approved';
  gp.approvedAt = new Date().toISOString();
  saveState();
  showToast(`Gate pass approved for ${gp.student}`, 'success');
  if (gp.parentPhone) {
    autoLogSMS('gatepass_approved', gp.parentPhone, gp.student);
  }
  renderDashboard();
  renderGatePasses(currentGpFilter);
}

function rejectGatePass(id) {
  const gp = state.gatePasses.find(g => g.id === id);
  if (!gp) return;
  gp.status = 'rejected';
  saveState();
  showToast(`Gate pass rejected for ${gp.student}`, 'error');
  if (gp.parentPhone) {
    autoLogSMS('gatepass_rejected', gp.parentPhone, gp.student);
  }
  renderDashboard();
  renderGatePasses(currentGpFilter);
}

function deleteGatePass(id) {
  if (!confirm('Delete this gate pass?')) return;
  state.gatePasses = state.gatePasses.filter(g => g.id !== id);
  saveState();
  renderGatePasses(currentGpFilter);
  renderDashboard();
  showToast('Gate pass deleted.', 'info');
}

let currentGpFilter = 'all';
function filterGatePasses(filter, btn) {
  currentGpFilter = filter;
  document.querySelectorAll('#page-gatepasses .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGatePasses(filter);
}

function renderGatePasses(filter) {
  let list = state.gatePasses;
  if (filter !== 'all') list = list.filter(g => g.status === filter);

  const tbody = document.getElementById('gatePassTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No gate pass requests found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(gp => `
    <tr>
      <td><strong>${gp.student}</strong></td>
      <td>${gp.room}</td>
      <td>${gp.destination}</td>
      <td>${fmtDateTime(gp.out)}</td>
      <td>${fmtDateTime(gp.return)}</td>
      <td>${gp.reason}</td>
      <td><span class="badge badge-${gp.status}">${gp.status}</span></td>
      <td>
        <div class="td-actions">
          ${gp.status === 'pending' ? `
            <button class="btn-approve" onclick="approveGatePass('${gp.id}')">Approve</button>
            <button class="btn-reject" onclick="rejectGatePass('${gp.id}')">Reject</button>
          ` : ''}
          <button class="btn-icon danger" onclick="deleteGatePass('${gp.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── ROOMS ── */
function openRoomModal(index) {
  state.editingRoomIndex = (index !== undefined) ? index : null;
  if (index !== undefined) {
    const r = state.rooms[index];
    setVal('room-number', r.number);
    setVal('room-floor', r.floor);
    setVal('room-capacity', r.capacity);
    setVal('room-occupants', r.occupants);
    setVal('room-amenities', r.amenities);
    document.getElementById('room-type').value = r.type || 'Double';
    document.getElementById('room-status').value = r.status || 'available';
  } else {
    clearForm(['room-number','room-floor','room-capacity','room-occupants','room-amenities']);
    document.getElementById('room-type').selectedIndex = 0;
    document.getElementById('room-status').selectedIndex = 0;
  }
  openModal('modal-room');
}

function saveRoom() {
  const number = v('room-number');
  const capacity = v('room-capacity');
  if (!number || !capacity) return showToast('Room number and capacity are required.', 'error');

  const room = {
    number, floor: v('room-floor'),
    capacity: parseInt(capacity),
    type: document.getElementById('room-type').value,
    status: document.getElementById('room-status').value,
    occupants: v('room-occupants'),
    amenities: v('room-amenities'),
  };

  if (state.editingRoomIndex !== null) {
    state.rooms[state.editingRoomIndex] = room;
    showToast('Room updated!', 'success');
  } else {
    state.rooms.push(room);
    showToast('Room added!', 'success');
  }

  saveState();
  closeModal('modal-room');
  renderRooms();
  renderDashboard();
}

function deleteRoom(index) {
  if (!confirm('Delete this room?')) return;
  state.rooms.splice(index, 1);
  saveState();
  renderRooms();
  renderDashboard();
  showToast('Room deleted.', 'info');
}

function renderRooms() {
  const grid = document.getElementById('roomGrid');
  const rooms = state.rooms;

  // Stats mini
  const avail = rooms.filter(r => r.status === 'available').length;
  const occ   = rooms.filter(r => r.status === 'occupied').length;
  const maint = rooms.filter(r => r.status === 'maintenance').length;
  document.getElementById('roomStatsMini').innerHTML = `
    <span class="room-mini-stat"><span class="room-mini-dot dot-available"></span>${avail} Available</span>
    <span class="room-mini-stat"><span class="room-mini-dot dot-occupied"></span>${occ} Occupied</span>
    <span class="room-mini-stat"><span class="room-mini-dot dot-maintenance"></span>${maint} Maintenance</span>
  `;

  if (rooms.length === 0) {
    grid.innerHTML = `<div class="empty-state full-width"><i class="fa-solid fa-bed" style="font-size:2.5rem;color:var(--teal-300);"></i><p>No rooms added yet. Click "Add Room" to get started.</p></div>`;
    return;
  }

  grid.innerHTML = rooms.map((r, i) => {
    const occCount = r.occupants ? r.occupants.split(',').filter(s => s.trim()).length : 0;
    const fillPct = r.capacity > 0 ? Math.min((occCount / r.capacity) * 100, 100) : 0;
    const dotColor = { available: 'dot-available', occupied: 'dot-occupied', maintenance: 'dot-maintenance' }[r.status] || 'dot-available';
    return `
      <div class="room-card">
        <div class="room-card-header">
          <div>
            <div class="room-number">Room ${r.number}</div>
            <div class="room-type-label">${r.type} · Floor: ${r.floor || '—'}</div>
          </div>
          <div class="room-status-dot ${dotColor}" title="${r.status}"></div>
        </div>
        <div class="room-occupancy-bar">
          <div class="room-occupancy-fill" style="width:${fillPct}%;"></div>
        </div>
        <div class="room-meta">
          <strong>${occCount}</strong> / ${r.capacity} occupants
          ${r.amenities ? `<br><span style="margin-top:4px;display:inline-block;">${r.amenities}</span>` : ''}
        </div>
        ${r.occupants ? `<div class="room-meta" style="margin-top:0.4rem;"><strong>Occupants:</strong> ${r.occupants}</div>` : ''}
        <div class="room-card-actions">
          <button class="btn-ghost" style="flex:1;justify-content:center;" onclick="openRoomModal(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-icon danger" onclick="deleteRoom(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── MESS ── */
function openMessModal() {
  clearForm(['mess-items','mess-notes']);
  document.getElementById('mess-day').selectedIndex = 0;
  document.getElementById('mess-meal').selectedIndex = 0;
  openModal('modal-mess');
}

function saveMessItem() {
  const day  = document.getElementById('mess-day').value;
  const meal = document.getElementById('mess-meal').value;
  const items = v('mess-items');
  if (!items) return showToast('Menu items are required.', 'error');

  state.messMenu.push({ id: uid(), day, meal, items, notes: v('mess-notes'), upvotes: 0, downvotes: 0 });
  saveState();
  closeModal('modal-mess');
  showToast('Menu item added!', 'success');
  renderMess(currentMessFilter);
}

function voteMenu(id, type) {
  const item = state.messMenu.find(m => m.id === id);
  if (!item) return;
  if (type === 'up') item.upvotes = (item.upvotes || 0) + 1;
  else item.downvotes = (item.downvotes || 0) + 1;
  saveState();
  renderMess(currentMessFilter);
}

function deleteMessItem(id) {
  state.messMenu = state.messMenu.filter(m => m.id !== id);
  saveState();
  renderMess(currentMessFilter);
  showToast('Menu item removed.', 'info');
}

let currentMessFilter = 'all';
function filterMess(filter, btn) {
  currentMessFilter = filter;
  document.querySelectorAll('#page-mess .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderMess(filter);
}

function renderMess(filter) {
  let list = state.messMenu;
  if (filter !== 'all') list = list.filter(m => m.day === filter);

  const grid = document.getElementById('messGrid');
  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state full-width"><i class="fa-solid fa-utensils" style="font-size:2.5rem;color:var(--teal-300);"></i><p>No menu items for this selection.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(m => `
    <div class="mess-card">
      <div class="mess-card-head">
        <div class="mess-day-meal">${m.day}</div>
        <div class="mess-meal-type">${m.meal}</div>
      </div>
      <div class="mess-card-body">
        <div class="mess-items-list">${m.items}</div>
        ${m.notes ? `<div style="font-size:0.75rem;color:var(--gray-400);margin-top:0.5rem;font-style:italic;">${m.notes}</div>` : ''}
      </div>
      <div class="mess-card-footer">
        <div class="vote-section">
          <button class="vote-btn vote-up" onclick="voteMenu('${m.id}','up')">👍 ${m.upvotes || 0}</button>
          <button class="vote-btn vote-down" onclick="voteMenu('${m.id}','down')">👎 ${m.downvotes || 0}</button>
        </div>
        <button class="btn-icon danger" onclick="deleteMessItem('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}