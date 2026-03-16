// Track password verification mode
let pendingEditMode = null;

// DOM Elements (will be initialized after DOM loads)
let usernameDisplay, logoutBtn, addSecretBtn, addSecretForm, addSecretModal, closeAddModal, cancelAdd;
let secretsList, emptyState, errorMessage, successMessage, addSecretError;
let editSecretFormContainer, editSecretForm, cancelEdit;
let viewModal, closeViewModal, viewModalTitle, viewModalContent;
let passwordModal, closePasswordModal, passwordVerifyForm, passwordError;
let themeToggle, themeIcon;

// Show error message
function showError(message) {
    // Translate common error messages
    const errorTranslations = {
        'Incorrect password': '密码错误',
        'Invalid password': '密码无效',
        'Wrong password': '密码错误',
        'Incorrect username or password': '用户名或密码错误',
        'Secret not found': '密钥不存在',
        'User not found': '用户不存在',
        'Invalid credentials': '用户名或密码错误',
        'Username already exists': '用户名已存在',
        'Unauthorized': '未授权，请重新登录',
        'Failed to fetch secrets': '获取密钥失败',
        'Failed to create secret': '创建密钥失败',
        'Failed to reveal secret': '查看密钥失败',
        'Failed to update secret': '更新密钥失败',
        'Failed to delete secret': '删除密钥失败',
        'Network error': '网络错误',
        'Connection refused': '连接被拒绝',
        'Server error': '服务器错误'
    };

    const translatedMessage = errorTranslations[message] || message;
    const span = errorMessage.querySelector('span');
    span.textContent = translatedMessage;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const span = successMessage.querySelector('span');
    span.textContent = message;
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
}

// Translate error messages
function translateError(message) {
    const errorTranslations = {
        'Incorrect password': '密码错误',
        'Invalid password': '密码无效',
        'Wrong password': '密码错误'
    };
    return errorTranslations[message] || message;
}

