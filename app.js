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

/* ── VISITORS ── */
function openVisitorModal() {
  clearForm(['vis-name','vis-student','vis-room','vis-purpose','vis-phone']);
  document.getElementById('vis-relation').selectedIndex = 0;
  document.getElementById('vis-in').value = new Date().toTimeString().slice(0,5);
  openModal('modal-visitor');
}

function logVisitor() {
  const name = v('vis-name');
  const student = v('vis-student');
  const room = v('vis-room');
  const purpose = v('vis-purpose');
  if (!name || !student || !room || !purpose) return showToast('Please fill all required fields.', 'error');

  state.visitors.unshift({
    id: uid(),
    name, student, room, purpose,
    relation: document.getElementById('vis-relation').value,
    inTime: v('vis-in'),
    phone: v('vis-phone'),
    outTime: null,
    date: todayStr(),
  });
  saveState();
  closeModal('modal-visitor');
  showToast('Visitor logged!', 'success');
  renderVisitors();
  renderDashboard();
}

function markVisitorOut(id) {
  const vis = state.visitors.find(v => v.id === id);
  if (!vis) return;
  vis.outTime = new Date().toTimeString().slice(0,5);
  saveState();
  renderVisitors();
  renderDashboard();
  showToast('Visitor marked as exited.', 'info');
}

function deleteVisitor(id) {
  if (!confirm('Remove this visitor entry?')) return;
  state.visitors = state.visitors.filter(v => v.id !== id);
  saveState();
  renderVisitors();
  renderDashboard();
}

