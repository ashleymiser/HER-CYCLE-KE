const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Error thrown for every failed API call. Callers should branch on `status`
// (HTTP status code) or `isNetworkError`, never on the message text.
export class ApiError extends Error {
  constructor(message, { status = 0, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

// AuthContext registers a callback here so any authenticated request that
// comes back 401 (expired or revoked token) logs the user out centrally.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem('hercycle_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return headers;
}

// Resilient network fetcher with automated retry on transient failures
async function resilientFetch(url, options = {}, retries = 2, delay = 350) {
  try {
    const res = await fetch(url, options);
    // Don't retry on client credential errors (400, 401, 409)
    if (!res.ok && res.status >= 500 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return resilientFetch(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return resilientFetch(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Single entry point for all calls. Returns the Response on success and
// throws an ApiError (with `status`) on any failure.
// `notifyUnauthorized: false` is used by login/register, where a 401 means
// "wrong credentials", not "your session expired".
async function request(path, options, fallbackMessage, { notifyUnauthorized = true } = {}) {
  let res;
  try {
    res = await resilientFetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', {
      isNetworkError: true,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && notifyUnauthorized && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(data.error || fallbackMessage, { status: res.status });
  }

  return res;
}

async function requestJson(path, options, fallbackMessage, flags) {
  const res = await request(path, options, fallbackMessage, flags);
  return res.json().catch(() => ({}));
}

export const api = {
  // 1. Strict Login
  login(payload) {
    return requestJson(
      '/auth/login',
      { method: 'POST', headers: getHeaders(true), body: JSON.stringify(payload) },
      'Invalid credentials. Please try again.',
      { notifyUnauthorized: false }
    );
  },

  // 2. Strict Register
  register(payload) {
    return requestJson(
      '/auth/register',
      { method: 'POST', headers: getHeaders(true), body: JSON.stringify(payload) },
      'Failed to register account.',
      { notifyUnauthorized: false }
    );
  },

  // 3. User & Assessment Session Sync
  getMe() {
    return requestJson(
      '/patient/me',
      { method: 'GET', headers: getHeaders(true) },
      'Failed to verify session.'
    );
  },

  // 4. Submit Assessment
  submitAssessment(assessmentPayload) {
    return requestJson(
      '/assessments',
      { method: 'POST', headers: getHeaders(true), body: JSON.stringify(assessmentPayload) },
      'Failed to submit assessment.'
    );
  },

  // 5. Gynecologist Directory
  getGynecologists() {
    return requestJson(
      '/gynecologists',
      { method: 'GET', headers: getHeaders(true) },
      'Failed to retrieve specialists.'
    );
  },

  // 6. Fetch Doctor Report Blob (Reusable for Instant Cache & Direct Print)
  async fetchDoctorReportBlob(lang = 'en') {
    const activeLang = lang === 'sw' ? 'sw' : 'en';
    const res = await request(
      `/reports/doctor-summary?lang=${encodeURIComponent(activeLang)}`,
      { method: 'GET', headers: getHeaders(false) },
      'Failed to fetch doctor summary report.'
    );
    return res.blob();
  },

  // 7. Download Summary Sheet PDF in Selected Language
  async downloadDoctorReport(patientName = 'Patient', lang = 'en') {
    const activeLang = lang === 'sw' ? 'sw' : 'en';
    const blob = await this.fetchDoctorReportBlob(activeLang);
    const blobUrl = window.URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const sanitizedFileName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    const langCode = String(activeLang).toUpperCase();

    downloadAnchor.href = blobUrl;
    downloadAnchor.download = `HerCycle_Doctor_Summary_${langCode}_${sanitizedFileName}.pdf`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
