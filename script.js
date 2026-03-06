/**
 * Smart Event Dashboard -- script.js
 * Handles: Add Event, Clear Events, Sample Events, Keyboard Demo
 *
 * BUG FIXES:
 *  1. Clear All: querySelectorAll returns a live NodeList; converting to
 *     Array ensures all cards are removed. updateEmptyState() was called
 *     while opacity-0 cards were still in DOM, causing wrong count.
 *     Now we directly set emptyState + badge after DOM removal.
 *
 *  2. Sample Events: No guard existed, so clicking multiple times added
 *     duplicates. Now we check existing card titles before inserting.
 */

// -----------------------------------------------------------
// DOM References
// -----------------------------------------------------------
const inputTitle = document.getElementById('event-title');
const inputDate = document.getElementById('event-date');
const inputCategory = document.getElementById('event-category');
const inputDesc = document.getElementById('event-desc');

const btnAddEvent = document.getElementById('btn-add-event');
const btnClear = document.getElementById('btn-clear');
const btnSamples = document.getElementById('btn-samples');

const eventsList = document.getElementById('events-list');
const emptyState = document.getElementById('empty-state');
const countBadge = document.getElementById('event-count');
const successToast = document.getElementById('success-toast');

const keyDisplay = document.getElementById('key-display');
const keyValue = document.getElementById('key-value');

// -----------------------------------------------------------
// State
// -----------------------------------------------------------
let eventCount = 0;

// -----------------------------------------------------------
// Category Icons
// -----------------------------------------------------------
const categoryIcons = {
    'Work': '💼',
    'Personal': '🌿',
    'Meeting': '📋',
    'Reminder': '🔔',
    'Conference': '🎤',
    'default': '📌',
};

// -----------------------------------------------------------
// Sample Events Data
// -----------------------------------------------------------
const sampleEvents = [
    {
        title: 'Product Roadmap Review',
        date: getRelativeDate(1),
        category: 'Meeting',
        desc: 'Quarterly review of product roadmap with all stakeholders and engineering leads.',
    },
    {
        title: 'Morning Meditation',
        date: getRelativeDate(2),
        category: 'Personal',
        desc: 'Daily 20-minute mindfulness session -- no distractions, just breathing.',
    },
    {
        title: 'Deploy v2.4 to Production',
        date: getRelativeDate(3),
        category: 'Work',
        desc: 'Roll out the latest feature set after final QA sign-off.',
    },
    {
        title: 'UX Design Summit 2025',
        date: getRelativeDate(7),
        category: 'Conference',
        desc: 'Two-day design conference covering accessibility, motion design, and AI tooling.',
    },
];

// -----------------------------------------------------------
// HELPER: Get a date offset from today (returns YYYY-MM-DD)
// -----------------------------------------------------------
function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

// -----------------------------------------------------------
// HELPER: Format YYYY-MM-DD to "15 Jan, 2025"
// -----------------------------------------------------------
function formatDate(isoDate) {
    if (!isoDate) return 'No date set';
    const [y, m, d] = isoDate.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d + ' ' + months[m - 1] + ', ' + y;
}

// -----------------------------------------------------------
// HELPER: Sync empty-state visibility and event count badge
// -----------------------------------------------------------
function updateEmptyState() {
    const count = eventsList.querySelectorAll('.event-card').length;
    emptyState.style.display = count > 0 ? 'none' : 'flex';
    countBadge.textContent = count > 0 ? String(count) : '0';
}

// -----------------------------------------------------------
// HELPER: Validate form -- returns true if all fields filled
// -----------------------------------------------------------
function validateForm() {
    let valid = true;
    [inputTitle, inputDate, inputCategory].forEach(el => el.classList.remove('input-error'));

    if (!inputTitle.value.trim()) {
        inputTitle.classList.add('input-error');
        shakeField(inputTitle);
        valid = false;
    }
    if (!inputDate.value) {
        inputDate.classList.add('input-error');
        shakeField(inputDate);
        valid = false;
    }
    if (!inputCategory.value) {
        inputCategory.classList.add('input-error');
        shakeField(inputCategory);
        valid = false;
    }
    return valid;
}

