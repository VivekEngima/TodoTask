// Global variables
let currentFilter = {
    status: null,
    priority: null,
    searchTerm: null
};
let editingTaskId = 0;

// Document ready
$(document).ready(function () {
    initializeApp();
    loadTasks();
    setupEventHandlers();
});

// Initialize application
function initializeApp() {
    // Set default due date to 7 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    $('#taskDueDate').val(defaultDueDate.toISOString().split('T')[0]);

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Setup event handlers
function setupEventHandlers() {
    // Task form submission
    $('#taskForm').on('submit', function (e) {
        e.preventDefault();
        saveTask();
    });

    // Search input
    $('#searchInput').on('keyup', function () {
        const searchTerm = $(this).val();
        currentFilter.searchTerm = searchTerm;
        filterTasks();
    });

    // Quick add task
    $('#quickAddInput').on('keypress', function (e) {
        if (e.which === 13) { // Enter key
            quickAddTask();
        }
    });

    // Filter buttons
    $('.filter-btn, .priority-btn, .status-btn').on('click', function () {
        const filterType = $(this).hasClass('filter-btn') ? 'filter' :
            $(this).hasClass('priority-btn') ? 'priority' : 'status';
        const filterValue = $(this).data(filterType);

        // Toggle button state
        $(this).toggleClass('active');

        // Update current filter
        if (filterType === 'priority') {
            currentFilter.priority = $(this).hasClass('active') ? filterValue : null;
            $('.priority-btn').not(this).removeClass('active');
        } else if (filterType === 'status') {
            currentFilter.status = $(this).hasClass('active') ? filterValue : null;
            $('.status-btn').not(this).removeClass('active');
        }

        filterTasks();
    });

    // Modal events
    $('#taskModal').on('hidden.bs.modal', function () {
        resetTaskForm();
    });
}

// Load tasks from server
function loadTasks() {
    showLoading(true);

    $.ajax({
        url: '/Todo/GetAllTasks',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                displayTasks(response.data);
                updateTaskCount(response.data.length);
            } else {
                showAlert('Error loading tasks', 'danger');
            }
        },
        error: function () {
            showAlert('Error connecting to server', 'danger');
        },
        complete: function () {
            showLoading(false);
        }
    });
}

// Display tasks in table
function displayTasks(tasks) {
    const tbody = $('#tasksBody');
    tbody.empty();

    if (tasks.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Type here to create new task..." id="quickAddInput">
                        <button class="btn btn-primary" type="button" onclick="quickAddTask()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `);
        return;
    }

    tasks.forEach(task => {
        const row = createTaskRow(task);
        tbody.append(row);
    });

    // Re-setup quick add if no tasks
    if (tasks.length > 0) {
        tbody.prepend(`
            <tr>
                <td colspan="5" class="bg-light border-bottom-0">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Type here to create new task..." id="quickAddInput">
                        <button class="btn btn-primary" type="button" onclick="quickAddTask()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `);
    }
}

