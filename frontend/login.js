// Tab switching
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('text-blue-600', 'border-blue-600');
    loginTab.classList.remove('text-gray-500', 'border-transparent');
    registerTab.classList.remove('text-blue-600', 'border-blue-600');
    registerTab.classList.add('text-gray-500', 'border-transparent');

    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('text-blue-600', 'border-blue-600');
    registerTab.classList.remove('text-gray-500', 'border-transparent');
    loginTab.classList.remove('text-blue-600', 'border-blue-600');
    loginTab.classList.add('text-gray-500', 'border-transparent');

    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// Show error message
function showError(message) {
    // Translate common error messages
    const errorTranslations = {
        'Incorrect password': '密码错误',
        'Invalid password': '密码无效',
        'Wrong password': '密码错误',
        'User not found': '用户不存在',
        'Invalid credentials': '用户名或密码错误',
        'Incorrect username or password': '用户名或密码错误',
        'Username already exists': '用户名已存在',
        'Unauthorized': '未授权，请重新登录',
        'Could not validate credentials': '用户名或密码错误',
        'Login failed': '登录失败',
        'Registration failed': '注册失败',
        'Network error': '网络错误'
    };

    const translatedMessage = errorTranslations[message] || message;
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = translatedMessage;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 5000);
}

// Handle login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('token', result.access_token);
            localStorage.setItem('username', data.username);
            window.location.href = 'dashboard.html';
        } else {
            const error = await response.json();
            showError(error.detail || '登录失败');
        }
    } catch (error) {
        showError('网络错误，请重试。');
    }
});

// Handle registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const password = formData.get('password');
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('两次输入的密码不匹配');
        return;
    }

    const data = {
        username: formData.get('username'),
        password: password
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showSuccess('注册成功！请登录。');

            // Switch to login tab
            loginTab.click();

            // Pre-fill username
            document.getElementById('loginUsername').value = data.username;

            // Clear register form
            registerForm.reset();
        } else {
            const error = await response.json();
            showError(error.detail || '注册失败');
        }
    } catch (error) {
        showError('网络错误，请重试。');
    }
});

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
});