// -----------------------------------------------------------
// HELPER: Shake animation on invalid field
// -----------------------------------------------------------
function shakeField(el) {
    el.style.animation = 'none';
    requestAnimationFrame(() => {
        el.style.animation = 'shakeField 0.4s ease';
    });
}

// -----------------------------------------------------------
// HELPER: Show success toast message
// -----------------------------------------------------------
function showToast(msg) {
    successToast.textContent = msg;
    successToast.classList.add('show');
    clearTimeout(successToast._timer);
    successToast._timer = setTimeout(() => {
        successToast.classList.remove('show');
    }, 2800);
}

// -----------------------------------------------------------
// CORE: Build a single event card DOM element
// -----------------------------------------------------------
function createEventCard({ title, date, category, desc }) {
    const icon = categoryIcons[category] || categoryIcons['default'];
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('role', 'listitem');

    card.innerHTML =
        '<div class="event-card-icon" aria-hidden="true">' + icon + '</div>' +
        '<div class="event-card-body">' +
        '<div class="event-card-title">' + escapeHtml(title) + '</div>' +
        '<div class="event-card-meta">' +
        '<span class="event-card-date">' +
        '<svg viewBox="0 0 12 12" fill="none" width="11" height="11">' +
        '<rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>' +
        '<path d="M1 5.5h10" stroke="currentColor" stroke-width="1.2"/>' +
        '<path d="M4 1.5v2M8 1.5v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
        '</svg>' +
        formatDate(date) +
        '</span>' +
        '<span class="event-card-category">' + escapeHtml(category) + '</span>' +
        '</div>' +
        (desc ? '<p class="event-card-desc">' + escapeHtml(desc) + '</p>' : '') +
        '</div>';

    return card;
}

// -----------------------------------------------------------
// CORE: Insert event card at top of list
// -----------------------------------------------------------
function addEventToList(data) {
    emptyState.style.display = 'none';
    const card = createEventCard(data);
    eventsList.insertBefore(card, eventsList.firstChild);
    eventsList.scrollTo({ top: 0, behavior: 'smooth' });
    eventCount++;
    updateEmptyState();
}

// -----------------------------------------------------------
// CORE: Reset all form fields
// -----------------------------------------------------------
function resetForm() {
    inputTitle.value = '';
    inputDate.value = '';
    inputCategory.value = '';
    inputDesc.value = '';
    [inputTitle, inputDate, inputCategory, inputDesc]
        .forEach(el => el.classList.remove('input-error'));
}

// -----------------------------------------------------------
// HELPER: Safely escape HTML to prevent XSS
// -----------------------------------------------------------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// -----------------------------------------------------------
// EVENT: Add Event button
// -----------------------------------------------------------
btnAddEvent.addEventListener('click', () => {
    if (!validateForm()) return;

    const data = {
        title: inputTitle.value.trim(),
        date: inputDate.value,
        category: inputCategory.value,
        desc: inputDesc.value.trim(),
    };

    addEventToList(data);
    resetForm();
    showToast('Event "' + data.title + '" added successfully!');
    inputTitle.focus();
});

// -----------------------------------------------------------
// EVENT: Clear All Events
//
// FIX 1 -- querySelectorAll returns a LIVE NodeList. As nodes
//   are removed the list shrinks, causing forEach to skip items.
//   Array.from() creates a static snapshot that won't change.
//
// FIX 2 -- updateEmptyState() queries the DOM to count cards.
//   If called while animated (opacity:0) cards are still in the
//   DOM, it finds them and keeps showing 0 count incorrectly.
//   We now remove first, THEN manually set the badge + state.
// -----------------------------------------------------------
btnClear.addEventListener('click', () => {
    // FIXED: Array.from() -- static snapshot, not a live NodeList
    const cards = Array.from(eventsList.querySelectorAll('.event-card'));
    if (cards.length === 0) return;

    // Disable button during animation to prevent double-clicks
    btnClear.disabled = true;

    // Stagger fade-out
    cards.forEach((card, i) => {
        card.style.transition =
            'opacity 0.22s ' + (i * 0.05) + 's ease, ' +
            'transform 0.22s ' + (i * 0.05) + 's ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(24px) scale(0.94)';
    });

    // After animation: remove nodes, then update state manually
    setTimeout(() => {
        cards.forEach(card => card.remove()); // safe: static Array

        // FIXED: set state directly instead of calling updateEmptyState()
        eventCount = 0;
        emptyState.style.display = 'flex';
        countBadge.textContent = '0';

        btnClear.disabled = false;
    }, cards.length * 50 + 260);
});