// Create task row HTML
function createTaskRow(task) {
    const priorityClass = getPriorityClass(task.Priority);
    const statusClass = getStatusClass(task.Status);
    const dueDateFormatted = formatDate(task.DueDate);
    const isOverdue = new Date(task.DueDate) < new Date() && task.Status !== 'Completed';

    return `
        <tr class="${isOverdue ? 'table-warning' : ''}">
            <td>
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-2" 
                           ${task.Status === 'Completed' ? 'checked' : ''} 
                           onchange="toggleTaskStatus(${task.Id}, this.checked)">
                    <div>
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
                    ${task.Status === 'Completed' && task.CompletedDate ?
            `<i class="fas fa-check-circle text-success me-1"></i>${formatDate(task.CompletedDate)}` :
            `<i class="fas fa-calendar me-1"></i>${dueDateFormatted}`}
                    ${isOverdue ? '<i class="fas fa-exclamation-triangle text-warning ms-1"></i>' : ''}
                </small>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="editTask(${task.Id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteTask(${task.Id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Get priority CSS class
function getPriorityClass(priority) {
    switch (priority) {
        case 'High': return 'bg-danger';
        case 'Low': return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Get status CSS class  
function getStatusClass(status) {
    switch (status) {
        case 'Completed': return 'bg-success';
        case 'Hold': return 'bg-warning';
        default: return 'bg-primary';
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Quick add task
function quickAddTask() {
    const title = $('#quickAddInput').val().trim();
    if (!title) {
        showAlert('Please enter a task title', 'warning');
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

    createTask(task, function () {
        $('#quickAddInput').val('');
        loadTasks();
    });
}

// Open create modal
function openCreateModal() {
    editingTaskId = 0;
    resetTaskForm();
    $('#taskModalLabel').html('<i class="fas fa-plus-circle me-2"></i>Add New Task');
    $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Save Task');
}

// Edit task
function editTask(taskId) {
    editingTaskId = taskId;

    $.ajax({
        url: '/Todo/GetTask',
        type: 'GET',
        data: { id: taskId },
        success: function (response) {
            if (response.success) {
                populateTaskForm(response.data);
                $('#taskModalLabel').html('<i class="fas fa-edit me-2"></i>Edit Task');
                $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Update Task');
                $('#taskModal').modal('show');
            } else {
                showAlert('Error loading task details', 'danger');
            }
        },
        error: function () {
            showAlert('Error connecting to server', 'danger');
        }
    });
}

// Populate task form
function populateTaskForm(task) {
    $('#taskId').val(task.Id);
    $('#taskTitle').val(task.Title);
    $('#taskDescription').val(task.Description || '');
    $('#taskPriority').val(task.Priority);
    $('#taskStatus').val(task.Status);
    $('#taskDueDate').val(task.DueDate.split('T')[0]);
}

// Reset task form
function resetTaskForm() {
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

// Save task
function saveTask() {
    const formData = {
        Id: parseInt($('#taskId').val()),
        Title: $('#taskTitle').val().trim(),
        Description: $('#taskDescription').val().trim(),
        Priority: $('#taskPriority').val(),
        Status: $('#taskStatus').val(),
        DueDate: $('#taskDueDate').val()
    };

    // Validate form
    if (!validateTaskForm(formData)) {
        return;
    }

    const isUpdate = formData.Id > 0;
    const url = isUpdate ? '/Todo/UpdateTask' : '/Todo/CreateTask';

    $.ajax({
        url: url,
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function (response) {
            if (response.success) {
                $('#taskModal').modal('hide');
                loadTasks();
                showAlert(response.message, 'success');
            } else {
                showTaskFormErrors(response.errors || [response.message]);
            }
        },
        error: function () {
            showAlert('Error saving task', 'danger');
        }
    });
}

// Validate task form
function validateTaskForm(formData) {
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
    }

    // Validate description length
    if (formData.Description && formData.Description.length > 500) {
        $('#taskDescription').addClass('is-invalid');
        $('#descriptionError').text('Description cannot exceed 500 characters').show();
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

// Show task form errors
function showTaskFormErrors(errors) {
    let errorMessage = 'Please fix the following errors:<br>';
    errors.forEach(error => {
        errorMessage += '• ' + error + '<br>';
    });

    $('#taskAlert').removeClass('d-none alert-info').addClass('alert-danger').html(errorMessage);
}

// Delete task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
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
            if (response.success) {
                loadTasks();
                showAlert(response.message, 'success');
            } else {
                showAlert(response.message, 'danger');
            }
        },
        error: function () {
            showAlert('Error deleting task', 'danger');
        }
    });
}

// Toggle task status
function toggleTaskStatus(taskId, isCompleted) {
    const status = isCompleted ? 'Completed' : 'Pending';

    $.ajax({
        url: '/Todo/UpdateTaskStatus',
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        data: { id: taskId, status: status },
        success: function (response) {
            if (response.success) {
                loadTasks();
            } else {
                showAlert('Error updating task status', 'danger');
                // Revert checkbox
                $(event.target).prop('checked', !isCompleted);
            }
        },
        error: function () {
            showAlert('Error updating task status', 'danger');
            // Revert checkbox
            $(event.target).prop('checked', !isCompleted);
        }
    });
}

// Filter tasks
function filterTasks() {
    $.ajax({
        url: '/Todo/FilterTasks',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(currentFilter),
        success: function (response) {
            if (response.success) {
                displayTasks(response.data);
                updateTaskCount(response.data.length);
            } else {
                showAlert('Error filtering tasks', 'danger');
            }
        },
        error: function () {
            showAlert('Error filtering tasks', 'danger');
        }
    });
}

// Refresh tasks
function refreshTasks() {
    loadTasks();
    // Reset filters
    currentFilter = { status: null, priority: null, searchTerm: null };
    $('#searchInput').val('');
    $('.filter-btn, .priority-btn, .status-btn').removeClass('active');
}

// Update task count
function updateTaskCount(count) {
    $('#taskCount').text(`${count} task${count !== 1 ? 's' : ''}`);
}

// Show loading spinner
function showLoading(show) {
    if (show) {
        $('#loadingSpinner').removeClass('d-none');
    } else {
        $('#loadingSpinner').addClass('d-none');
    }
}

// Show alert message
function showAlert(message, type) {
    // Create alert element
    const alertElement = $(`
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    // Add to body
    $('body').append(alertElement);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alertElement.alert('close');
    }, 5000);
}