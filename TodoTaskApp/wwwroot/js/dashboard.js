(function () {
    // Global variables
    let weeklyChart = null;
    let priorityChart = null;
    let statusChart = null;

    // Initialize dashboard when DOM is ready
    $(document).ready(function () {
        initializeDashboard();
        setupAntiForgeryToken();
    });

    // Dashboard initialization
    async function initializeDashboard() {
        try {
            showLoading();
            await loadDashboardStatistics();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError();
        }
    }

    // Show loading state
    function showLoading() {
        $('#loadingSpinner').removeClass('d-none');
        $('#dashboardContent').addClass('d-none');
        $('#errorMessage').addClass('d-none');
    }

    // Show error state
    function showError() {
        $('#loadingSpinner').addClass('d-none');
        $('#dashboardContent').addClass('d-none');
        $('#errorMessage').removeClass('d-none');
    }

    // Show dashboard content
    function showDashboard() {
        $('#loadingSpinner').addClass('d-none');
        $('#errorMessage').addClass('d-none');
        $('#dashboardContent').removeClass('d-none');
    }

    // Load dashboard statistics via AJAX
    async function loadDashboardStatistics() {
        try {
            const response = await $.ajax({
                url: '/Dashboard/GetStatistics',
                type: 'GET',
                cache: false
            });

            if (response.success) {
                populateStatistics(response.data);
                createCharts(response.data);
                showDashboard();
            } else {
                console.error('Error from server:', response.message);
                showError();
            }
        } catch (error) {
            console.error('AJAX error:', error);
            showError();
        }
    }

    // Populate statistics cards with data
    function populateStatistics(data) {
        // Animate numbers counting up
        animateNumber('#totalTasksCount', 0, data.TotalTasks, 1000);
        animateNumber('#upcomingTasksCount', 0, data.UpcomingTasks, 1200);

        // Update percentages
        $('#completedPercentage').text(data.CompletedPercentage + '%');
        $('#pendingPercentage').text(data.PendingPercentage + '%');

        // Update progress bars with animation
        setTimeout(() => {
            $('#completedProgressBar').css('width', data.CompletedPercentage + '%');
            $('#pendingProgressBar').css('width', data.PendingPercentage + '%');
        }, 500);

        // Update priority counts and percentages
        $('#highPriorityCount').text(data.HighPriorityTasks);
        $('#normalPriorityCount').text(data.NormalPriorityTasks);
        $('#lowPriorityCount').text(data.LowPriorityTasks);

        $('#highPriorityPercentage').text(data.HighPriorityPercentage + '%');
        $('#normalPriorityPercentage').text(data.NormalPriorityPercentage + '%');
        $('#lowPriorityPercentage').text(data.LowPriorityPercentage + '%');

        // Update status counts and percentages
        $('#pendingTasksCount').text(data.PendingTasks);
        $('#holdTasksCount').text(data.OnHoldTasks);
        $('#completedTasksCount').text(data.CompletedTasks);

        $('#pendingTasksPercentage').text(data.PendingPercentage + '%');
        $('#holdTasksPercentage').text(data.OnHoldPercentage + '%');
        $('#completedTasksPercentage').text(data.CompletedPercentage + '%');
    }

    // Create all charts
    function createCharts(data) {
        createWeeklyChart(data.WeeklyTaskCreation);
        createPriorityChart(data);
        createStatusChart(data);
    }

    // Create weekly task creation line chart
    function createWeeklyChart(weeklyData) {
        const ctx = document.getElementById('weeklyChart').getContext('2d');

        // Destroy existing chart if exists
        if (weeklyChart) {
            weeklyChart.destroy();
        }

        weeklyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.map(w => w.WeekLabel),
                datasets: [{
                    label: 'Tasks Created',
                    data: weeklyData.map(w => w.TasksCreated),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                return `Tasks Created: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#6c757d'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Create priority distribution donut chart
    function createPriorityChart(data) {
        const ctx = document.getElementById('priorityChart').getContext('2d');

        // Destroy existing chart if exists
        if (priorityChart) {
            priorityChart.destroy();
        }

        priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Priority', 'Normal Priority', 'Low Priority'],
                datasets: [{
                    data: [data.HighPriorityTasks, data.NormalPriorityTasks, data.LowPriorityTasks],
                    backgroundColor: ['#dc3545', '#6c757d', '#0dcaf0'],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                const percentage = data.TotalTasks > 0 ?
                                    Math.round((context.parsed / data.TotalTasks) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Create status distribution donut chart
    function createStatusChart(data) {
        const ctx = document.getElementById('statusChart').getContext('2d');

        // Destroy existing chart if exists
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Hold', 'Completed'],
                datasets: [{
                    data: [data.PendingTasks, data.OnHoldTasks, data.CompletedTasks],
                    backgroundColor: ['#0d6efd', '#ffc107', '#198754'],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                const percentage = data.TotalTasks > 0 ?
                                    Math.round((context.parsed / data.TotalTasks) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Animate number counting up
    function animateNumber(selector, start, end, duration) {
        const element = $(selector);
        const increment = (end - start) / (duration / 16); // ~60fps
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.text(Math.floor(current));
        }, 16);
    }

    // Setup anti-forgery token for AJAX requests
    function setupAntiForgeryToken() {
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (token) {
            $.ajaxSetup({
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('RequestVerificationToken', token);
                }
            });
        }
    }

    // Expose refresh function globally if needed
    window.refreshDashboard = function () {
        initializeDashboard();
    };

})();
