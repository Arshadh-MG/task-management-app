document.addEventListener('DOMContentLoaded', () => {
    // --- USER SESSION CHECK ---
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
        // Redirect to login if not authenticated
        window.location.href = './index.html';
        return;
    }

    const currentUser = JSON.parse(userJson);

    // Show Admin Portal button ONLY if user is admin123@gmail.com or Administrator
    const adminPortalBtn = document.getElementById('adminPortalBtn');
    const isAdmin = currentUser.email === 'admin123@gmail.com' || (currentUser.role && currentUser.role.toLowerCase().includes('admin'));
    if (adminPortalBtn) {
        adminPortalBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // --- DOM ELEMENTS ---
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = themeToggleBtn?.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn?.querySelector('.moon-icon');

    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const toggleOnlineUsersBtn = document.getElementById('toggleOnlineUsersBtn');
    const onlineUsersChevron = document.getElementById('onlineUsersChevron');
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    const onlineUsersList = document.getElementById('onlineUsersList');
    const noUpcomingText = document.getElementById('noUpcomingText');

    // Filters
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Event Modal
    const eventModalOverlay = document.getElementById('eventModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const eventForm = document.getElementById('eventForm');
    const eventIdInput = document.getElementById('eventId');
    const eventTokenIdInput = document.getElementById('eventTokenId');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventMemberIdSelect = document.getElementById('eventMemberId');
    const eventStatusSelect = document.getElementById('eventStatus');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const saveEventBtn = document.getElementById('saveEventBtn');

    // Day Updates Full Page View Containers
    const calendarViewContainer = document.getElementById('calendarViewContainer');
    const dayViewContainer = document.getElementById('dayViewContainer');
    const backToCalendarBtn = document.getElementById('backToCalendarBtn');
    const dayUpdatesTitle = document.getElementById('dayUpdatesTitle');
    const addUpdateBtn = document.getElementById('addUpdateBtn');
    const dayUpdatesList = document.getElementById('dayUpdatesList');

    // Read-only Details elements
    const eventDetailsView = document.getElementById('eventDetailsView');
    const detailsTokenId = document.getElementById('detailsTokenId');
    const detailsSubject = document.getElementById('detailsSubject');
    const detailsContent = document.getElementById('detailsContent');
    const detailsAssignee = document.getElementById('detailsAssignee');
    const detailsStatus = document.getElementById('detailsStatus');
    const detailsImagesGroup = document.getElementById('detailsImagesGroup');
    const detailsImagesList = document.getElementById('detailsImagesList');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    // Upload Elements
    const imageUploadZone = document.getElementById('imageUploadZone');
    const attachedImagesPreview = document.getElementById('attachedImagesPreview');
    const imageFileInput = document.getElementById('imageFileInput');

    // Lightbox elements
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxContentWrapper = document.getElementById('lightboxContentWrapper');
    const lightboxCounter = document.getElementById('lightboxCounter');

    // --- STATE MANAGER ---
    const state = {
        theme: localStorage.getItem('lms_portal_theme') || 'dark',
        currentDate: new Date(), // Active month/year view
        events: [],              // All events loaded from backend
        activeFilter: 'all',     // Active color category filter
        selectedDate: '',        // Stored date for create operation
        users: [],               // Cached list of registered users
        attachedImages: []       // Base64 image strings currently attached to form
    };

    // --- INITIALIZE VIEWS ---
    applyTheme(state.theme);
    userNameEl.textContent = currentUser.fullName;
    userRoleEl.textContent = currentUser.role;
    userAvatarEl.textContent = currentUser.fullName.charAt(0).toUpperCase();

    // Initialize year Select options (10 years back and 10 years forward)
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 10; y <= currentYear + 10; y++) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        }
    }

    // Change listeners for Month and Year Select dropdowns
    monthSelect?.addEventListener('change', () => {
        state.currentDate.setMonth(parseInt(monthSelect.value));
        renderCalendar();
    });

    yearSelect?.addEventListener('change', () => {
        state.currentDate.setFullYear(parseInt(yearSelect.value));
        renderCalendar();
    });

    // Online Users panel collapsible toggle logic
    let onlineUsersCollapsed = true;
    toggleOnlineUsersBtn?.addEventListener('click', () => {
        onlineUsersCollapsed = !onlineUsersCollapsed;
        if (onlineUsersCollapsed) {
            onlineUsersList.style.display = 'none';
            onlineUsersChevron.style.transform = 'rotate(-90deg)';
        } else {
            onlineUsersList.style.display = 'flex';
            onlineUsersChevron.style.transform = 'rotate(0deg)';
        }
    });

    // Fetch initial event list and online users
    fetchEvents();
    fetchOnlineUsers();

    // --- THEME MANAGEMENT ---
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

    // --- LOGOUT HANDLER ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = './index.html';
    });

    // --- PROFILE BUTTON HANDLER ---
    profileBtn?.addEventListener('click', () => {
        window.location.href = './profile.html';
    });

    // --- CALENDAR RENDER LOGIC ---
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function renderCalendar() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();

        // Update Month/Year Select Dropdowns
        if (monthSelect) monthSelect.value = month;
        if (yearSelect) yearSelect.value = year;

        // Clear grid days
        calendarDaysGrid.innerHTML = '';

        // Get first day of the month (0 = Sunday, 1 = Monday...)
        const firstDayIndex = new Date(year, month, 1).getDay();

        // Get total days in current month
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Get total days in previous month
        const prevMonthTotalDays = new Date(year, month, 0).getDate();

        // Padding days from previous month
        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevMonthTotalDays - i + 1;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            const dateStr = formatDateStr(prevMonthDate);
            const dayCell = createDayCell(dayNum, dateStr, false);
            calendarDaysGrid.appendChild(dayCell);
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = formatDateStr(dateObj);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const dayCell = createDayCell(day, dateStr, true, isToday);
            calendarDaysGrid.appendChild(dayCell);
        }

        // Padding days from next month (fill up grid to 42 cells)
        const totalCellsSoFar = firstDayIndex + totalDays;
        const remainingCells = 42 - totalCellsSoFar;
        for (let day = 1; day <= remainingCells; day++) {
            const nextMonthDate = new Date(year, month + 1, day);
            const dateStr = formatDateStr(nextMonthDate);
            const dayCell = createDayCell(day, dateStr, false);
            calendarDaysGrid.appendChild(dayCell);
        }

        updateUpcomingEvents();
    }

    function formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function createDayCell(dayNum, dateStr, isCurrentMonth, isToday = false) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-day');
        if (!isCurrentMonth) cell.classList.add('other-month');
        if (isToday) cell.classList.add('today');

        // Day Cell header markup
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNum;

        dayHeader.appendChild(dayNumberSpan);
        cell.appendChild(dayHeader);

        // Filter events for this day (original on this day OR progress events created on a prior day up to today)
        const todayStr = formatDateStr(new Date());
        const dayEvents = state.events.filter(e => {
            if (e.status === 'completed') {
                return e.event_date === dateStr;
            } else { // progress
                if (e.event_date >= todayStr) {
                    return e.event_date === dateStr;
                } else {
                    return dateStr === todayStr;
                }
            }
        });

        // Add a clean, subtle marker dot if updates exist for this day (no text details)
        if (dayEvents.length > 0 && isToday) {
            const dot = document.createElement('div');
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.borderRadius = '50%';
            dot.style.background = 'var(--accent)';
            dot.style.margin = '6px auto 0 auto';
            cell.appendChild(dot);
        }

        // Grid day cell click handler -> opens Day Updates full page view
        cell.addEventListener('click', () => {
            openDayUpdatesModal(dateStr);
        });

        return cell;
    }

    function formatTime(time24) {
        if (!time24) return '';
        const [hourStr, minStr] = time24.split(':');
        const hour = parseInt(hourStr);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minStr} ${ampm}`;
    }

    // --- NAVIGATION EVENTS ---
    prevMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- CATEGORY FILTERS ---
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.activeFilter = btn.dataset.filter;
            renderCalendar();
        });
    });

    // --- UPCOMING EVENTS SIDEBAR LOGIC ---
    function updateUpcomingEvents() {
        upcomingEventsList.innerHTML = '';
        
        const todayStr = formatDateStr(new Date());
        
        // Filter and sort events (all progress events, newest first)
        const upcoming = state.events
            .filter(e => e.status === 'progress')
            .sort((a, b) => {
                if (a.event_date !== b.event_date) {
                    return b.event_date.localeCompare(a.event_date);
                }
                return (b.id || 0) - (a.id || 0);
            });

        if (upcoming.length === 0) {
            upcomingEventsList.appendChild(noUpcomingText || createNoUpcomingListItem());
            return;
        }

        upcoming.forEach(evt => {
            const li = document.createElement('li');
            li.classList.add('upcoming-item', `cat-${evt.color}`);
            
            const displayDate = new Date(evt.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            const displayTime = evt.start_time ? formatTime(evt.start_time) : 'All Day';

            let assignedName = '';
            if (evt.member_id) {
                const foundUser = state.users.find(u => u.id === evt.member_id);
                if (foundUser) {
                    assignedName = ` (Assigned: ${foundUser.full_name})`;
                }
            }
            const titleDisplay = (evt.token_id ? `[${evt.token_id}] ` : '') + evt.title + assignedName;
            const timeLabel = evt.start_time ? ` @ ${formatTime(evt.start_time)}` : '';
            const statusText = evt.status ? evt.status.charAt(0).toUpperCase() + evt.status.slice(1) : 'Progress';
            const statusClass = evt.status === 'completed' ? 'status-badge-completed' : 'status-badge-progress';
            li.innerHTML = `
                <div class="upcoming-title">${titleDisplay}</div>
                <div class="upcoming-time" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>${displayDate}${timeLabel}</span>
                    </div>
                    <span class="day-update-status ${statusClass}" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; text-transform: capitalize;">${statusText}</span>
                </div>
            `;
            if (evt.subject) {
                li.title = `Subject: ${evt.subject}`;
            }

            li.addEventListener('click', () => {
                openEditEventModal(evt);
            });

            upcomingEventsList.appendChild(li);
        });
    }

    function createNoUpcomingListItem() {
        const li = document.createElement('li');
        li.classList.add('subtitle');
        li.style.paddingLeft = '0.5rem';
        li.id = 'noUpcomingText';
        li.textContent = 'No upcoming events';
        return li;
    }

    // --- MODAL UTILITIES ---
    function openModal() {
        eventModalOverlay.classList.add('active');
    }

    function closeModal() {
        eventModalOverlay.classList.remove('active');
        eventForm.reset();
        eventIdInput.value = '';
        state.attachedImages = [];
        renderAttachedImagesPreviews();
    }

    modalCloseBtn.addEventListener('click', closeModal);
    cancelEventBtn.addEventListener('click', closeModal);
    closeDetailsBtn?.addEventListener('click', closeModal);

    // Close modal by clicking outside
    eventModalOverlay.addEventListener('click', (e) => {
        if (e.target === eventModalOverlay) {
            closeModal();
        }
    });

    // --- FILE UPLOADS & PASTE LOGIC ---
    imageUploadZone?.addEventListener('click', () => imageFileInput.click());

    imageFileInput?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                addAttachedImage(event.target.result);
            };
            reader.readAsDataURL(file);
        });
        imageFileInput.value = ''; // Reset file input
    });

    // Window level clipboard paste event listener
    window.addEventListener('paste', (e) => {
        // Only trigger if the modal overlay is active and we are NOT in read-only details view
        if (!eventModalOverlay.classList.contains('active') || !eventDetailsView.classList.contains('hidden')) {
            return;
        }
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    addAttachedImage(event.target.result);
                };
                reader.readAsDataURL(blob);
            }
        }
    });

    function addAttachedImage(base64Str) {
        const img = new Image();
        img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            state.attachedImages.push(optimizedBase64);
            renderAttachedImagesPreviews();
        };
        img.onerror = () => {
            state.attachedImages.push(base64Str);
            renderAttachedImagesPreviews();
        };
        img.src = base64Str;
    }

    function renderAttachedImagesPreviews() {
        attachedImagesPreview.innerHTML = '';
        state.attachedImages.forEach((img, idx) => {
            const container = document.createElement('div');
            container.className = 'preview-img-container';

            const image = document.createElement('img');
            image.src = img;

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-preview-btn';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.attachedImages.splice(idx, 1);
                renderAttachedImagesPreviews();
            });

            container.appendChild(image);
            container.appendChild(deleteBtn);
            attachedImagesPreview.appendChild(container);
        });
    }

    // --- LIGHTBOX CONTROLLER ---
    let lightboxImages = [];
    let currentLightboxIndex = 0;

    function openLightbox(images, startIndex = 0) {
        lightboxImages = images;
        currentLightboxIndex = startIndex;

        // Generate slides HTML
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

        // Scroll immediately to the selected slide
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

    // Scroll snap tracking to update counter and current index
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

    // Lightbox Controls
    lightboxClose?.addEventListener('click', closeLightbox);
    
    lightboxPrev?.addEventListener('click', () => {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            const slideWidth = lightboxContentWrapper.clientWidth;
            lightboxContentWrapper.scrollTo({
                left: currentLightboxIndex * slideWidth,
                behavior: 'smooth'
            });
            updateLightboxCounter();
        }
    });

    lightboxNext?.addEventListener('click', () => {
        if (currentLightboxIndex < lightboxImages.length - 1) {
            currentLightboxIndex++;
            const slideWidth = lightboxContentWrapper.clientWidth;
            lightboxContentWrapper.scrollTo({
                left: currentLightboxIndex * slideWidth,
                behavior: 'smooth'
            });
            updateLightboxCounter();
        }
    });

    // Close lightbox by clicking backdrop (only click on slide itself, not on image)
    lightboxContentWrapper?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget || e.target.classList.contains('lightbox-slide')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (!lightboxOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            lightboxPrev.click();
        } else if (e.key === 'ArrowRight') {
            lightboxNext.click();
        }
    });

    // --- DAY UPDATES FULL PAGE VIEW ---
    function openDayUpdatesModal(dateStr) {
        state.selectedDate = dateStr;
        
        // Format date string for title (e.g. August 25, 2026)
        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        dayUpdatesTitle.textContent = `Updates for ${formattedDate}`;

        renderDayUpdatesList(dateStr);
        
        // Toggle view container visibilities
        calendarViewContainer.style.display = 'none';
        dayViewContainer.style.display = 'block';
    }

    function closeDayUpdatesModal() {
        calendarViewContainer.style.display = 'flex';
        dayViewContainer.style.display = 'none';
    }

    backToCalendarBtn?.addEventListener('click', closeDayUpdatesModal);

    // Add Update Option button triggers the CREATE UPDATES modal form
    addUpdateBtn?.addEventListener('click', () => {
        openCreateEventModal(state.selectedDate);
    });

    function renderDayUpdatesList(dateStr) {
        dayUpdatesList.innerHTML = '';
        const todayStr = formatDateStr(new Date());
        const dayEvents = state.events.filter(e => {
            if (e.status === 'completed') {
                return e.event_date === dateStr;
            } else { // progress
                if (e.event_date >= todayStr) {
                    return e.event_date === dateStr;
                } else {
                    return dateStr === todayStr;
                }
            }
        });

        if (dayEvents.length === 0) {
            const li = document.createElement('li');
            li.classList.add('subtitle');
            li.style.padding = '1.5rem 0.5rem';
            li.style.textAlign = 'center';
            li.textContent = 'No updates created for this day';
            dayUpdatesList.appendChild(li);
            return;
        }

        dayEvents.forEach(evt => {
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

            const isProgress = evt.status === 'progress';

            // View button only for progress; edit pencil for all
            const viewBtnHtml = isProgress ? `
                <button class="btn-icon btn-view" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            ` : '';

            // Edit button — always visible
            const editBtnHtml = `
                <button class="btn-icon btn-edit" title="Edit Update" style="color: var(--accent);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
            `;

            // Delete button — always visible, no confirm
            const deleteBtnHtml = `
                <button class="btn-icon btn-delete-event" title="Delete Update" style="color: var(--danger);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            `;

            // Parse images if any
            let imageList = [];
            if (evt.images) {
                try {
                    imageList = JSON.parse(evt.images);
                } catch(e) {
                    console.error("Failed to parse event images:", e);
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

            li.innerHTML = `
                <div class="day-update-header">
                    <span class="day-update-token">${evt.token_id || 'No Token'}</span>
                    <span class="day-update-status ${statusClass}">${statusText}</span>
                </div>
                <div class="day-update-subject">${evt.title}</div>
                <div class="day-update-content">${evt.description || 'No content details provided.'}</div>
                ${imagesHtml}
                <div class="day-update-footer">
                    ${assigneeHtml}
                    <div class="day-update-actions" style="display:flex; align-items:center; gap:0.35rem;">
                        ${viewBtnHtml}
                        ${editBtnHtml}
                        ${deleteBtnHtml}
                    </div>
                </div>
            `;

            // Wire VIEW button (progress cards)
            const viewBtn = li.querySelector('.btn-view');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => openEditEventModal(evt));
            }

            // Wire EDIT button — opens form in edit mode
            const editBtn = li.querySelector('.btn-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    // Force edit mode regardless of status
                    const editableEvt = { ...evt, status: 'completed' };
                    openEditEventModal(editableEvt);
                });
            }

            // Wire DELETE button — immediate delete, no confirm
            const delBtn = li.querySelector('.btn-delete-event');
            if (delBtn) {
                delBtn.addEventListener('click', () => deleteEventImmediate(evt.id));
            }

            // Wire click event on thumbnails to open lightbox
            li.querySelectorAll('.day-update-thumb').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(thumb.getAttribute('data-index'));
                    openLightbox(imageList, index);
                });
            });

            dayUpdatesList.appendChild(li);
        });
    }

    function setModalMode(isReadOnly) {
        if (isReadOnly) {
            eventForm.classList.add('hidden');
            eventDetailsView.classList.remove('hidden');
        } else {
            eventForm.classList.remove('hidden');
            eventDetailsView.classList.add('hidden');
        }
    }

    // --- CREATE EVENT MODAL ---
    function openCreateEventModal(dateStr) {
        modalTitle.textContent = "CREATE UPDATES";
        state.selectedDate = dateStr;
        
        // Clear inputs
        eventTokenIdInput.value = '';
        eventTitleInput.value = '';
        eventDescriptionInput.value = '';
        if (eventMemberIdSelect) eventMemberIdSelect.value = '';
        if (eventStatusSelect) eventStatusSelect.value = 'progress';
        
        // Reset attachments
        state.attachedImages = [];
        renderAttachedImagesPreviews();

        setModalMode(false);
        deleteEventBtn.classList.add('hidden');

        openModal();
        eventTitleInput.focus();
    }

    // --- EDIT EVENT MODAL ---
    function openEditEventModal(eventObj) {
        const isProgress = eventObj.status === 'progress';
        
        modalTitle.textContent = isProgress ? "VIEW UPDATE DETAILS" : "CREATE UPDATES";
        eventIdInput.value = eventObj.id;
        state.selectedDate = eventObj.event_date;

        if (isProgress) {
            // View Update Details mode
            setModalMode(true);

            detailsTokenId.textContent = eventObj.token_id || 'No Token';
            detailsSubject.textContent = eventObj.title;
            detailsContent.textContent = eventObj.description || 'No content details provided.';

            // Find assignee name
            let assigneeName = 'Unassigned';
            if (eventObj.member_id) {
                const assignedUser = state.users.find(u => u.id === eventObj.member_id);
                if (assignedUser) {
                    assigneeName = assignedUser.full_name;
                }
            }
            detailsAssignee.textContent = assigneeName;
            detailsStatus.textContent = eventObj.status === 'completed' ? 'Completed' : 'In Progress';

            // Show images if any
            let imageList = [];
            if (eventObj.images) {
                try {
                    imageList = JSON.parse(eventObj.images);
                } catch(e) {
                    console.error("Failed to parse event images:", e);
                }
            }

            if (Array.isArray(imageList) && imageList.length > 0) {
                detailsImagesGroup.style.display = 'flex';
                detailsImagesList.innerHTML = '';
                imageList.forEach((img, idx) => {
                    const imgThumb = document.createElement('img');
                    imgThumb.src = img;
                    imgThumb.className = 'day-update-thumb';
                    imgThumb.addEventListener('click', () => {
                        openLightbox(imageList, idx);
                    });
                    detailsImagesList.appendChild(imgThumb);
                });
            } else {
                detailsImagesGroup.style.display = 'none';
            }
        } else {
            // Edit mode
            setModalMode(false);

            eventTokenIdInput.value = eventObj.token_id || '';
            eventTitleInput.value = eventObj.title;
            eventDescriptionInput.value = eventObj.description || '';
            if (eventMemberIdSelect) eventMemberIdSelect.value = eventObj.member_id || '';
            if (eventStatusSelect) eventStatusSelect.value = eventObj.status || 'progress';

            // Load attachments
            let imageList = [];
            if (eventObj.images) {
                try {
                    imageList = JSON.parse(eventObj.images);
                } catch(e) {
                    console.error("Failed to parse event images:", e);
                }
            }
            state.attachedImages = Array.isArray(imageList) ? [...imageList] : [];
            renderAttachedImagesPreviews();

            deleteEventBtn.classList.remove('hidden');
        }

        openModal();
        if (!isProgress) {
            eventTitleInput.focus();
        }
    }

    // --- EVENT SAVE ACTION (CREATE / UPDATE) ---
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = eventTitleInput.value.trim();
        const description = eventDescriptionInput.value.trim();
        const tokenId = eventTokenIdInput.value.trim();
        const memberId = eventMemberIdSelect ? eventMemberIdSelect.value : null;
        const status = eventStatusSelect ? eventStatusSelect.value : 'progress';
        const eventDate = state.selectedDate;

        const subject = '';
        const startTime = '';
        const endTime = '';
        const color = 'blue';
        const id = eventIdInput.value;

        if (!title || !eventDate) {
            alert('Subject is required.');
            return;
        }

        if (!memberId) {
            alert('Assign field is required.');
            return;
        }

        if (!status) {
            alert('Status field is required.');
            return;
        }

        const requestData = {
            userId: currentUser.userId,
            title,
            description,
            tokenId,
            subject,
            memberId,
            status,
            eventDate,
            startTime,
            endTime,
            color,
            images: JSON.stringify(state.attachedImages)
        };

        if (id) {
            requestData.id = id;
            if (status === 'completed') {
                requestData.eventDate = eventDate;
            }
        }

        fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to save event.');
                return result;
            })
            .then(result => {
                closeModal();
                fetchEvents(() => {
                    openDayUpdatesModal(state.selectedDate);
                });
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // --- EVENT DELETE ACTION (modal delete button) ---
    deleteEventBtn.addEventListener('click', () => {
        const id = eventIdInput.value;
        if (!id) return;

        fetch(`/api/events?id=${id}&userId=${currentUser.userId}`, {
            method: 'DELETE'
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to delete event.');
                return result;
            })
            .then(result => {
                closeModal();
                fetchEvents(() => {
                    openDayUpdatesModal(state.selectedDate);
                });
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // --- IMMEDIATE CARD DELETE (no confirm, no modal) ---
    function deleteEventImmediate(eventId) {
        fetch(`/api/events?id=${eventId}&userId=${currentUser.userId}`, {
            method: 'DELETE'
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to delete event.');
                return result;
            })
            .then(() => {
                fetchEvents(() => {
                    openDayUpdatesModal(state.selectedDate);
                });
            })
            .catch(error => {
                console.error('Delete failed:', error.message);
            });
    }

    // --- API HANDLERS ---
    function fetchEvents(callback) {
        fetch(`/api/events?userId=${currentUser.userId}`)
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to fetch events.');
                return result;
            })
            .then(data => {
                state.events = data;
                renderCalendar();
                if (typeof callback === 'function') {
                    callback();
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function fetchOnlineUsers() {
        fetch('/api/users')
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to fetch users.');
                return result;
            })
            .then(users => {
                state.users = users;
                
                // Populate Online Users list in sidebar
                onlineUsersList.innerHTML = '';
                
                // Populate select dropdown in the modal
                if (eventMemberIdSelect) {
                    eventMemberIdSelect.innerHTML = '<option value="">-- Select Member --</option>';
                }
                
                users.forEach(user => {
                    const li = document.createElement('li');
                    li.classList.add('online-user-item');
                    
                    const isCurrentUser = user.id === currentUser.userId;
                    // Only the currently logged-in user is shown as online
                    const isOnline = isCurrentUser;
                    const statusClass = isOnline ? 'status-online' : 'status-offline';
                    const statusLabel = isOnline ? 'Online' : 'Offline';
                    
                    const initial = user.full_name.charAt(0).toUpperCase();
                    
                    li.innerHTML = `
                        <div class="user-avatar-sm" title="${statusLabel}">
                            ${initial}
                            <span class="status-dot ${statusClass}"></span>
                        </div>
                        <div class="user-details-sm">
                            <span class="user-name-sm">${user.full_name} ${isCurrentUser ? '(You)' : ''}</span>
                            <span class="user-role-sm">${user.role}</span>
                        </div>
                    `;
                    onlineUsersList.appendChild(li);

                    // Add ALL registered users to the assign dropdown (not just online ones)
                    if (eventMemberIdSelect) {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = `${user.full_name} (${user.role})` + (isCurrentUser ? ' - You' : '');
                        eventMemberIdSelect.appendChild(option);
                    }
                });
                
                // Trigger re-rendering of calendar to display assignee details
                renderCalendar();
            })
            .catch(error => {
                console.error('Error loading online users:', error);
            });
    }
});
