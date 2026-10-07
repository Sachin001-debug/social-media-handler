const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const request = async (path, { method = "GET", body } = {}) => {
  const isFormData = body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
};

export const authApi = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
};

export const facebookApi = {
  // Full-page redirect to the backend, which then bounces to Facebook
  loginUrl: () => `${API_URL}/api/facebook`,

  status: () => request("/api/facebook/status"),

  accounts: () => request("/api/facebook/accounts"),

  pictureUrl: (id) => `${API_URL}/api/facebook/accounts/${encodeURIComponent(id)}/picture`,

  disconnect: (id) => request(`/api/facebook/accounts/${id}`, { method: "DELETE" }),

  scheduledPosts: () => request("/api/facebook/scheduled-posts"),

  saveScheduledPost: (payload) => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        body.append(key, value);
      }
    });
    return request("/api/facebook/scheduled-posts", { method: "POST", body });
  },
};

//insta api
export const instagramApi = {
  loginUrl: () => `${API_URL}/api/instagram`,
  accounts: () => request("/api/instagram/accounts"),
  disconnect: (id) =>
    request(`/api/instagram/accounts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
export { API_URL };