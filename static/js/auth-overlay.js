(function () {
  const API_BASE = window.__API_BASE || window.location.origin;
  const state = { user: null, mode: 'login' };

  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:9999',
    'background:rgba(10,12,16,0.9)',
    'color:#f5f7ff',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'font-family:system-ui, -apple-system, Segoe UI, sans-serif',
    'padding:16px',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = 'width:360px;max-width:100%;background:#121521;border:1px solid #2d3355;border-radius:12px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.35)';

  const heading = document.createElement('h2');
  heading.textContent = 'Telehealth Demo Login';
  heading.style.marginTop = '0';

  const sub = document.createElement('p');
  sub.textContent = 'Demo / MVP auth. Clinical data remains mock/localStorage. Messaging uses MongoDB.';
  sub.style.fontSize = '13px';
  sub.style.lineHeight = '1.5';
  sub.style.color = '#c7cbe6';

  const statusRow = document.createElement('div');
  statusRow.style.cssText = 'margin:8px 0 12px;color:#c7d7ff;font-size:13px;min-height:18px;';

  const form = document.createElement('form');
  form.autocomplete = 'on';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.required = true;
  emailInput.placeholder = 'Email';
  emailInput.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:1px solid #30385a;background:#0f111b;color:#fff;margin-bottom:10px;';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.required = true;
  passwordInput.placeholder = 'Password';
  passwordInput.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:1px solid #30385a;background:#0f111b;color:#fff;margin-bottom:10px;';

  const roleSelect = document.createElement('select');
  roleSelect.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:1px solid #30385a;background:#0f111b;color:#fff;margin-bottom:10px;';
  ['patient', 'doctor', 'nurse', 'admin'].forEach((role) => {
    const opt = document.createElement('option');
    opt.value = role;
    opt.textContent = role;
    roleSelect.appendChild(opt);
  });
  roleSelect.value = 'patient';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Login';
  submitBtn.style.cssText = 'width:100%;padding:10px;border-radius:8px;border:1px solid #4b7bff;background:#4b7bff;color:#fff;font-weight:600;cursor:pointer;margin-bottom:8px;';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.textContent = 'Need an account? Register';
  toggleBtn.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #30385a;background:#161b2b;color:#d0d5f5;cursor:pointer;font-size:12px;';

  const logoutButton = document.createElement('button');
  logoutButton.id = 'auth-logout-button';
  logoutButton.textContent = 'Logout';
  logoutButton.style.cssText = [
    'position:fixed',
    'top:12px',
    'right:12px',
    'z-index:9998',
    'padding:8px 12px',
    'background:#1d2335',
    'color:#f1f5ff',
    'border:1px solid #2e3655',
    'border-radius:8px',
    'cursor:pointer',
    'display:none',
  ].join(';');

  function setStatus(msg, tone = 'info') {
    statusRow.textContent = msg || '';
    statusRow.style.color = tone === 'error' ? '#ff9a9a' : '#c7d7ff';
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function findButton(label) {
    const lower = label.toLowerCase();
    return Array.from(document.querySelectorAll('button')).find((btn) => btn.textContent && btn.textContent.toLowerCase().includes(lower));
  }

  async function clickButtonWithRetry(label) {
    for (let i = 0; i < 20; i++) {
      const btn = findButton(label);
      if (btn) {
        btn.click();
        return true;
      }
      await delay(150);
    }
    return false;
  }

  async function goHomeIfPossible() {
    const back = findButton('Back to Home');
    if (back) back.click();
  }

  async function routeByRole(role) {
    const map = {
      patient: 'Patient Portal',
      doctor: 'Doctor Dashboard',
      nurse: 'Nurse Dashboard',
      admin: 'Admin Portal',
    };
    const label = map[role];
    if (!label) return;
    const ok = await clickButtonWithRetry(label);
    if (!ok) {
      console.warn('[auth-overlay] Could not auto-route to dashboard for role', role);
    }
  }

  async function hydrateSession() {
    setStatus('Checking session...');
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const body = await res.json();
        state.user = body.user;
        setStatus(`Signed in as ${state.user.email} (${state.user.role})`);
        overlay.style.display = 'none';
        logoutButton.style.display = 'inline-flex';
        await routeByRole(state.user.role);
        return;
      }
    } catch (err) {
      console.warn('[auth-overlay] session restore failed', err);
    }
    overlay.style.display = 'flex';
    logoutButton.style.display = 'none';
    setStatus('Please log in to continue.');
  }

  async function submitAuth(evt) {
    evt.preventDefault();
    const email = (emailInput.value || '').trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus('Email and password are required', 'error');
      return;
    }

    const mode = state.mode;
    setStatus(mode === 'login' ? 'Signing in...' : 'Registering...');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email, password }
      : { email, password, role: roleSelect.value };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        setStatus(`Auth failed (${res.status}): ${msg}`, 'error');
        return;
      }

      const body = await res.json();
      state.user = body.user;
      setStatus(`Signed in as ${state.user.email} (${state.user.role})`);
      overlay.style.display = 'none';
      logoutButton.style.display = 'inline-flex';
      await routeByRole(state.user.role);
    } catch (err) {
      console.error('[auth-overlay] auth error', err);
      setStatus('Network or server error during auth', 'error');
    }
  }

  function toggleMode() {
    state.mode = state.mode === 'login' ? 'register' : 'login';
    const isRegister = state.mode === 'register';
    submitBtn.textContent = isRegister ? 'Register' : 'Login';
    toggleBtn.textContent = isRegister ? 'Have an account? Go to login' : 'Need an account? Register';
    roleSelect.style.display = isRegister ? 'block' : 'none';
    setStatus(isRegister ? 'Self-signup: choose a role and password' : 'Enter credentials to sign in');
  }

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('[auth-overlay] logout error', err);
    }
    state.user = null;
    logoutButton.style.display = 'none';
    overlay.style.display = 'flex';
    setStatus('Logged out. Please sign in.');
    await goHomeIfPossible();
  }

  function bootstrapDom() {
    panel.appendChild(heading);
    panel.appendChild(sub);
    panel.appendChild(statusRow);
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    form.appendChild(roleSelect);
    form.appendChild(submitBtn);
    form.appendChild(toggleBtn);
    panel.appendChild(form);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.appendChild(logoutButton);

    roleSelect.style.display = 'none';
    overlay.style.display = 'none';

    form.addEventListener('submit', submitAuth);
    toggleBtn.addEventListener('click', toggleMode);
    logoutButton.addEventListener('click', handleLogout);
  }

  function installFetchShim() {
    if (window.__authFetchShimInstalled) return;
    const original = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      const nextInit = Object.assign({ credentials: 'include' }, init);
      nextInit.headers = Object.assign({}, init.headers || {}, { 'X-Requested-With': 'fetch' });
      return original(input, nextInit);
    };
    window.__authFetchShimInstalled = true;
  }

  function init() {
    installFetchShim();
    bootstrapDom();
    hydrateSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
