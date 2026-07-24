import { API } from '../config/api.js';

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export async function signIn(identifier, password) {
  let response;
  try {
    response = await fetch(API.auth, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${identifier}:${password}`)}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new AuthenticationError('Unable to reach the server. Check your connection and try again.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError('Invalid username or password.');
  }
  if (!response.ok) {
    throw new AuthenticationError(`Server error (${response.status}). Please try again later.`);
  }

  const token = (await response.text()).replace(/^"|"$/g, '').trim();
  if (!token || token.split('.').length !== 3) {
    throw new AuthenticationError('Unexpected server response. Please try again.');
  }
  return token;
}
