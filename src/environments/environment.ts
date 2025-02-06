export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  defaultPageSize: 10,
  tokenKey: 'currentUser',  // Changed to match the key used in AuthService
  refreshTokenInterval: 3600000, // 1 hour in milliseconds
};