// -----------------------------------------------------------
// EVENT: Add Sample Events
//
// FIX -- clicking multiple times added duplicates because there
//   was no check. Now we read the titles already in the list and
//   skip any sample that is already present.
// -----------------------------------------------------------
btnSamples.addEventListener('click', () => {
    // Collect titles currently rendered in the list
    const existingTitles = new Set(
        Array.from(eventsList.querySelectorAll('.event-card-title'))
            .map(el => el.textContent.trim())
    );

    // Only keep samples whose title is NOT already in the list
    const toAdd = sampleEvents.filter(e => !existingTitles.has(e.title));

    if (toAdd.length === 0) {
        showToast('Sample events are already added. Clear the list first to reload them.');
        return;
    }

    toAdd.forEach((data, i) => {
        setTimeout(() => addEventToList(data), i * 120);
    });

    showToast('Sample events loaded!');
});

// -----------------------------------------------------------
// EVENT: Keyboard Interaction Demo
// -----------------------------------------------------------
let keyHintTimeout;

document.addEventListener('keydown', e => {
    const label = formatKeyName(e.key);

    keyValue.classList.remove('pulse');
    requestAnimationFrame(() => {
        keyValue.classList.add('pulse');
        keyValue.textContent = label;
    });

    keyDisplay.classList.add('active');
    clearTimeout(keyHintTimeout);
    keyHintTimeout = setTimeout(() => {
        keyDisplay.classList.remove('active');
    }, 1800);
});

// -----------------------------------------------------------
// HELPER: Human-readable key label
// -----------------------------------------------------------
function formatKeyName(key) {
    const specialKeys = {
        ' ': 'Space',
        'ArrowUp': 'Up',
        'ArrowDown': 'Down',
        'ArrowLeft': 'Left',
        'ArrowRight': 'Right',
        'Enter': 'Enter',
        'Backspace': 'Backspace',
        'Escape': 'Escape',
        'Tab': 'Tab',
        'CapsLock': 'CapsLock',
        'Shift': 'Shift',
        'Control': 'Ctrl',
        'Alt': 'Alt',
        'Meta': 'Meta',
        'Delete': 'Delete',
        'Home': 'Home',
        'End': 'End',
        'PageUp': 'PgUp',
        'PageDown': 'PgDn',
    };
    return specialKeys[key] || (key.length === 1 ? key.toUpperCase() : key);
}

// -----------------------------------------------------------
// INIT: Clear error styles when user interacts with fields
// -----------------------------------------------------------
[inputTitle, inputDate, inputCategory, inputDesc].forEach(el => {
    el.addEventListener('input', () => el.classList.remove('input-error'));
    el.addEventListener('change', () => el.classList.remove('input-error'));
});

// -----------------------------------------------------------
// INIT: Inject shake + error styles dynamically
// -----------------------------------------------------------
(function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = [
        '@keyframes shakeField {',
        '  0%,100% { transform: translateX(0); }',
        '  20%     { transform: translateX(-6px); }',
        '  40%     { transform: translateX(6px); }',
        '  60%     { transform: translateX(-4px); }',
        '  80%     { transform: translateX(4px); }',
        '}',
        '.input-error {',
        '  border-color: #ff5a5a !important;',
        '  box-shadow: 0 0 0 3px rgba(255,90,90,0.18) !important;',
        '  animation: shakeField 0.4s ease;',
        '}',
    ].join('\n');
    document.head.appendChild(style);
})();

// -----------------------------------------------------------
// INIT: Sync empty state on page load
// -----------------------------------------------------------
updateEmptyState();