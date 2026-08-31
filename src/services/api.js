const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const api = {
  // 1. Strict Login
  async login(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials. Please try again.');
    }
    return data;
  },

  // 2. Strict Register
  async register(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account.');
    }
    return data;
  },

  // 3. User & Assessment Session Sync
  async getMe() {
    const res = await resilientFetch(`${API_BASE_URL}/patient/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify session.');
    }
    return data;
  },

  // 4. Submit Assessment
  async submitAssessment(assessmentPayload) {
    const res = await resilientFetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(assessmentPayload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit assessment.');
    }
    return data;
  },

  // 5. Gynecologist Directory
  async getGynecologists() {
    const res = await resilientFetch(`${API_BASE_URL}/gynecologists`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retrieve specialists.');
    }
    return data;
  },

  // 6. Fetch Doctor Report Blob (Reusable for Instant Cache & Direct Print)
  async fetchDoctorReportBlob(lang = 'en') {
    const activeLang = lang === 'sw' ? 'sw' : 'en';
    const res = await resilientFetch(
      `${API_BASE_URL}/reports/doctor-summary?lang=${encodeURIComponent(activeLang)}`,
      {
        method: 'GET',
        headers: getHeaders(false),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch doctor summary report.');
    }

    return await res.blob();
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