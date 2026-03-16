// Tab switching
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Initialize theme from localStorage (apply theme but no toggle button)
const savedTheme = localStorage.getItem('theme') || 'default';
document.documentElement.setAttribute('data-theme', savedTheme);

loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');

    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');

    // Re-trigger animation
    loginForm.classList.remove('tab-content');
    void loginForm.offsetWidth; // Trigger reflow
    loginForm.classList.add('tab-content');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');

    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');

    // Re-trigger animation
    registerForm.classList.remove('tab-content');
    void registerForm.offsetWidth; // Trigger reflow
    registerForm.classList.add('tab-content');
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
    const span = errorDiv.querySelector('span');
    span.textContent = translatedMessage;
    errorDiv.classList.add('show');

    // Hide success message
    document.getElementById('successMessage').classList.remove('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const span = successDiv.querySelector('span');
    span.textContent = message;
    successDiv.classList.add('show');

    // Hide error message
    document.getElementById('errorMessage').classList.remove('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 5000);
}

// Handle login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = loginForm.querySelector('.submit-button');
    const originalText = submitBtn.querySelector('span').textContent;

    // Add loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('span').textContent = '登录中...';

    // Hide messages
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');

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

            // Success animation
            submitBtn.querySelector('span').textContent = '成功！';

            // Add success pulse animation
            submitBtn.style.animation = 'success-pulse 0.5s ease-out';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            const error = await response.json();
            showError(error.detail || '登录失败');
        }
    } catch (error) {
        showError('网络错误，请重试。');
    } finally {
        // Remove loading state if not redirecting
        if (!submitBtn.querySelector('span').textContent.includes('成功')) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.querySelector('span').textContent = originalText;
        }
    }
});

// Handle registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerForm.querySelector('.submit-button');
    const originalText = submitBtn.querySelector('span').textContent;

    // Add loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('span').textContent = '注册中...';

    // Hide messages
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');

    const formData = new FormData(registerForm);
    const password = formData.get('password');
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('两次输入的密码不匹配');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('span').textContent = originalText;
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

            // Switch to login tab with animation
            setTimeout(() => {
                loginTab.click();

                // Pre-fill username
                document.getElementById('loginUsername').value = data.username;

                // Clear register form
                registerForm.reset();
            }, 1000);
        } else {
            const error = await response.json();
            showError(error.detail || '注册失败');
        }
    } catch (error) {
        showError('网络错误，请重试。');
    } finally {
        // Remove loading state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('span').textContent = originalText;
    }
});

// Add input focus animations
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Add fade out animation
        document.body.style.animation = 'fade-out 0.3s ease-out forwards';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 300);
    }
});
