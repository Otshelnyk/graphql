import { API } from '../config/api.js';

export class GraphQLClientError extends Error {
  constructor(message, code = 'GRAPHQL_ERROR') {
    super(message);
    this.name = 'GraphQLClientError';
    this.code = code;
  }
}

export function createGraphQLClient({ getToken, onUnauthorized }) {
  return async function query(query, variables = {}) {
    const token = getToken();
    if (!token) throw new GraphQLClientError('Your session has ended.', 'UNAUTHORIZED');

    let response;
    try {
      response = await fetch(API.graphql, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query, variables }),
      });
    } catch {
      throw new GraphQLClientError('Unable to reach the server. Check your connection and try again.', 'NETWORK');
    }

    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      throw new GraphQLClientError('The server returned an invalid response.', 'INVALID_RESPONSE');
    }

    if (response.status === 401) {
      onUnauthorized();
      throw new GraphQLClientError('Your session has ended.', 'UNAUTHORIZED');
    }
    if (!response.ok) {
      throw new GraphQLClientError(body?.message || `Request failed (${response.status}).`, 'HTTP');
    }
    if (Array.isArray(body?.errors) && body.errors.length) {
      throw new GraphQLClientError(body.errors[0].message || 'GraphQL request failed.');
    }
    if (!body?.data) throw new GraphQLClientError('The server returned no data.', 'INVALID_RESPONSE');
    return body.data;
  };
}
