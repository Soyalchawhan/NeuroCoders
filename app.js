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