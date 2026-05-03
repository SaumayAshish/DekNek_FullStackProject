'use client';

export const setAuth = (token: string, user: object) => {
  localStorage.setItem('portfolio_token', token);
  localStorage.setItem('portfolio_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('portfolio_token');
  localStorage.removeItem('portfolio_user');
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('portfolio_token');
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('portfolio_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