// Format date (convert UTC to Shanghai timezone UTC+8)
function formatDate(dateString) {
    const date = new Date(dateString);
    // Get UTC timestamp
    const utcTimestamp = date.getTime();
    // Add 8 hours for Shanghai timezone (UTC+8)
    const shanghaiTimestamp = utcTimestamp + (8 * 60 * 60 * 1000);
    const shanghaiDate = new Date(shanghaiTimestamp);

    const year = shanghaiDate.getFullYear();
    const month = String(shanghaiDate.getMonth() + 1).padStart(2, '0');
    const day = String(shanghaiDate.getDate()).padStart(2, '0');
    const hours = String(shanghaiDate.getHours()).padStart(2, '0');
    const minutes = String(shanghaiDate.getMinutes()).padStart(2, '0');
    const seconds = String(shanghaiDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load secrets
async function loadSecrets() {
    try {
        const secrets = await getSecrets();

        if (secrets.length === 0) {
            secretsList.closest('.table-wrapper').classList.add('hidden');
            emptyState.classList.add('show');
        } else {
            secretsList.closest('.table-wrapper').classList.remove('hidden');
            emptyState.classList.remove('show');

            secretsList.innerHTML = secrets.map((secret, index) => `
                <tr class="table-row-appear" style="animation-delay: ${index * 0.05}s">
                    <td>${escapeHtml(secret.name)}</td>
                    <td><span class="table-note">${secret.note ? escapeHtml(secret.note) : '-'}</span></td>
                    <td><span class="table-date">${formatDate(secret.created_at)}</span></td>
                    <td>
                        <div class="table-actions">
                            <button onclick="viewSecret(${secret.id})" class="btn-action btn-view">查看</button>
                            <button onclick="openEditRow(${secret.id})" class="btn-action btn-edit">编辑</button>
                            <button onclick="deleteSecretConfirm(${secret.id})" class="btn-action btn-delete">删除</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showError(error.message);
    }
}

// View secret (global function for onclick)
function viewSecret(id) {
    pendingEditMode = null;
    document.getElementById('verifySecretId').value = id;
    passwordError.classList.remove('show');
    document.getElementById('verifyPassword').value = '';
    passwordModal.classList.add('show');
    document.getElementById('verifyPassword').focus();
}

// Open edit row (global function for onclick)
function openEditRow(id) {
    pendingEditMode = id;
    document.getElementById('verifySecretId').value = id;
    passwordError.classList.remove('show');
    document.getElementById('verifyPassword').value = '';
    passwordModal.classList.add('show');
    editSecretFormContainer.classList.remove('show');
    document.getElementById('verifyPassword').focus();
}

// Delete secret confirmation (global function for onclick)
function deleteSecretConfirm(id) {
    if (confirm('确定要删除这个密钥吗？')) {
        // Add fade-out animation to the row
        const rows = document.querySelectorAll('#secretsList tr');
        rows.forEach(row => {
            const deleteBtn = row.querySelector('.btn-delete');
            if (deleteBtn && deleteBtn.onclick.toString().includes(id)) {
                row.style.transition = 'all 0.3s ease-out';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';
            }
        });

        // Wait for animation to complete before deleting
        setTimeout(() => {
            deleteSecretHandler(id);
        }, 300);
    }
}

// Delete secret
async function deleteSecretHandler(id) {
    try {
        await deleteSecret(id);
        showSuccess('密钥删除成功');
        // Close any open forms/modals
        addSecretModal.classList.remove('show');
        editSecretFormContainer.classList.remove('show');
        addSecretForm.reset();
        editSecretForm.reset();
        document.getElementById('editSecretId').value = '';
        loadSecrets();
    } catch (error) {
        showError(error.message);
    }
}

// Theme management
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    if (theme === 'light') {
        // Moon icon for light theme
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
    } else {
        // Sun icon for default theme
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    const newTheme = currentTheme === 'light' ? 'default' : 'light';
    setTheme(newTheme);
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    usernameDisplay = document.getElementById('usernameDisplay');
    logoutBtn = document.getElementById('logoutBtn');
    addSecretBtn = document.getElementById('addSecretBtn');
    addSecretForm = document.getElementById('addSecretForm');
    addSecretModal = document.getElementById('addSecretModal');
    closeAddModal = document.getElementById('closeAddModal');
    cancelAdd = document.getElementById('cancelAdd');
    secretsList = document.getElementById('secretsList');
    emptyState = document.getElementById('emptyState');
    errorMessage = document.getElementById('errorMessage');
    successMessage = document.getElementById('successMessage');
    addSecretError = document.getElementById('addSecretError');
    editSecretFormContainer = document.getElementById('editSecretFormContainer');
    editSecretForm = document.getElementById('editSecretForm');
    cancelEdit = document.getElementById('cancelEdit');
    viewModal = document.getElementById('viewModal');
    closeViewModal = document.getElementById('closeViewModal');
    viewModalTitle = document.getElementById('viewModalTitle');
    viewModalContent = document.getElementById('viewModalContent');
    passwordModal = document.getElementById('passwordModal');
    closePasswordModal = document.getElementById('closePasswordModal');
    passwordVerifyForm = document.getElementById('passwordVerifyForm');
    passwordError = document.getElementById('passwordError');
    themeToggle = document.getElementById('themeToggle');
    themeIcon = document.getElementById('themeIcon');

    // Initialize theme
    let savedTheme = localStorage.getItem('theme') || 'default';
    // Migrate old 'midnight' theme to 'light'
    if (savedTheme === 'midnight') {
        savedTheme = 'light';
        localStorage.setItem('theme', savedTheme);
    }
    setTheme(savedTheme);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Show add secret modal
    addSecretBtn.addEventListener('click', () => {
        addSecretError.classList.remove('show');
        addSecretModal.classList.add('show');
        document.getElementById('secretName').focus();
        document.getElementById('secretName').value = '';
        document.getElementById('secretContent').value = '';
        document.getElementById('secretNote').value = '';
        document.getElementById('secretPassword').value = '';
    });

    // Close add secret modal
    closeAddModal.addEventListener('click', () => {
        addSecretModal.classList.remove('show');
        addSecretForm.reset();
        addSecretError.classList.remove('show');
    });

    // Hide add secret modal
    cancelAdd.addEventListener('click', () => {
        addSecretModal.classList.remove('show');
        addSecretForm.reset();
        addSecretError.classList.remove('show');
    });

    // Hide edit form
    cancelEdit.addEventListener('click', () => {
        editSecretFormContainer.classList.remove('show');
        editSecretForm.reset();
        document.getElementById('editSecretId').value = '';
        pendingEditMode = null;
    });

    // Handle password verification
    passwordVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = passwordVerifyForm.querySelector('.btn-submit-full');
        const originalText = submitBtn.textContent;

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = '';

        const secretId = document.getElementById('verifySecretId').value;
        const password = document.getElementById('verifyPassword').value;

        // Clear previous error
        passwordError.classList.remove('show');

        try {
            const secret = await revealSecret(secretId, password);

            if (pendingEditMode === parseInt(secretId)) {
                // Populate edit form with decrypted data
                document.getElementById('editSecretId').value = secretId;
                document.getElementById('editSecretName').value = secret.name;
                document.getElementById('editSecretContent').value = secret.content;
                document.getElementById('editSecretNote').value = secret.note || '';
                document.getElementById('editSecretPassword').value = password;

                passwordModal.classList.remove('show');
                editSecretFormContainer.classList.add('show');
                pendingEditMode = null;
            } else {
                viewModalTitle.textContent = secret.name;

                let contentHtml = `
                    <div class="secret-copy-hint" id="copyHint">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>密钥已复制到剪贴板</span>
                    </div>
                    <div class="secret-field">
                        <div class="secret-label">密钥内容</div>
                        <div class="secret-content">${escapeHtml(secret.content)}</div>
                    </div>
                `;

                if (secret.note) {
                    contentHtml += `
                        <div class="secret-field">
                            <div class="secret-label">备注</div>
                            <div class="secret-content">${escapeHtml(secret.note)}</div>
                        </div>
                    `;
                }

                contentHtml += `
                    <div class="secret-meta">创建时间：${formatDate(secret.created_at)}</div>
                `;

                viewModalContent.innerHTML = contentHtml;

                // Copy secret content to clipboard
                navigator.clipboard.writeText(secret.content).catch(err => {
                    console.error('Failed to copy:', err);
                    // Hide copy hint if copy failed
                    const copyHint = document.getElementById('copyHint');
                    if (copyHint) copyHint.style.display = 'none';
                });

                passwordModal.classList.remove('show');
                viewModal.classList.add('show');
                document.getElementById('verifyPassword').value = '';
            }

        } catch (error) {
            // Translate error message
            const errorTranslations = {
                'Incorrect password': '密码错误',
                'Invalid password': '密码无效',
                'Wrong password': '密码错误'
            };

            const translatedMessage = errorTranslations[error.message] || error.message;

            // Show error in the modal
            const span = passwordError.querySelector('span');
            span.textContent = translatedMessage;
            passwordError.classList.add('show');

            // Shake animation replay
            passwordError.style.animation = 'none';
            setTimeout(() => {
                passwordError.style.animation = 'shake 0.3s ease-out';
            }, 10);

            // Clear password field and focus
            document.getElementById('verifyPassword').value = '';
            document.getElementById('verifyPassword').focus();
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    });

    // Handle edit form submission
    editSecretForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = editSecretForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = '';

        const id = document.getElementById('editSecretId').value;
        const data = {
            name: document.getElementById('editSecretName').value,
            content: document.getElementById('editSecretContent').value,
            note: document.getElementById('editSecretNote').value || null,
            password: document.getElementById('editSecretPassword').value
        };

        try {
            await updateSecret(id, data);
            showSuccess('密钥更新成功');
            editSecretFormContainer.classList.remove('show');
            editSecretForm.reset();
            document.getElementById('editSecretId').value = '';
            loadSecrets();
        } catch (error) {
            showError(error.message);
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    });

    // Add secret form submission
    addSecretForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = addSecretForm.querySelector('.btn-submit-full');
        const originalText = submitBtn.textContent;

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = '';

        const data = {
            name: document.getElementById('secretName').value,
            content: document.getElementById('secretContent').value,
            note: document.getElementById('secretNote').value || null,
            password: document.getElementById('secretPassword').value
        };

        try {
            await createSecret(data);
            showSuccess('密钥添加成功');
            addSecretError.classList.remove('show');
            addSecretModal.classList.remove('show');
            addSecretForm.reset();
            loadSecrets();
        } catch (error) {
            // Show error in the modal
            const translatedError = translateError(error.message);
            const span = addSecretError.querySelector('span');
            span.textContent = translatedError;
            addSecretError.classList.add('show');

            // Shake animation
            addSecretError.style.animation = 'none';
            setTimeout(() => {
                addSecretError.style.animation = 'shake 0.3s ease-out';
            }, 10);
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    });

    // Modal close handlers
    closeViewModal.addEventListener('click', () => {
        viewModal.classList.remove('show');
    });

    closePasswordModal.addEventListener('click', () => {
        passwordModal.classList.remove('show');
        passwordError.classList.remove('show');
        document.getElementById('verifyPassword').value = '';
        pendingEditMode = null;
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) {
            viewModal.classList.remove('show');
        }
        if (e.target === passwordModal) {
            passwordModal.classList.remove('show');
            passwordError.classList.remove('show');
            document.getElementById('verifyPassword').value = '';
            pendingEditMode = null;
        }
        if (e.target === addSecretModal) {
            addSecretModal.classList.remove('show');
            addSecretForm.reset();
            addSecretError.classList.remove('show');
        }
    });

    // Initialize on page load
    window.addEventListener('load', async () => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        usernameDisplay.textContent = username;

        try {
            await loadSecrets();
        } catch (error) {
            if (error.message === 'Unauthorized') {
                return;
            }
            showError(error.message);
        }
    });
});
