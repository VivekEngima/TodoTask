// This file handles all Todo-related AJAX operations and UI interactions

(function () {
    // Scoped variables
    let currentTodoFilter = { status: null, priority: null, searchTerm: null };
    let editingTodoTaskId = 0;
    let todoTasks = [];

    // Initialize when DOM is ready
    $(document).ready(function () {
        initializeTodoPage();
        loadAllTodos();
        setupTodoEventHandlers();
    });

    // Set up page defaults
    function initializeTodoPage() {
        // Default due date = today + 7 days
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        $('#taskDueDate').val(defaultDueDate.toISOString().split('T')[0]);

        initializeTooltips();
        setupAntiForgeryToken();
    }

    // Bind UI event handlers
    function setupTodoEventHandlers() {
        // Refresh button
        $('#refreshBtn').off('click').on('click', function () {
            // Clear filters
            currentTodoFilter = { status: null, priority: null, searchTerm: null };
            $('.status-btn, .priority-btn, .filter-btn').removeClass('active');
            $('#searchInput').val('');
            // Reload tasks
            loadAllTodos();
        });
        // Inside setupTodoEventHandlers()
        $('#addTaskBtn').off('click').on('click', function () {
            resetTodoTaskForm();
            $('#taskModalLabel').html('<i class="fas fa-plus-circle me-2"></i>Add New Task');
            $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Save Task');
            // Show modal
            new bootstrap.Modal(document.getElementById('taskModal')).show();
        });

        // Export button
        $('#exportBtn').off('click').on('click', function () {
            showTodoAlert('Exporting tasks...', 'info');
            window.location.href = '/Todo/ExportTasks';
        });

        // Import button
        $('#importBtn').off('click').on('click', function () {
            $('#importFileInput').click();
        });

        // File input change
        $('#importFileInput').off('change').on('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.name.toLowerCase().endsWith('.csv')) {
                showTodoAlert('Please select a CSV file', 'warning');
                return;
            }

            importTasks(file);
        });

        // Create/update form
        $('#taskForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            saveTodoTask();
        });
        // Search
        $('#searchInput').off('keyup').on('keyup', debounce(function () {
            let val = $(this).val();
            if (typeof val !== 'string') val = '';
            currentTodoFilter.searchTerm = val.trim() || null;
            displayFilteredTasks();
        }, 300));
        // Quick add
        $('#quickAddInput').off('keypress').on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                quickAddTodoTask();
            }
        });

        // Status filter
        $('.status-btn').off('click').on('click', function () {
            const statusValue = $(this).data('status');
            const wasActive = $(this).hasClass('active');

            // Toggle this button
            $('.status-btn').removeClass('active');
            currentTodoFilter.status = wasActive ? null : statusValue;
            if (!wasActive) $(this).addClass('active');

            // Re-display tasks with both filters applied
            displayFilteredTasks();
        });

        // Priority filter
        $('.priority-btn').off('click').on('click', function () {
            const priorityValue = $(this).data('priority');
            const wasActive = $(this).hasClass('active');

            // Toggle this button
            $('.priority-btn').removeClass('active');
            currentTodoFilter.priority = wasActive ? null : priorityValue;
            if (!wasActive) $(this).addClass('active');

            // Re-display tasks with both filters applied
            displayFilteredTasks();
        });
        // General filters
        $('.filter-btn').off('click').on('click', function () {
            const type = $(this).data('filter');
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');
            applyGeneralFilter(type);
        });
        // Modal hide
        $('#taskModal').off('hidden.bs.modal').on('hidden.bs.modal', resetTodoTaskForm);
        // Checkbox toggle
        $(document).off('change', '.task-checkbox').on('change', '.task-checkbox', function () {
            const id = $(this).data('task-id');
            toggleTodoTaskStatus(id, $(this).is(':checked'));
        });
    }

    // Load tasks from server
    function loadAllTodos() {
        showTodoLoading(true);
        $.ajax({
            url: '/Todo/GetAllTasks',
            type: 'GET',
            cache: false
        })
            .done(response => {
                todoTasks = response.success ? response.data || [] : [];
                displayFilteredTasks();
            })
            .fail(() => {
                showTodoAlert('Error loading tasks', 'danger');
                todoTasks = [];
                displayFilteredTasks();
            })
            .always(() => showTodoLoading(false));
    }

    // Display tasks using filters
    function displayFilteredTasks() {
        let list = todoTasks.slice();

        // Text search
        if (currentTodoFilter.searchTerm) {
            const term = currentTodoFilter.searchTerm.toLowerCase();
            list = list.filter(t =>
                (t.Title || '').toLowerCase().includes(term) ||
                (t.Description || '').toLowerCase().includes(term)
            );
        }
        // Status
        if (currentTodoFilter.status) {
            list = list.filter(t => t.Status === currentTodoFilter.status);
        }
        // Priority
        if (currentTodoFilter.priority) {
            list = list.filter(t => t.Priority === currentTodoFilter.priority);
        }

        renderTaskTable(list);
    }

    // Import tasks function
    function importTasks(file) {
        const formData = new FormData();
        formData.append('file', file);

        const originalText = $('#importBtn').html();
        $('#importBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Importing...');

        $.ajax({
            url: '/Todo/ImportTasks',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (response) {
                if (response.success) {
                    showTodoAlert(response.message, 'success');
                    loadAllTodos(); // Refresh task list

                    // Show errors if any
                    if (response.errors && response.errors.length > 0) {
                        let errorMsg = 'Import completed with errors:\n';
                        response.errors.forEach(err => errorMsg += '• ' + err + '\n');
                        setTimeout(() => alert(errorMsg), 1000);
                    }
                } else {
                    showTodoAlert(response.message || 'Import failed', 'danger');
                }
            },
            error: function (xhr, status, error) {
                console.error('Import error:', error);
                showTodoAlert('Error importing file. Please try again.', 'danger');
            },
            complete: function () {
                $('#importBtn').prop('disabled', false).html(originalText);
                $('#importFileInput').val(''); // Clear file input
            }
        });
    }

    // Render table
    function renderTaskTable(tasks) {
        const tbody = $('#tasksBody').empty();
        tbody.append(createQuickAddRow());

        if (!tasks.length) {
            tbody.append(`
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        No tasks found.
                    </td>
                </tr>
            `);
        } else {
            tasks.forEach(t => tbody.append(createTodoTaskRow(t)));
        }
        initializeTooltips();
        updateTodoTaskCount(tasks.length);
    }

    // Quick add row HTML
    function createQuickAddRow() {
        return `
            <tr class="bg-light">
                <td colspan="5" class="border-bottom">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-plus text-primary"></i></span>
                        <input type="text" id="quickAddInput" class="form-control" maxlength="100"
                               placeholder="Add new task...">
                        <button class="btn btn-primary" onclick="quickAddTodoTask()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }

    // Single task row HTML
    function createTodoTaskRow(t) {
        const isCompleted = t.Status === 'Completed';
        const txtClass = isCompleted
            ? 'text-decoration-line-through text-muted'
            : '';
        return `
            <tr data-task-id="${t.Id}">
                <td>
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-2 task-checkbox"
                               data-task-id="${t.Id}" ${isCompleted ? 'checked' : ''}>
                        <div class="flex-grow-1">
                            <div class="fw-bold ${txtClass}">${escapeHtml(t.Title)}</div>
                            ${t.Description
                ? `<small class="${txtClass}">${escapeHtml(t.Description)}</small>`
                : ''}
                        </div>
                    </div>
                </td>
                <td><span class="badge ${getBadgeClass(t.Priority, 'priority')}">${t.Priority}</span></td>
                <td><span class="badge ${getBadgeClass(t.Status, 'status')}">${t.Status}</span></td>
                <td><small class="text-muted">${formatTodoDate(t.DueDate)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editTodoTask(${t.Id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTodoTask(${t.Id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    }

    // Apply Upcoming/Today/Calendar filters
    function applyGeneralFilter(type) {
        // Reset text/status/priority filters
        currentTodoFilter = { status: null, priority: null, searchTerm: null };
        $('.status-btn, .priority-btn').removeClass('active');
        $('#searchInput').val('');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = [];
        if (type === 'upcoming') {
            filtered = todoTasks.filter(t => new Date(t.DueDate) > today);
        } else if (type === 'today') {
            filtered = todoTasks.filter(t => {
                const d = new Date(t.DueDate);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });
        } else if (type === 'calendar') {
            const input = prompt('Enter a date (YYYY-MM-DD):', today.toISOString().slice(0, 10));
            const sel = new Date(input);
            if (isNaN(sel)) { showTodoAlert('Invalid date', 'warning'); return; }
            sel.setHours(0, 0, 0, 0);
            filtered = todoTasks.filter(t => {
                const d = new Date(t.DueDate);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === sel.getTime();
            });
        }
        showTodoAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} filter applied`, 'info');
        renderTaskTable(filtered);
    }

    function clearGeneralFilters() {
        $('.filter-btn').removeClass('active');
    }

    // Quick add new task
    window.quickAddTodoTask = function () {
        const input = $('#quickAddInput');
        const title = (input.val() || '').trim();
        if (!title) { showTodoAlert('Enter a title', 'warning'); input.focus(); return; }
        if (title.length > 100) { showTodoAlert('Max 100 chars', 'warning'); return; }
        if (!/^[a-zA-Z0-9\s]*$/.test(title)) { showTodoAlert('No special chars', 'warning'); return; }

        const task = {
            Id: 0,
            Title: title,
            Description: '',
            Priority: 'Normal',
            Status: 'Pending',
            DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        };
        createTodoTask(task, success => {
            if (success) {
                input.val('');
                loadAllTodos();
            }
        });
    };

    // Edit task
    window.editTodoTask = function (id) {
        editingTodoTaskId = id;
        const t = todoTasks.find(x => x.Id === id);
        if (t) {
            populateTodoTaskForm(t);
            $('#taskModalLabel').html('<i class="fas fa-edit me-2"></i>Edit Task');
            $('#saveTaskBtn').html('<i class="fas fa-save me-1"></i>Update Task');
            $('#taskModal').modal('show');
        }
    };

    // Save (create/update) task
    function saveTodoTask() {
        const form = $('#taskForm');
        const model = {
            Id: parseInt($('#taskId').val()) || 0,
            Title: $('#taskTitle').val().trim(),
            Description: $('#taskDescription').val().trim(),
            Priority: $('#taskPriority').val(),
            Status: $('#taskStatus').val(),
            DueDate: $('#taskDueDate').val()
        };
        if (!validateTodoTaskForm(model)) return;

        const url = model.Id > 0 ? '/Todo/UpdateTask' : '/Todo/CreateTask';
        const btn = $('#saveTaskBtn'), txt = btn.html();
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Saving...');
        $.ajax({
            url, type: 'POST', headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            contentType: 'application/json', data: JSON.stringify(model)
        })
            .done(res => {
                if (res.success) {
                    $('#taskModal').modal('hide');
                    loadAllTodos();
                    showTodoAlert(res.message, 'success');
                } else showTodoTaskFormErrors(res.errors || [res.message]);
            })
            .fail(() => showTodoAlert('Error saving', 'danger'))
            .always(() => btn.prop('disabled', false).html(txt));
    }

    // Delete task
    window.deleteTodoTask = function (id) {
        if (!confirm('Delete this task?')) return;
        $.ajax({ url: '/Todo/DeleteTask', type: 'POST', headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() }, data: { id } })
            .done(res => {
                if (res.success) { loadAllTodos(); showTodoAlert(res.message, 'success'); }
                else showTodoAlert(res.message, 'danger');
            })
            .fail(() => showTodoAlert('Error deleting', 'danger'));
    };

    // Toggle status
    window.toggleTodoTaskStatus = function (id, completed) {
        const status = completed ? 'Completed' : 'Pending';
        $.ajax({
            url: '/Todo/UpdateTaskStatus', type: 'POST',
            headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            data: { id, status }
        })
            .done(res => {
                if (res.success) loadAllTodos();
                else showTodoAlert('Error updating status', 'danger');
            })
            .fail(() => showTodoAlert('Error updating status', 'danger'));
    };

    // Populate form for edit
    function populateTodoTaskForm(t) {
        $('#taskId').val(t.Id);
        $('#taskTitle').val(t.Title);
        $('#taskDescription').val(t.Description);
        $('#taskPriority').val(t.Priority);
        $('#taskStatus').val(t.Status);
        $('#taskDueDate').val(t.DueDate.split('T')[0]);
    }

    // Reset form
    function resetTodoTaskForm() {
        $('#taskForm')[0].reset();
        $('#taskId').val(0);
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').hide();
        $('#taskAlert').addClass('d-none');
        initializeTodoPage();
    }

    // Create/update via AJAX
    function createTodoTask(task, cb) {
        $.ajax({
            url: '/Todo/CreateTask', type: 'POST',
            headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            contentType: 'application/json', data: JSON.stringify(task)
        })
            .done(res => cb(res.success))
            .fail(() => cb(false));
    }

    // Helpers: formatting, badges, validation, alerts, tooltips, debounce

    function getBadgeClass(val, type) {
        if (type === 'priority') {
            return val === 'High' ? 'bg-danger' : val === 'Low' ? 'bg-info' : 'bg-secondary';
        } else {
            return val === 'Completed' ? 'bg-success' : val === 'Hold' ? 'bg-warning text-dark' : 'bg-primary';
        }
    }
    function formatTodoDate(d) { const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    function escapeHtml(t) { const e = document.createElement('div'); e.textContent = t; return e.innerHTML; }

    function validateTodoTaskForm(m) {
        let ok = true;
        // Clear previous validation states
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').hide();
        // TITLE VALIDATION
        const title = m.Title || '';
        if (title.trim() === '') {
            $('#taskTitle').addClass('is-invalid');
            $('#titleError').text('Title is required').show();
            ok = false;
        }
        else if (title.length > 100) {
            $('#taskTitle').addClass('is-invalid');
            $('#titleError').text('Title cannot exceed 100 characters').show();
            ok = false;
        }
        else {
            // Find invalid characters (anything not a letter, digit, or space)
            const invalidChars = title.match(/[^a-zA-Z0-9 ]/g);
            if (invalidChars) {
                // Remove duplicates
                const unique = [...new Set(invalidChars)].join(', ');
                $('#taskTitle').addClass('is-invalid');
                $('#titleError')
                    .text(`Invalid character${invalidChars.length > 1 ? 's' : ''}: ${unique}`)
                    .show();
                ok = false;
            }
        }
        // DESCRIPTION VALIDATION
        if (m.Description) {
            const desc = m.Description;
            if (desc.length > 500) {
                $('#taskDescription').addClass('is-invalid');
                $('#descriptionError').text('Description cannot exceed 500 characters').show();
                ok = false;
            }
        }
        // DUE DATE VALIDATION
        if (!m.DueDate) {
            $('#taskDueDate').addClass('is-invalid');
            $('#dueDateError').text('Due date is required').show();
            ok = false;
        }
        return ok;
    }


    function showTodoTaskFormErrors(errs) {
        let html = 'Please fix errors:<br>';
        errs.forEach(e => html += '• ' + e + '<br>');
        $('#taskAlert').removeClass('d-none alert-info').addClass('alert-danger').html(html);
    }

    function showTodoAlert(msg, type) {
        const id = 'alert-' + Date.now();
        const el = $(`<div id="${id}" class="alert alert-${type} alert-dismissible position-fixed" style="top:1rem;right:1rem;z-index:9999;">
            ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`);
        $('body').append(el);
        setTimeout(() => el.alert('close'), 5000);
    }

    function initializeTooltips() {
        $('[data-bs-toggle="tooltip"]').tooltip('dispose');
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    function setupAntiForgeryToken() {
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (token) $.ajaxSetup({ beforeSend: xhr => xhr.setRequestHeader('RequestVerificationToken', token) });
    }

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function showTodoLoading(flag) {
        flag ? $('#loadingSpinner').removeClass('d-none') : $('#loadingSpinner').addClass('d-none');
    }

    function updateTodoTaskCount(c) {
        $('#taskCount').text(`${c} task${c !== 1 ? 's' : ''}`);
    }

    // Expose refresh
    window.refreshTodos = () => { clearGeneralFilters(); displayFilteredTasks(); }
})();
