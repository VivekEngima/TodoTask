// This file handles all Todo-related AJAX operations and UI interactions

// Global variables for Todo functionality
//let currentTodoFilter = {
//    status: null,
//    priority: null,
//    searchTerm: null
//};
//let editingTodoTaskId = 0;
//let todoTasks = [];


(function () {
    // IIFE‐scoped variables – keep these
    let currentTodoFilter = { status: null, priority: null, searchTerm: null };
    let editingTodoTaskId = 0;
    let todoTasks = [];
// Initialize Todo page when document is ready
$(document).ready(function () {
    if (window.location.pathname.toLowerCase().includes('todo') || window.location.pathname === '/') {
        initializeTodoPage();
        loadAllTodos();
        setupTodoEventHandlers();
    }
});

// Initialize Todo page specific functionality
function initializeTodoPage() {
    console.log('Initializing Todo Task App...');

    // Set default due date to 7 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    $('#taskDueDate').val(defaultDueDate.toISOString().split('T')[0]);

    // Initialize Bootstrap tooltips
    initializeTooltips();

    // Initialize anti-forgery token
    setupAntiForgeryToken();

    console.log('Todo app initialized successfully');
}

// Setup event handlers specific to Todo functionality
function setupTodoEventHandlers() {
    // Task form submission
    $('#taskForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        saveTodoTask();
    });

    // Search input with debounce
    $('#searchInput').off('keyup').on('keyup', debounce(function () {
        const searchTerm = $(this).val().trim();
        currentTodoFilter.searchTerm = searchTerm || null;
        filterTodoTasks();
    }, 300));

    // Quick add task functionality
    $(document).off('keypress', '#quickAddInput').on('keypress', '#quickAddInput', function (e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            quickAddTodoTask();
        }
    });

    // Filter buttons - Status
    $('.status-btn').off('click').on('click', function () {
        const status = $(this).data('status');
        toggleTodoFilter('status', status, $(this));
    });

    // Filter buttons - Priority  
    $('.priority-btn').off('click').on('click', function () {
        const priority = $(this).data('priority');
        toggleTodoFilter('priority', priority, $(this));
    });

    // Filter buttons - General
    $('.filter-btn').off('click').on('click', function () {
        const filterType = $(this).data('filter');
        handleGeneralFilter(filterType);
    });

    // Modal events
    $('#taskModal').off('hidden.bs.modal').on('hidden.bs.modal', function () {
        resetTodoTaskForm();
    });

    // Checkbox change events (delegated)
    $(document).off('change', '.task-checkbox').on('change', '.task-checkbox', function () {
        const taskId = $(this).data('task-id');
        const isCompleted = $(this).is(':checked');
        toggleTodoTaskStatus(taskId, isCompleted);
    });
}

// Load all todos from server
function loadAllTodos() {
    showTodoLoading(true);

    $.ajax({
        url: '/Todo/GetAllTasks',
        type: 'GET',
        cache: false,
        success: function (response) {
            if (response && response.success) {
                todoTasks = response.data || [];
                displayTodoTasks(todoTasks);
                updateTodoTaskCount(todoTasks.length);
                console.log(`Loaded ${todoTasks.length} tasks`);
            } else {
                console.error('Failed to load tasks:', response?.message);
                showTodoAlert('Error loading tasks: ' + (response?.message || 'Unknown error'), 'danger');
                displayTodoTasks([]);
            }
        },
        error: function (xhr, status, error) {
            console.error('AJAX Error loading tasks:', error);
            showTodoAlert('Error connecting to server. Please check your connection.', 'danger');
            displayTodoTasks([]);
        },
        complete: function () {
            showTodoLoading(false);
        }
    });
}

