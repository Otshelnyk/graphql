import { loginLayout } from '../presentation/layouts.js';

export function createLoginController({ root, signIn, saveToken, onAuthenticated }) {
  function show() {
    root.innerHTML = loginLayout();
    const error = (message) => { document.getElementById('errorText').textContent = message; document.getElementById('errorBox').classList.add('visible'); };
    document.getElementById('togglePassword').addEventListener('click', () => { const input = document.getElementById('password'); input.type = input.type === 'password' ? 'text' : 'password'; });
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;
      if (!identifier || !password) return error('Please fill in all fields.');
      const button = document.getElementById('submitBtn');
      button.disabled = true; button.classList.add('loading'); document.getElementById('errorBox').classList.remove('visible');
      try { saveToken(await signIn(identifier, password)); onAuthenticated(); }
      catch (cause) { error(cause.message); button.disabled = false; button.classList.remove('loading'); }
    });
  }
  return { show };
}
