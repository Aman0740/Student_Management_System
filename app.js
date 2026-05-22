// State Management
let students = JSON.parse(localStorage.getItem('students')) || [];
let isEditing = false;
let currentEditingId = null;

// DOM Elements
const studentForm = document.getElementById('student-form');
const studentIdInput = document.getElementById('student-id');
const nameInput = document.getElementById('student-name');
const ageInput = document.getElementById('student-age');
const rollInput = document.getElementById('student-roll');
const emailInput = document.getElementById('student-email');
const courseSelect = document.getElementById('student-course');

const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

const tbody = document.getElementById('students-tbody');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const filterCourse = document.getElementById('filter-course');

// Dashboard Stats Elements
const statTotal = document.getElementById('stat-total');
const statCourses = document.getElementById('stat-courses');
const statAvgAge = document.getElementById('stat-avg-age');

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderTable(students);
    updateDashboardMetrics();
    
    // Attach Event Listeners
    studentForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetFormState);
    searchInput.addEventListener('input', filterAndSearchRecords);
    filterCourse.addEventListener('change', filterAndSearchRecords);
});

// Calculate Dashboard Operational Metrics
function updateDashboardMetrics() {
    statTotal.textContent = students.length;

    if (students.length === 0) {
        statAvgAge.textContent = '0';
        statCourses.textContent = '0';
        return;
    }

    // Average Age
    const totalAge = students.reduce((sum, current) => sum + parseInt(current.age), 0);
    statAvgAge.textContent = (totalAge / students.length).toFixed(1);

    // Unique Courses Count
    const uniqueCourses = [...new Set(students.map(s => s.course))];
    statCourses.textContent = uniqueCourses.length;
}

// Render Table Array Elements
function renderTable(dataToRender) {
    tbody.innerHTML = '';
    
    if (dataToRender.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    dataToRender.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(student.roll)}</strong></td>
            <td>${escapeHtml(student.name)}</td>
            <td>${student.age}</td>
            <td>${escapeHtml(student.email)}</td>
            <td><span class="course-badge">${escapeHtml(student.course)}</span></td>
            <td class="text-center">
                <button class="btn btn-action btn-edit" onclick="setupEditMode('${student.id}')">Edit</button>
                <button class="btn btn-action btn-delete" onclick="deleteStudentRecord('${student.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Intercept Form Submissions (Create and Update)
function handleFormSubmit(e) {
    e.preventDefault();

    // Basic Form validation Check
    if (!studentForm.checkValidity()) {
        studentForm.reportValidity();
        return;
    }

    const studentData = {
        id: isEditing ? currentEditingId : 'id_' + Date.now(),
        name: nameInput.value.trim(),
        age: parseInt(ageInput.value),
        roll: rollInput.value.trim().toUpperCase(),
        email: emailInput.value.trim(),
        course: courseSelect.value
    };

    // Check duplicate roll numbers if adding a new entry
    const duplicateRoll = students.find(s => s.roll === studentData.roll && s.id !== studentData.id);
    if (duplicateRoll) {
        alert('Operation failed: A student record with this Roll Number already exists.');
        return;
    }

    if (isEditing) {
        students = students.map(s => s.id === studentData.id ? studentData : s);
    } else {
        students.push(studentData);
    }

    commitDataState();
    resetFormState();
}

// Setup Form for Editing an Existing Entry
window.setupEditMode = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    isEditing = true;
    currentEditingId = id;
    
    // Bind current object values to DOM inputs
    nameInput.value = student.name;
    ageInput.value = student.age;
    rollInput.value = student.roll;
    emailInput.value = student.email;
    courseSelect.value = student.course;

    formTitle.textContent = "Modify Student Profile";
    submitBtn.textContent = "Apply Changes";
    cancelBtn.classList.remove('hidden');
    nameInput.focus();
};

// Remove Record from State Collection
window.deleteStudentRecord = function(id) {
    if (confirm('Are you certain you want to remove this student record permanently?')) {
        students = students.filter(s => s.id !== id);
        if (isEditing && currentEditingId === id) {
            resetFormState();
        }
        commitDataState();
    }
};

// Global Table Search and Dropdown Filter Management
function filterAndSearchRecords() {
    const query = searchInput.value.toLowerCase().trim();
    const filter = filterCourse.value;

    const filtered = students.filter(student => {
        const matchesSearch = 
            student.name.toLowerCase().includes(query) ||
            student.roll.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query);
            
        const matchesDropdown = (filter === 'all' || student.course === filter);

        return matchesSearch && matchesDropdown;
    });

    renderTable(filtered);
}

// Reset Form Inputs and Context State Elements
function resetFormState() {
    isEditing = false;
    currentEditingId = null;
    studentForm.reset();
    formTitle.textContent = "Register New Student";
    submitBtn.textContent = "Save Student";
    cancelBtn.classList.add('hidden');
}

// Sync App State Array into Client Local Storage Cache Layer
function commitDataState() {
    localStorage.setItem('students', JSON.stringify(students));
    filterAndSearchRecords();
    updateDashboardMetrics();
}

// Anti-XSS Sanitization Helper for Injected String Content
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}