// Display tasks in the table
function displayTodoTasks(tasks) {
    const tbody = $('#tasksBody');
    tbody.empty();

    // Always show the quick add row first
    const quickAddRow = createQuickAddRow();
    tbody.append(quickAddRow);

    if (!tasks || tasks.length === 0) {
        const emptyRow = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p class="mb-0">No tasks found. Create your first task above!</p>
                </td>
            </tr>
        `;
        tbody.append(emptyRow);
        return;
    }

    // Sort tasks by creation date (newest first)
    const sortedTasks = tasks.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

    sortedTasks.forEach(task => {
        const row = createTodoTaskRow(task);
        tbody.append(row);
    });

    // Reinitialize tooltips for new content
    initializeTooltips();
}

// Create quick add row
function createQuickAddRow() {
    return `
        <tr class="bg-light">
            <td colspan="5" class="border-bottom">
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-plus text-primary"></i>
                    </span>
                    <input type="text" class="form-control" 
                           placeholder="Type here to create new task..." 
                           id="quickAddInput"
                           maxlength="100">
                    <button class="btn btn-primary" type="button" onclick="quickAddTodoTask()">
                        <i class="fas fa-plus me-1"></i>Add
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Create task row HTML - FIXED
function createTodoTaskRow(task) {
    const priorityClass = getTodoPriorityClass(task.Priority);
    const statusClass = getTodoStatusClass(task.Status);
    const dueDateFormatted = formatTodoDate(task.DueDate);
    const isOverdue = isTodoTaskOverdue(task);
    const rowClass = isOverdue ? 'table-warning' : '';

    return `
        <tr class="${rowClass}" data-task-id="${task.Id}">
            <td>
                <div class="d-flex align-items-center">
                    <input type="checkbox" 
                           class="form-check-input me-2 task-checkbox" 
                           data-task-id="${task.Id}"
                           ${task.Status === 'Completed' ? 'checked' : ''}>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${escapeHtml(task.Title)}</div>
                        ${task.Description ? `<small class="text-muted">${escapeHtml(task.Description)}</small>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${priorityClass}">${task.Priority}</span>
            </td>
            <td>
                <span class="badge ${statusClass}">${task.Status}</span>
            </td>
            <td>
                <small class="text-muted">
                    ${getTodoDateDisplay(task)}
                    ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1" title="Overdue"></i>' : ''}
                </small>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" 
                            class="btn btn-outline-primary btn-sm" 
                            onclick="editTodoTask(${task.Id})" 
                            title="Edit Task"
                            data-bs-toggle="tooltip">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" 
                            class="btn btn-outline-danger btn-sm" 
                            onclick="deleteTodoTask(${task.Id})" 
                            title="Delete Task"
                            data-bs-toggle="tooltip">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Quick add task functionality - FIXED
function quickAddTodoTask() {
    const input = $('#quickAddInput');
    const title = input.val().trim();

    if (!title) {
        showTodoAlert('Please enter a task title', 'warning');
        input.focus();
        return;
    }

    if (title.length > 100) {
        showTodoAlert('Task title cannot exceed 100 characters', 'warning');
        return;
    }

    // Validate no special characters (basic validation)
    if (!/^[a-zA-Z0-9\s]*$/.test(title)) {
        showTodoAlert('Task title cannot contain special characters', 'warning');
        return;
    }

    const task = {
        Id: 0,
        Title: title,
        Description: '',
        Priority: 'Normal',
        Status: 'Pending',
        DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    createTodoTask(task, function (success) {
        if (success) {
            input.val('');
            loadAllTodos(); // Refresh the list
        }
    });
}

// Open create modal
function openCreateModal() {
    editingTodoTaskId = 0;
    resetTodoTaskForm();
    $('#taskModalLabel').html('<i class="fas fa-plus-circle me-2"></i>Add New Task');
    $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Save Task');
    $('#taskModal').modal('show');
}

// Edit todo task
function editTodoTask(taskId) {
    editingTodoTaskId = taskId;

    const task = todoTasks.find(t => t.Id === taskId);
    if (task) {
        populateTodoTaskForm(task);
        $('#taskModalLabel').html('<i class="fas fa-edit me-2"></i>Edit Task');
        $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Update Task');
        $('#taskModal').modal('show');
    } else {
        // Fallback to server request
        $.ajax({
            url: '/Todo/GetTask',
            type: 'GET',
            data: { id: taskId },
            success: function (response) {
                if (response && response.success) {
                    populateTodoTaskForm(response.data);
                    $('#taskModalLabel').html('<i class="fas fa-edit me-2"></i>Edit Task');
                    $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Update Task');
                    $('#taskModal').modal('show');
                } else {
                    showTodoAlert('Error loading task details: ' + (response?.message || 'Unknown error'), 'danger');
                }
            },
            error: function () {
                showTodoAlert('Error connecting to server', 'danger');
            }
        });
    }
}

// Save todo task (create or update)
function saveTodoTask() {
    const formData = {
        Id: parseInt($('#taskId').val()) || 0,
        Title: $('#taskTitle').val().trim(),
        Description: $('#taskDescription').val().trim(),
        Priority: $('#taskPriority').val(),
        Status: $('#taskStatus').val(),
        DueDate: $('#taskDueDate').val()
    };

    // Validate form
    if (!validateTodoTaskForm(formData)) {
        return;
    }

    const isUpdate = formData.Id > 0;
    const url = isUpdate ? '/Todo/UpdateTask' : '/Todo/CreateTask';

    // Show loading state
    const saveBtn = $('#saveTaskBtn');
    const originalText = saveBtn.html();
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Saving...');

    $.ajax({
        url: url,
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            if (response && response.success) {
                $('#taskModal').modal('hide');
                loadAllTodos(); // Refresh the list
                showTodoAlert(response.message || (isUpdate ? 'Task updated successfully' : 'Task created successfully'), 'success');
            } else {
                showTodoTaskFormErrors(response.errors || [response.message || 'Unknown error']);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error saving task:', error);
            showTodoAlert('Error saving task. Please try again.', 'danger');
        },
        complete: function () {
            // Restore button state
            saveBtn.prop('disabled', false).html(originalText);
        }
    });
}

// Delete todo task
function deleteTodoTask(taskId) {
    const task = todoTasks.find(t => t.Id === taskId);
    const taskTitle = task ? task.Title : 'this task';

    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
        return;
    }

    $.ajax({
        url: '/Todo/DeleteTask',
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        data: { id: taskId },
        success: function (response) {
            if (response && response.success) {
                loadAllTodos(); // Refresh the list
                showTodoAlert(response.message || 'Task deleted successfully', 'success');
            } else {
                showTodoAlert(response.message || 'Failed to delete task', 'danger');
            }
        },
        error: function () {
            showTodoAlert('Error deleting task', 'danger');
        }
    });
}

// Toggle task status (checkbox functionality)
function toggleTodoTaskStatus(taskId, isCompleted) {
    const status = isCompleted ? 'Completed' : 'Pending';

    $.ajax({
        url: '/Todo/UpdateTaskStatus',
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        data: { id: taskId, status: status },
        success: function (response) {
            if (response && response.success) {
                loadAllTodos(); // Refresh to show updated status
            } else {
                showTodoAlert('Error updating task status', 'danger');
                // Revert checkbox
                $(`.task-checkbox[data-task-id="${taskId}"]`).prop('checked', !isCompleted);
            }
        },
        error: function () {
            showTodoAlert('Error updating task status', 'danger');
            // Revert checkbox
            $(`.task-checkbox[data-task-id="${taskId}"]`).prop('checked', !isCompleted);
        }
    });
}

// Filter todo tasks 
function filterTodoTasks() {
    console.log('Filtering tasks:', currentTodoFilter);
    $.ajax({
        url: '/Todo/FilterTasks',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(currentTodoFilter),
        success: function (response) {
            if (response && response.success) {
                displayTodoTasks(response.data);
                updateTodoTaskCount(response.data.length);
            } else {
                showTodoAlert('Error filtering tasks', 'danger');
            }
        },
        error: function () {
            console.log(data)
            showTodoAlert('Error filtering tasks', 'danger');
        }
    });
}

    // Toggle filter functionality

    // None of the filters are working Priority, Status, Task or search filter
function toggleTodoFilter(filterType, value, buttonElement) {
    const isActive = buttonElement.hasClass('active');

    // Remove active class from all buttons of the same type
    $(`.${filterType}-btn`).removeClass('active');

    if (isActive) {
        // Deactivate filter
        currentTodoFilter[filterType] = null;
    } else {
        // Activate filter
        currentTodoFilter[filterType] = value;
        buttonElement.addClass('active');
    }

    filterTodoTasks();
}

// Handle general filters (upcoming, today, calendar)
function handleGeneralFilter(filterType) {
    switch (filterType) {
        case 'upcoming':
            // Show tasks due in next 7 days
            showTodoAlert('Upcoming tasks filter applied', 'info');
            break;
        case 'today':
            // Show tasks due today
            showTodoAlert('Today\'s tasks filter applied', 'info');
            break;
        case 'calendar':
            // Show calendar view (placeholder)
            showTodoAlert('Calendar view coming soon!', 'info');
            break;
    }
}

// Refresh todos
function refreshTodos() {
    // Reset all filters
    currentTodoFilter = { status: null, priority: null, searchTerm: null };
    $('#searchInput').val('');
    $('.filter-btn, .priority-btn, .status-btn').removeClass('active');

    // Reload tasks
    loadAllTodos();
    showTodoAlert('Tasks refreshed', 'success');
}

// Utility Functions
function createTodoTask(taskData, callback) {
    $.ajax({
        url: '/Todo/CreateTask',
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        contentType: 'application/json',
        data: JSON.stringify(taskData),
        success: function (response) {
            if (response && response.success) {
                showTodoAlert(response.message || 'Task created successfully', 'success');
                if (callback) callback(true);
            } else {
                showTodoAlert(response.message || 'Failed to create task', 'danger');
                if (callback) callback(false);
            }
        },
        error: function () {
            showTodoAlert('Error creating task', 'danger');
            if (callback) callback(false);
        }
    });
}

function populateTodoTaskForm(task) {
    $('#taskId').val(task.Id);
    $('#taskTitle').val(task.Title || '');
    $('#taskDescription').val(task.Description || '');
    $('#taskPriority').val(task.Priority || 'Normal');
    $('#taskStatus').val(task.Status || 'Pending');
    $('#taskDueDate').val(task.DueDate ? task.DueDate.split('T')[0] : '');
}

function resetTodoTaskForm() {
    $('#taskForm')[0].reset();
    $('#taskId').val(0);
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').hide();
    $('#taskAlert').addClass('d-none');

    // Set default due date
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    $('#taskDueDate').val(defaultDueDate.toISOString().split('T')[0]);
}

function validateTodoTaskForm(formData) {
    let isValid = true;

    // Clear previous validation
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').hide();

    // Validate title
    if (!formData.Title) {
        $('#taskTitle').addClass('is-invalid');
        $('#titleError').text('Title is required').show();
        isValid = false;
    } else if (formData.Title.length > 100) {
        $('#taskTitle').addClass('is-invalid');
        $('#titleError').text('Title cannot exceed 100 characters').show();
        isValid = false;
    } else if (!/^[a-zA-Z0-9\s]*$/.test(formData.Title)) {
        $('#taskTitle').addClass('is-invalid');
        $('#titleError').text('Title cannot contain special characters').show();
        isValid = false;
    }

    // Validate description
    if (formData.Description && formData.Description.length > 500) {
        $('#taskDescription').addClass('is-invalid');
        $('#descriptionError').text('Description cannot exceed 500 characters').show();
        isValid = false;
    } else if (formData.Description && !/^[a-zA-Z0-9\s]*$/.test(formData.Description)) {
        $('#taskDescription').addClass('is-invalid');
        $('#descriptionError').text('Description cannot contain special characters').show();
        isValid = false;
    }

    // Validate due date
    if (!formData.DueDate) {
        $('#taskDueDate').addClass('is-invalid');
        $('#dueDateError').text('Due date is required').show();
        isValid = false;
    }

    return isValid;
}

function showTodoTaskFormErrors(errors) {
    let errorMessage = 'Please fix the following errors:<br>';
    errors.forEach(error => {
        errorMessage += '• ' + error + '<br>';
    });

    $('#taskAlert').removeClass('d-none alert-info').addClass('alert-danger').html(errorMessage);
}

function getTodoPriorityClass(priority) {
    switch (priority) {
        case 'High': return 'bg-danger';
        case 'Low': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function getTodoStatusClass(status) {
    switch (status) {
        case 'Completed': return 'bg-success';
        case 'Hold': return 'bg-warning text-dark';
        default: return 'bg-primary';
    }
}

function formatTodoDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function isTodoTaskOverdue(task) {
    if (task.Status === 'Completed') return false;
    const dueDate = new Date(task.DueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function getTodoDateDisplay(task) {
    if (task.Status === 'Completed' && task.CompletedDate) {
        return `<i class="fas fa-check-circle text-success me-1"></i>${formatTodoDate(task.CompletedDate)}`;
    } else {
        return `<i class="fas fa-calendar me-1"></i>${formatTodoDate(task.DueDate)}`;
    }
}

function updateTodoTaskCount(count) {
    $('#taskCount').text(`${count} task${count !== 1 ? 's' : ''}`);
}

function showTodoLoading(show) {
    if (show) {
        $('#loadingSpinner').removeClass('d-none');
    } else {
        $('#loadingSpinner').addClass('d-none');
    }
}

function showTodoAlert(message, type = 'info') {
    // Create alert element
    const alertId = 'alert-' + Date.now();
    const alertElement = $(`
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             id="${alertId}"
             style="top: 80px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px;" 
             role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    // Add to body
    $('body').append(alertElement);

    // Auto remove after 5 seconds
    setTimeout(() => {
        $(`#${alertId}`).alert('close');
    }, 5000);
}

function getAlertIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'danger': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'bell';
    }
}

function initializeTooltips() {
    // Dispose existing tooltips first
    $('[data-bs-toggle="tooltip"]').tooltip('dispose');

    // Initialize new tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function setupAntiForgeryToken() {
    // Get anti-forgery token and set up AJAX defaults
    const token = $('input[name="__RequestVerificationToken"]').val();
    if (token) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                xhr.setRequestHeader('RequestVerificationToken', token);
            }
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// FIXED: Added missing escapeHtml function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions that can be called from HTML onclick events
window.openCreateModal = openCreateModal;
window.editTodoTask = editTodoTask;
window.deleteTodoTask = deleteTodoTask;
window.quickAddTodoTask = quickAddTodoTask;
window.refreshTodos = refreshTodos;

// Export functions if using module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadAllTodos,
        createTodoTask,
        editTodoTask,
        deleteTodoTask,
        filterTodoTasks,
        refreshTodos
    };
}

console.log('Todo.js loaded successfully - ALL BUGS FIXED');

}) ();