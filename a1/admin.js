document.addEventListener('DOMContentLoaded', () => {
    // --- SESSION CHECK ---
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    const userJson = localStorage.getItem('user') || localStorage.getItem('admin_user');

    if (!token || !userJson) {
        window.location.href = './index.html';
        return;
    }

    const currentAdmin = JSON.parse(userJson);
    const isAdmin = currentAdmin.email === 'admin123@gmail.com' || (currentAdmin.role && currentAdmin.role.toLowerCase().includes('admin'));

    if (!isAdmin) {
        window.location.href = './calendar.html';
        return;
    }

    // --- DOM REFERENCES ---
    const adminNameEl = document.getElementById('adminName');
    const adminEmailDisplay = document.getElementById('adminEmailDisplay');
    const adminAvatarEl = document.getElementById('adminAvatar');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = themeToggleBtn?.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn?.querySelector('.moon-icon');

    // Stat Cards
    const statCardUsers = document.getElementById('statCardUsers');
    const statCardCompleted = document.getElementById('statCardCompleted');
    const statCardProgress = document.getElementById('statCardProgress');

    const statUsersCount = document.getElementById('statUsersCount');
    const statCompletedCount = document.getElementById('statCompletedCount');
    const statProgressCount = document.getElementById('statProgressCount');

    // Drilldown views
    const drilldownTitle = document.getElementById('drilldownTitle');
    const drilldownSubtitle = document.getElementById('drilldownSubtitle');
    const drilldownSearchInput = document.getElementById('drilldownSearchInput');

    const usersViewContainer = document.getElementById('usersViewContainer');
    const tasksViewContainer = document.getElementById('tasksViewContainer');
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');
    const adminTasksList = document.getElementById('adminTasksList');

    // Lightbox
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxContentWrapper = document.getElementById('lightboxContentWrapper');
    const lightboxCounter = document.getElementById('lightboxCounter');

    // --- STATE ---
    const state = {
        theme: localStorage.getItem('lms_portal_theme') || 'dark',
        users: [],
        events: [],
        activeTab: 'users', // 'users' | 'completed' | 'progress'
        searchQuery: ''
    };

    // --- INITIALIZE UI ---
    applyTheme(state.theme);
    adminNameEl.textContent = currentAdmin.fullName || 'Admin';
    adminEmailDisplay.textContent = currentAdmin.email || 'admin123@gmail.com';
    adminAvatarEl.textContent = (currentAdmin.fullName || 'A').charAt(0).toUpperCase();
    const adminRoleBadge = document.getElementById('adminRoleBadge');
    if (adminRoleBadge) adminRoleBadge.textContent = currentAdmin.role || 'Admin';


    // Theme Toggle
    themeToggleBtn?.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('lms_portal_theme', state.theme);
        applyTheme(state.theme);
    });

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            document.body.classList.remove('light-theme');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }

    // Logout
    adminLogoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = './index.html';
    });

    // --- FETCH DATA ---
    async function loadDashboardData() {
        try {
            const [usersRes, eventsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/events')
            ]);

            state.users = await usersRes.json();
            state.events = await eventsRes.json();

            updateMetrics();
            renderActiveTab();
        } catch (err) {
            console.error('Error loading admin dashboard data:', err);
        }
    }

    function updateMetrics() {
        statUsersCount.textContent = state.users.length;

        const completedEvents = state.events.filter(e => e.status === 'completed');
        const progressEvents = state.events.filter(e => e.status === 'progress');

        statCompletedCount.textContent = completedEvents.length;
        statProgressCount.textContent = progressEvents.length;
    }

    // --- TAB SWITCHING ---
    function setActiveTab(tab) {
        state.activeTab = tab;

        // Update card borders
        [statCardUsers, statCardCompleted, statCardProgress].forEach(c => {
            c.style.borderColor = 'var(--border)';
            const indicator = c.querySelector('.card-indicator');
            if (indicator) {
                indicator.style.color = 'var(--muted)';
                indicator.textContent = 'Click to View →';
            }
        });

        if (tab === 'users') {
            statCardUsers.style.borderColor = 'var(--accent)';
            const ind = statCardUsers.querySelector('.card-indicator');
            if (ind) { ind.style.color = 'var(--accent)'; ind.textContent = 'Viewing List →'; }
            
            drilldownTitle.textContent = 'User Management Directory';
            drilldownSubtitle.textContent = 'Manage registered users and purge removed accounts';
            usersViewContainer.classList.remove('hidden');
            tasksViewContainer.classList.add('hidden');
        } else if (tab === 'completed') {
            statCardCompleted.style.borderColor = 'var(--success)';
            const ind = statCardCompleted.querySelector('.card-indicator');
            if (ind) { ind.style.color = 'var(--success)'; ind.textContent = 'Viewing List →'; }

            drilldownTitle.textContent = 'Completed Updates Overview';
            drilldownSubtitle.textContent = 'List of all tasks and updates marked as Completed';
            usersViewContainer.classList.add('hidden');
            tasksViewContainer.classList.remove('hidden');
        } else if (tab === 'progress') {
            statCardProgress.style.borderColor = '#F59E0B';
            const ind = statCardProgress.querySelector('.card-indicator');
            if (ind) { ind.style.color = '#F59E0B'; ind.textContent = 'Viewing List →'; }

            drilldownTitle.textContent = 'In-Progress Tasks Overview';
            drilldownSubtitle.textContent = 'Active updates currently in progress across workspace';
            usersViewContainer.classList.add('hidden');
            tasksViewContainer.classList.remove('hidden');
        }

        renderActiveTab();
    }

    statCardUsers.addEventListener('click', () => setActiveTab('users'));
    statCardCompleted.addEventListener('click', () => setActiveTab('completed'));
    statCardProgress.addEventListener('click', () => setActiveTab('progress'));

    // Search input filtering
    drilldownSearchInput?.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderActiveTab();
    });

    // --- RENDER DRILLDOWN VIEWS ---
    function renderActiveTab() {
        if (state.activeTab === 'users') {
            renderUsersTable();
        } else {
            renderTasksList();
        }
    }

    function renderUsersTable() {
        adminUsersTableBody.innerHTML = '';
        const filteredUsers = state.users.filter(u => {
            if (!state.searchQuery) return true;
            return (u.full_name && u.full_name.toLowerCase().includes(state.searchQuery)) ||
                   (u.email && u.email.toLowerCase().includes(state.searchQuery)) ||
                   (u.role && u.role.toLowerCase().includes(state.searchQuery));
        });

        if (filteredUsers.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align: center; padding: 2rem; color: var(--muted);">No users found.</td>`;
            adminUsersTableBody.appendChild(tr);
            return;
        }

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            tr.style.transition = 'background var(--ease)';

            const isCurrentAdmin = user.id === currentAdmin.userId;
            const initial = (user.full_name || 'U').charAt(0).toUpperCase();

            tr.innerHTML = `
                <td style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="user-avatar-sm" style="width: 34px; height: 34px; font-size: 0.85rem;">${initial}</div>
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${user.full_name} ${isCurrentAdmin ? '<span style="color: var(--accent); font-size: 0.75rem;">(You)</span>' : ''}</div>
                            <div style="font-size: 0.75rem; color: var(--faint);">User ID: #${user.id}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 1rem; color: var(--muted);">${user.email}</td>
                <td style="padding: 1rem;">
                    <span class="day-update-token" style="background: rgba(96, 165, 250, 0.1); color: var(--accent); font-size: 0.75rem;">${user.role || 'Member'}</span>
                </td>
                <td style="padding: 1rem; text-align: right;">
                    ${!isCurrentAdmin ? `
                        <button class="btn-delete-user" data-id="${user.id}" data-name="${user.full_name}" style="background: var(--danger-bg); border: 1px solid var(--danger); color: var(--danger); border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background var(--ease), color var(--ease);">
                            Remove User
                        </button>
                    ` : '<span style="font-size: 0.78rem; color: var(--faint);">Current Admin</span>'}
                </td>
            `;

            adminUsersTableBody.appendChild(tr);
        });

        // Wire delete buttons — no confirm dialog, immediate delete
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                removeUserImmediate(userId);
            });
        });
    }

    async function removeUserImmediate(userId) {
        try {
            const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove user.');
            await loadDashboardData();
        } catch (err) {
            console.error('Remove user error:', err.message);
        }
    }

    function renderTasksList() {
        adminTasksList.innerHTML = '';
        const targetStatus = state.activeTab === 'completed' ? 'completed' : 'progress';

        const filteredTasks = state.events
            .filter(e => e.status === targetStatus)
            .filter(e => {
                if (!state.searchQuery) return true;
                return (e.title && e.title.toLowerCase().includes(state.searchQuery)) ||
                       (e.description && e.description.toLowerCase().includes(state.searchQuery)) ||
                       (e.token_id && e.token_id.toLowerCase().includes(state.searchQuery));
            })
            .sort((a, b) => {
                if (a.event_date !== b.event_date) return b.event_date.localeCompare(a.event_date);
                return (b.id || 0) - (a.id || 0);
            });

        if (filteredTasks.length === 0) {
            const li = document.createElement('li');
            li.style.padding = '2rem';
            li.style.textAlign = 'center';
            li.style.color = 'var(--muted)';
            li.textContent = `No ${targetStatus === 'completed' ? 'completed' : 'in-progress'} tasks found.`;
            adminTasksList.appendChild(li);
            return;
        }

        filteredTasks.forEach(evt => {
            const li = document.createElement('li');
            li.className = 'day-update-card';

            const statusClass = evt.status === 'completed' ? 'status-badge-completed' : 'status-badge-progress';
            const statusText = evt.status === 'completed' ? 'Completed' : 'In Progress';

            // Find assignee
            let assigneeHtml = '<span class="day-update-assignee">Unassigned</span>';
            if (evt.member_id) {
                const assignedUser = state.users.find(u => u.id === evt.member_id);
                if (assignedUser) {
                    const initial = assignedUser.full_name.charAt(0).toUpperCase();
                    assigneeHtml = `
                        <div class="day-update-assignee" style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="user-avatar-sm" style="width: 24px; height: 24px; font-size: 0.7rem; margin: 0;">${initial}</div>
                            <span>Assigned to: ${assignedUser.full_name}</span>
                        </div>
                    `;
                }
            }

            // Parse images if any
            let imageList = [];
            if (evt.images) {
                try {
                    imageList = JSON.parse(evt.images);
                } catch(e) {
                    console.error('Failed to parse images:', e);
                }
            }

            let imagesHtml = '';
            if (Array.isArray(imageList) && imageList.length > 0) {
                imagesHtml = '<div class="day-update-thumbnails">';
                imageList.forEach((img, idx) => {
                    imagesHtml += `<img src="${img}" class="day-update-thumb" data-index="${idx}">`;
                });
                imagesHtml += '</div>';
            }

            const formattedDate = new Date(evt.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            li.innerHTML = `
                <div class="day-update-header">
                    <span class="day-update-token">${evt.token_id || 'No Token'}</span>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 0.78rem; color: var(--faint);">Date: ${formattedDate}</span>
                        <span class="day-update-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="day-update-subject">${evt.title}</div>
                <div class="day-update-content">${evt.description || 'No content details provided.'}</div>
                ${imagesHtml}
                <div class="day-update-footer">
                    ${assigneeHtml}
                </div>
            `;

            // Thumbnail lightbox trigger
            li.querySelectorAll('.day-update-thumb').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(thumb.getAttribute('data-index'));
                    openLightbox(imageList, index);
                });
            });

            adminTasksList.appendChild(li);
        });
    }

    // --- LIGHTBOX ---
    let lightboxImages = [];
    let currentLightboxIndex = 0;

    function openLightbox(images, startIndex = 0) {
        lightboxImages = images;
        currentLightboxIndex = startIndex;

        lightboxContentWrapper.innerHTML = '';
        images.forEach(imgSrc => {
            const slide = document.createElement('div');
            slide.className = 'lightbox-slide';
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'lightbox-img';
            img.draggable = false;
            slide.appendChild(img);
            lightboxContentWrapper.appendChild(slide);
        });

        lightboxOverlay.classList.add('active');
        updateLightboxCounter();

        setTimeout(() => {
            const slideWidth = lightboxContentWrapper.clientWidth;
            lightboxContentWrapper.scrollLeft = startIndex * slideWidth;
        }, 50);
    }

    function closeLightbox() {
        lightboxOverlay.classList.remove('active');
    }

    function updateLightboxCounter() {
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    }

    let scrollTimeout;
    lightboxContentWrapper?.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const slideWidth = lightboxContentWrapper.clientWidth;
            if (slideWidth > 0) {
                const newIndex = Math.round(lightboxContentWrapper.scrollLeft / slideWidth);
                if (newIndex !== currentLightboxIndex && newIndex >= 0 && newIndex < lightboxImages.length) {
                    currentLightboxIndex = newIndex;
                    updateLightboxCounter();
                }
            }
        }, 80);
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            const slideWidth = lightboxContentWrapper.clientWidth;
            lightboxContentWrapper.scrollTo({ left: currentLightboxIndex * slideWidth, behavior: 'smooth' });
            updateLightboxCounter();
        }
    });

    lightboxNext?.addEventListener('click', () => {
        if (currentLightboxIndex < lightboxImages.length - 1) {
            currentLightboxIndex++;
            const slideWidth = lightboxContentWrapper.clientWidth;
            lightboxContentWrapper.scrollTo({ left: currentLightboxIndex * slideWidth, behavior: 'smooth' });
            updateLightboxCounter();
        }
    });

    lightboxContentWrapper?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget || e.target.classList.contains('lightbox-slide')) {
            closeLightbox();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!lightboxOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') lightboxPrev.click();
        else if (e.key === 'ArrowRight') lightboxNext.click();
    });

    // Initial Load
    loadDashboardData();
});