function renderVisitors() {
  const dateFilter = document.getElementById('visitorDateFilter').value;
  let list = state.visitors;
  if (dateFilter) {
    list = list.filter(v => v.date === dateFilter);
  }

  const tbody = document.getElementById('visitorTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No visitors found for the selected date.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(vis => `
    <tr>
      <td><strong>${vis.name}</strong></td>
      <td>${vis.relation}</td>
      <td>${vis.student}</td>
      <td>${vis.room}</td>
      <td>${vis.purpose}</td>
      <td>${vis.inTime || '—'}</td>
      <td>${vis.outTime || '—'}</td>
      <td><span class="badge badge-${vis.outTime ? 'left' : 'inside'}">${vis.outTime ? 'Left' : 'Inside'}</span></td>
      <td>
        <div class="td-actions">
          ${!vis.outTime ? `<button class="btn-ghost" style="font-size:0.75rem;padding:4px 8px;" onclick="markVisitorOut('${vis.id}')">Mark Out</button>` : ''}
          <button class="btn-icon danger" onclick="deleteVisitor('${vis.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── COMPLAINTS ── */
function openComplaintModal() {
  clearForm(['comp-name','comp-room','comp-description','comp-sla']);
  document.getElementById('comp-category').selectedIndex = 0;
  document.getElementById('comp-priority').value = 'medium';
  // Default SLA: 48hrs from now
  const slaDefault = new Date(Date.now() + 48 * 3600000);
  document.getElementById('comp-sla').value = slaDefault.toISOString().slice(0,16);
  openModal('modal-complaint');
}

function submitComplaint() {
  const name = v('comp-name');
  const description = v('comp-description');
  const category = document.getElementById('comp-category').value;
  if (!name || !description) return showToast('Name and description are required.', 'error');

  state.complaints.unshift({
    id: uid(),
    name, room: v('comp-room'), category,
    priority: document.getElementById('comp-priority').value,
    description,
    sla: v('comp-sla'),
    status: 'open',
    createdAt: new Date().toISOString(),
  });
  saveState();
  closeModal('modal-complaint');
  showToast('Complaint filed!', 'info');
  renderComplaints('all');
  renderDashboard();
}

function updateComplaintStatus(id, status) {
  const c = state.complaints.find(c => c.id === id);
  if (!c) return;
  c.status = status;
  if (status === 'resolved') c.resolvedAt = new Date().toISOString();
  saveState();
  showToast(`Complaint marked as ${status}.`, 'success');
  renderComplaints(currentCompFilter);
  renderDashboard();
}

function deleteComplaint(id) {
  if (!confirm('Delete this complaint?')) return;
  state.complaints = state.complaints.filter(c => c.id !== id);
  saveState();
  renderComplaints(currentCompFilter);
  renderDashboard();
}

let currentCompFilter = 'all';
function filterComplaints(filter, btn) {
  currentCompFilter = filter;
  document.querySelectorAll('#page-complaints .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderComplaints(filter);
}

function renderComplaints(filter) {
  let list = state.complaints;
  if (filter !== 'all') list = list.filter(c => c.status === filter);

  const container = document.getElementById('complaintList');
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:var(--teal-300);"></i><p>No complaints in this category.</p></div>`;
    return;
  }

  container.innerHTML = list.map(c => {
    const slaStatus = getSLAStatus(c.sla);
    return `
      <div class="complaint-card priority-${c.priority}">
        <div>
          <div class="comp-title">${c.category} — ${c.name}</div>
          <div class="comp-meta">
            <span>Room ${c.room || 'N/A'}</span>
            <span class="badge badge-${c.priority}" style="font-size:0.68rem;">${c.priority}</span>
            <span>${fmtDate(c.createdAt)}</span>
          </div>
          <div class="comp-desc">${c.description}</div>
          ${c.sla ? `<div class="comp-sla ${slaStatus.cls}"><i class="fa-solid fa-clock"></i> SLA: ${fmtDateTime(c.sla)} ${slaStatus.label}</div>` : ''}
        </div>
        <div class="comp-actions">
          <span class="badge badge-${c.status}">${c.status}</span>
          ${c.status !== 'resolved' ? `
            <select class="input-field" style="font-size:0.75rem;padding:4px 8px;" onchange="updateComplaintStatus('${c.id}', this.value)">
              <option value="">Update…</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          ` : ''}
          <button class="btn-icon danger" onclick="deleteComplaint('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function getSLAStatus(sla) {
  if (!sla) return { cls: '', label: '' };
  const now = new Date();
  const slaDate = new Date(sla);
  const diffMs = slaDate - now;
  if (diffMs < 0) return { cls: 'sla-overdue', label: '⚠ Overdue' };
  if (diffMs < 6 * 3600000) return { cls: 'sla-near', label: '⚡ Due soon' };
  return { cls: '', label: '' };
}

/* ── SMS NOTIFICATIONS ── */
const smsTemplates = {
  gatepass_approved: (name) => `Dear Parent, Gate pass for ${name || '[Student]'} has been APPROVED. They are permitted to leave the hostel premises. - HostelSync`,
  gatepass_rejected: (name) => `Dear Parent, Gate pass request for ${name || '[Student]'} has been REJECTED by the warden. Please contact the hostel for details. - HostelSync`,
  visitor_arrived:   (name) => `Dear Parent, A visitor has arrived at the hostel to meet ${name || '[Student]'}. Please contact the hostel if this was not expected. - HostelSync`,
  complaint_resolved:(name) => `Dear Parent, A complaint raised regarding ${name || '[Student]'} has been resolved by the warden. - HostelSync`,
  late_return:       (name) => `ALERT: ${name || '[Student]'} has not returned to the hostel by the expected time. Please contact the hostel immediately. - HostelSync`,
  custom:            ()     => '',
};

function fillSMSTemplate() {
  const tpl = document.getElementById('smsTemplateSelect').value;
  const name = document.getElementById('smsStudentName').value.trim();
  if (smsTemplates[tpl]) {
    document.getElementById('smsMessage').value = smsTemplates[tpl](name);
  }
}

function logSMS() {
  const phone   = document.getElementById('smsPhone').value.trim();
  const student = document.getElementById('smsStudentName').value.trim();
  const message = document.getElementById('smsMessage').value.trim();
  const event   = document.getElementById('smsTemplateSelect').value;
  if (!phone || !message) return showToast('Phone number and message are required.', 'error');

  state.smsLog.unshift({ id: uid(), phone, student, message, event, sentAt: new Date().toISOString() });
  saveState();
  showToast(`SMS logged for ${student || phone}`, 'success');
  document.getElementById('smsPhone').value = '';
  document.getElementById('smsStudentName').value = '';
  document.getElementById('smsMessage').value = '';
  document.getElementById('smsTemplateSelect').selectedIndex = 0;
  renderSMSLog();
}

function autoLogSMS(event, phone, student) {
  if (!phone) return;
  const fn = smsTemplates[event];
  const message = fn ? fn(student) : '';
  if (!message) return;
  state.smsLog.unshift({ id: uid(), phone, student, message, event, sentAt: new Date().toISOString(), auto: true });
  saveState();
}

function renderSMSLog() {
  const el = document.getElementById('smsLogList');
  if (state.smsLog.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-comment-sms" style="font-size:2rem;color:var(--teal-300);"></i><p>No SMS sent yet.</p></div>`;
    return;
  }
  el.innerHTML = '';
  state.smsLog.slice(0, 30).forEach(sms => {
    const div = document.createElement('div');
    div.className = 'sms-log-item';
    div.innerHTML = `
      <div class="sms-event">${formatEventLabel(sms.event)} ${sms.auto ? '<span style="font-size:0.65rem;background:var(--teal-50);color:var(--teal-600);padding:1px 6px;border-radius:99px;">auto</span>' : ''}</div>
      <div class="sms-msg">${sms.message}</div>
      <div class="sms-ts">📱 ${sms.phone} · ${sms.student ? sms.student + ' · ' : ''}${fmtDate(sms.sentAt)}</div>
    `;
    el.appendChild(div);
  });
}

function formatEventLabel(event) {
  const map = { gatepass_approved: 'Gate Pass Approved', gatepass_rejected: 'Gate Pass Rejected', visitor_arrived: 'Visitor Arrived', complaint_resolved: 'Complaint Resolved', late_return: 'Late Return Alert', custom: 'Custom Message' };
  return map[event] || event || 'SMS';
}

/* ── ATTENDANCE ── */
function initAttendanceDate() {
  document.getElementById('attendanceDateSelect').value = todayStr();
  document.getElementById('attendanceDateSelect').addEventListener('change', renderAttendance);
}

function openStudentModal() {
  clearForm(['stu-name','stu-roll','stu-room','stu-phone','stu-parent','stu-dept']);
  openModal('modal-student');
}

function saveStudent() {
  const name = v('stu-name');
  const roll = v('stu-roll');
  const room = v('stu-room');
  if (!name || !roll || !room) return showToast('Name, Roll No., and Room are required.', 'error');

  state.students.push({ id: uid(), name, roll, room, phone: v('stu-phone'), parentPhone: v('stu-parent'), dept: v('stu-dept') });
  saveState();
  closeModal('modal-student');
  showToast('Student registered!', 'success');
  renderAttendance();
  renderDashboard();
}

function markAttendance(studentId, status) {
  const date = document.getElementById('attendanceDateSelect').value || todayStr();
  if (!state.attendance[date]) state.attendance[date] = {};
  state.attendance[date][studentId] = status;
  saveState();
  renderAttendance();
}

function deleteStudent(id) {
  if (!confirm('Remove this student?')) return;
  state.students = state.students.filter(s => s.id !== id);
  saveState();
  renderAttendance();
  renderDashboard();
  showToast('Student removed.', 'info');
}

function renderAttendance() {
  const date = document.getElementById('attendanceDateSelect').value || todayStr();
  const tbody = document.getElementById('attendanceTableBody');
  if (state.students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No students registered. Click "Add Student" to begin.</td></tr>`;
    return;
  }
  const dayRecord = state.attendance[date] || {};
  tbody.innerHTML = state.students.map(s => {
    const att = dayRecord[s.id] || '';
    return `
      <tr>
        <td><strong>${s.name}</strong>${s.dept ? `<br><span style="font-size:0.73rem;color:var(--gray-400);">${s.dept}</span>` : ''}</td>
        <td>${s.room}</td>
        <td>${s.roll}</td>
        <td>${s.phone || '—'}</td>
        <td>${s.parentPhone || '—'}</td>
        <td>
          ${att ? `<span class="badge badge-${att}">${att}</span>` : '<span style="color:var(--gray-400);font-size:0.8rem;">Not marked</span>'}
        </td>
        <td>
          <div class="attendance-toggle">
            <button class="att-btn att-present ${att==='present'?'active':''}" onclick="markAttendance('${s.id}','present')">P</button>
            <button class="att-btn att-absent ${att==='absent'?'active':''}" onclick="markAttendance('${s.id}','absent')">A</button>
            <button class="att-btn att-leave ${att==='leave'?'active':''}" onclick="markAttendance('${s.id}','leave')">L</button>
            <button class="btn-icon danger" style="margin-left:4px;" onclick="deleteStudent('${s.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── BADGES ── */
function updateBadges() {
  const pending = state.gatePasses.filter(g => g.status === 'pending').length;
  const urgent  = state.complaints.filter(c => c.status !== 'resolved' && (c.priority === 'critical' || c.priority === 'high')).length;

  const gpBadge = document.getElementById('badge-gate');
  gpBadge.textContent = pending;
  gpBadge.style.display = pending > 0 ? 'inline' : 'none';

  const compBadge = document.getElementById('badge-complaint');
  compBadge.textContent = urgent;
  compBadge.style.display = urgent > 0 ? 'inline' : 'none';
}

/* ── QUICK ACTION ── */
function showQuickAction() {
  openGatePassModal();
}

/* ── MODAL HELPERS ── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* ── TOAST ── */
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* ── UTILS ── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function v(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function clearForm(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return iso; }
}