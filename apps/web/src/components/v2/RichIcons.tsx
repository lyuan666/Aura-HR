import React from 'react';

export const RichIcons = {
  Dashboard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" fill="#B0C4DE" />
      <rect x="14" y="3" width="7" height="7" rx="1" fill="#B0C4DE" opacity="0.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" fill="#B0C4DE" opacity="0.6" />
      <rect x="14" y="14" width="7" height="7" rx="1" fill="#B0C4DE" opacity="0.3" />
    </svg>
  ),
  Talent: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#B0C4DE" strokeWidth="2" />
      <path d="M6 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" stroke="#B0C4DE" strokeWidth="2" />
    </svg>
  ),
  Client: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6z" fill="#B0C4DE" opacity="0.2" />
      <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6z" stroke="#B0C4DE" strokeWidth="2" />
      <path d="M8 10h8M8 14h5" stroke="#B0C4DE" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Job: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="8" width="16" height="11" rx="1" stroke="#B0C4DE" strokeWidth="2" />
      <path d="M9 8V6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2" stroke="#B0C4DE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Delivery: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#B0C4DE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Contract: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="2" width="12" height="20" rx="1" stroke="#B0C4DE" strokeWidth="2" />
      <path d="M9 7h6M9 11h6M11 15h2" stroke="#B0C4DE" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Setting: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#B0C4DE" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="#B0C4DE" />
    </svg>
  ),
};
