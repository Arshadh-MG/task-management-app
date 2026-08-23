document.addEventListener('DOMContentLoaded', () => {
    // --- USER SESSION CHECK ---
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
        window.location.href = './index.html';
        return;
    }

    const currentUser = JSON.parse(userJson);
    const userId = currentUser.userId;

    // --- DOM ELEMENTS SELECTION ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = themeToggleBtn?.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn?.querySelector('.moon-icon');

    const profileAvatarCircle = document.getElementById('profileAvatarCircle');
    const profileForm = document.getElementById('profileForm');
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const roleInput = document.getElementById('profileRole');
    const memberSinceText = document.getElementById('memberSinceText');
    
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    
    const backToCalendarBtn = document.getElementById('backToCalendarBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    const alertBox = document.getElementById('alertBox');
    const alertMessage = alertBox?.querySelector('.alert-message');
    const alertIcon = alertBox?.querySelector('.alert-icon');

    // --- STATE MANAGER ---
    const state = {
        theme: localStorage.getItem('lms_portal_theme') || 'dark',
        submitting: false
    };

    // --- INITIALIZATION ---
    applyTheme(state.theme);
    setupPasswordToggles();
    fetchProfileDetails();

    // --- THEME MANAGEMENT ---
    themeToggleBtn?.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('lms_portal_theme', state.theme);
        applyTheme(state.theme);
    });

    function applyTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-theme');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            body.classList.remove('light-theme');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }

    // --- BACK NAVIGATION ---
    backToCalendarBtn.addEventListener('click', () => {
        window.location.href = './calendar.html';
    });

    // --- PASSWORD VISIBILITY TOGGLE ---
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const input = btn.previousElementSibling;
                const eyeOpen = btn.querySelector('.eye-open');
                const eyeClosed = btn.querySelector('.eye-closed');

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.classList.add('hidden');
                    eyeClosed.classList.remove('hidden');
                } else {
                    input.type = 'password';
                    eyeOpen.classList.remove('hidden');
                    eyeClosed.classList.add('hidden');
                }
            });
        });
    }

    // --- ALERT NOTIFICATIONS ---
    function showAlert(type, message) {
        if (!alertBox) return;
        alertBox.className = `alert-container ${type}`;
        alertMessage.textContent = message;
        
        if (type === 'success') {
            alertIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
        } else {
            alertIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        }
        
        alertBox.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearAlerts() {
        if (!alertBox) return;
        alertBox.classList.add('hidden');
        alertBox.className = 'alert-container hidden';
        alertMessage.textContent = '';
        alertIcon.innerHTML = '';
    }

    function clearValidationMessages() {
        const errorSpans = document.querySelectorAll('.validation-message');
        errorSpans.forEach(span => span.textContent = '');
    }

    // --- FETCH PROFILE DETAILS ---
    function fetchProfileDetails() {
        fetch(`/api/profile?userId=${userId}`)
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to retrieve profile details.');
                return result;
            })
            .then(user => {
                nameInput.value = user.full_name;
                emailInput.value = user.email;
                roleInput.value = user.role;
                
                // Set Avatar Circle Letter
                profileAvatarCircle.textContent = user.full_name.charAt(0).toUpperCase();

                // Format Member Since date
                const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = new Date(user.created_at).toLocaleDateString('en-US', dateOptions);
                memberSinceText.textContent = formattedDate;
            })
            .catch(error => {
                showAlert('danger', error.message);
            });
    }

    // --- FORM SUBMIT (UPDATE PROFILE) ---
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (state.submitting) return;

        clearAlerts();
        clearValidationMessages();

        const fullName = nameInput.value.trim();
        const role = roleInput.value.trim();
        const password = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;

        // Validations
        let hasError = false;

        if (!fullName) {
            document.getElementById('profileNameError').textContent = 'Full name is required';
            hasError = true;
        } else if (fullName.length < 2) {
            document.getElementById('profileNameError').textContent = 'Full name must be at least 2 characters';
            hasError = true;
        }

        if (!role) {
            document.getElementById('profileRoleError').textContent = 'Account role is required';
            hasError = true;
        }

        if (password) {
            if (password.length < 4) {
                document.getElementById('newPasswordError').textContent = 'Password must be at least 4 characters';
                hasError = true;
            }
            if (password !== confirmPassword) {
                document.getElementById('confirmNewPasswordError').textContent = 'Passwords do not match';
                hasError = true;
            }
        }

        if (hasError) {
            // Focus on first input with error
            if (!fullName || fullName.length < 2) nameInput.focus();
            else if (!role) roleInput.focus();
            else if (password.length < 4) newPasswordInput.focus();
            else confirmNewPasswordInput.focus();
            return;
        }

        // Post updates to backend
        toggleSubmitState(true);

        const updateData = {
            userId,
            fullName,
            role
        };

        if (password) {
            updateData.password = password;
        }

        fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to update user profile.');
                return result;
            })
            .then(result => {
                showAlert('success', 'Profile updated successfully! Returning to calendar...');
                
                // Synchronize LocalStorage cache
                currentUser.fullName = fullName;
                currentUser.role = role;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Update avatar letter and input fields immediately
                profileAvatarCircle.textContent = fullName.charAt(0).toUpperCase();
                newPasswordInput.value = '';
                confirmNewPasswordInput.value = '';

                // Redirect to calendar dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = './calendar.html';
                }, 1500);
            })
            .catch(error => {
                showAlert('danger', error.message);
            })
            .finally(() => {
                toggleSubmitState(false);
            });
    });

    function toggleSubmitState(isSubmitting) {
        state.submitting = isSubmitting;
        const loader = saveProfileBtn.querySelector('.loader');
        const text = saveProfileBtn.querySelector('.btn-text');

        const inputs = profileForm.querySelectorAll('input, button');
        inputs.forEach(el => {
            if (el.id !== 'saveProfileBtn') el.disabled = isSubmitting;
        });

        // Keep email field disabled
        emailInput.disabled = true;

        if (isSubmitting) {
            saveProfileBtn.disabled = true;
            loader.classList.remove('hidden');
            text.style.opacity = '0.5';
        } else {
            saveProfileBtn.disabled = false;
            loader.classList.add('hidden');
            text.style.opacity = '1';
        }
    }
});
