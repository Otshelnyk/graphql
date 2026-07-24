import { profileLayout } from '../presentation/layouts.js';

const views = [
  { id: 'overview', label: 'Overview', title: 'Overview', subtitle: 'Welcome back' },
  { id: 'personal', label: 'Personal Info', title: 'Personal Info', subtitle: 'Your account details' },
  { id: 'projects', label: 'Projects', title: 'Projects', subtitle: 'Your project results' },
  { id: 'piscines', label: 'Piscines', title: 'Piscines', subtitle: 'Your piscine attempts' },
];

export function createProfileController({ root, loadProfile, populateSidebar, renderers, renderCharts, onLogout, onSessionExpired }) {
  let state = { view: 'overview', profile: null };

  function show() {
    root.innerHTML = profileLayout(views);
    bindEvents();
    load();
  }

  function bindEvents() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); document.body.style.overflow = ''; };
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      const opened = sidebar.classList.toggle('open');
      overlay.classList.toggle('visible', opened);
      document.body.style.overflow = opened ? 'hidden' : '';
    });
    overlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { closeSidebar(); switchView(button.dataset.view); }));
    document.getElementById('logoutBtn').addEventListener('click', () => { state = { view: 'overview', profile: null }; onLogout(); });
    document.getElementById('retryBtn').addEventListener('click', load);
  }

  async function load() {
    setStatus('loading');
    try {
      state.profile = await loadProfile();
      populateSidebar(state.profile);
      document.title = `${state.profile.userInfo?.login || 'User'}'s Profile — 01`;
      setStatus('ready');
      switchView(state.view, true);
    } catch (cause) {
      if (cause.code === 'UNAUTHORIZED') return onSessionExpired();
      setStatus('error', cause.message || 'Failed to load profile data.');
    }
  }

  function switchView(view, preserveNavigation = false) {
    if (!state.profile) return;
    state.view = views.some((item) => item.id === view) ? view : 'overview';
    const current = views.find((item) => item.id === state.view);
    document.getElementById('topbarTitle').textContent = current.title;
    document.getElementById('topbarSub').textContent = state.view === 'overview' ? `@${state.profile.userInfo?.login || ''}` : current.subtitle;
    if (!preserveNavigation) document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
    const content = document.getElementById('viewContent');
    content.innerHTML = renderers[state.view](state.profile);
    if (state.view === 'overview') renderCharts(state.profile);
  }

  function setStatus(status, message = '') {
    document.getElementById('loadingState').hidden = status !== 'loading';
    document.getElementById('errorState').hidden = status !== 'error';
    document.getElementById('viewContent').hidden = status !== 'ready';
    if (message) document.getElementById('profileErrorMsg').textContent = message;
  }

  return { show };
}
