// Auto-detect API base URL
// In Docker environment (accessed via localhost:8080), use relative path
// In local development (accessed directly), use full URL
const API_BASE_URL = (window.location.port === '8080' || window.location.hostname === 'localhost')
    ? ''  // Use relative path in Docker
    : 'http://localhost:8000';  // Use full URL in local dev


// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// API functions
async function apiRequest(url, options = {}, skipAuthRedirect = false) {
    const response = await fetch(url, {
        ...options,
        headers: getAuthHeaders()
    });

    if (response.status === 401 && !skipAuthRedirect) {
        // Unauthorized - redirect to login (unless it's a password verification error)
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'index.html';
        throw new Error('未授权');
    }

    return response;
}

// Get all secrets
async function getSecrets() {
    const response = await apiRequest(`${API_BASE_URL}/api/secrets`);
    if (!response.ok) {
        throw new Error('获取密钥失败');
    }
    return response.json();
}

// Create a new secret
async function createSecret(data) {
    const response = await apiRequest(`${API_BASE_URL}/api/secrets`, {
        method: 'POST',
        body: JSON.stringify(data)
    }, true); // Skip auth redirect for password verification

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建密钥失败');
    }

    return response.json();
}

// Reveal secret content
async function revealSecret(id, password) {
    const response = await apiRequest(`${API_BASE_URL}/api/secrets/${id}/reveal`, {
        method: 'POST',
        body: JSON.stringify({ password })
    }, true); // Skip auth redirect for password verification

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '查看密钥失败');
    }

    return response.json();
}

// Update a secret
async function updateSecret(id, data) {
    const response = await apiRequest(`${API_BASE_URL}/api/secrets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }, true); // Skip auth redirect for password verification

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '更新密钥失败');
    }

    return response.json();
}

// Delete a secret
async function deleteSecret(id) {
    const response = await apiRequest(`${API_BASE_URL}/api/secrets/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('删除密钥失败');
    }

    return response.json();
}

// Get current user info
async function getCurrentUser() {
    const response = await apiRequest(`${API_BASE_URL}/api/auth/me`);
    if (!response.ok) {
        throw new Error('获取用户信息失败');
    }
    return response.json();
}
