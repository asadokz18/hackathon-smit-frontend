// Centralized API client with automatic JWT token injection

const parseApiResponse = async (response) => {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const request = async (url, options = {}) => {
  const token = localStorage.getItem('medpulse_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await parseApiResponse(response);

    if (!response.ok) {
      // Map error message
      const errorMsg =
        data.message ||
        (response.status === 500
          ? 'Backend service error. Ensure API server and MongoDB are running.'
          : `API request failed with status: ${response.status}`);
      const err = new Error(errorMsg);
      err.status = response.status;
      err.limitReached = data.limitReached || false;
      err.aiBlocked = data.aiBlocked || false;
      throw err;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      const networkErr = new Error('Unable to reach API server. Please make sure backend is running on port 5000.');
      networkErr.status = 0;
      throw networkErr;
    }
    console.error(`[API Service Request Error] on ${url}:`, error);
    throw error;
  }
};

export const api = {
  get: (url, headers) => request(url, { method: 'GET', headers }),
  post: (url, body, headers) => request(url, { method: 'POST', body: JSON.stringify(body), headers }),
  put: (url, body, headers) => request(url, { method: 'PUT', body: JSON.stringify(body), headers }),
  delete: (url, headers) => request(url, { method: 'DELETE', headers }),
};
