(function () {
    // Global variables
    let monthlyChart = null;
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
        // Set numbers
        $('#totalTasksCount').text(data.TotalTasks);
        $('#upcomingTasksCount').text(data.UpcomingTasks);

        // Update percentages
        $('#completedPercentage').text(data.CompletedPercentage + '%');
        $('#pendingPercentage').text(data.PendingPercentage + '%');

        // Update progress bars 
        $('#completedProgressBar').css('width', data.CompletedPercentage + '%');
        $('#pendingProgressBar').css('width', data.PendingPercentage + '%');

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
        createMonthlyChart(data.MonthlyTaskCreation);
        createPriorityChart(data);
        createStatusPolarChart(data);
    }

    // Create monthly task creation line chart (1 month before and after today)
    function createMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');

        // Destroy existing chart if exists
        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.DateLabel),
                datasets: [{
                    label: 'Tasks Created',
                    data: monthlyData.map(d => d.TasksCreated),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
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
                            color: '#6c757d',
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: { size: 10 },
                            maxRotation: 45
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
                labels: ['High', 'Normal', 'Low'],
                datasets: [{
                    data: [data.HighPriorityTasks, data.NormalPriorityTasks, data.LowPriorityTasks],
                    backgroundColor: ['#dc3545', '#6c757d', '#0dcaf0'],
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
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
                        displayColors: false,
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

    // Create status distribution polar area chart
    function createStatusPolarChart(data) {
        const ctx = document.getElementById('statusChart').getContext('2d');

        // Destroy existing chart if exists
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Pending', 'Hold', 'Completed'],
                datasets: [{
                    data: [data.PendingTasks, data.OnHoldTasks, data.CompletedTasks],
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.7)',  // Blue for Pending
                        'rgba(255, 193, 7, 0.7)',   // Yellow for Hold
                        'rgba(25, 135, 84, 0.7)'    // Green for Completed
                    ],
                    borderColor: [
                        '#0d6efd',
                        '#ffc107',
                        '#198754'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        external: null, // Use default tooltip rendering
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        padding: 12,
                        caretPadding: 8,
                        callbacks: {
                            title: function (context) {
                                return context[0].label; // Show status name
                            },
                            label: function (context) {
                                const value = context.parsed;
                                const total = data.TotalTasks;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `Tasks: ${value} (${percentage}%)`;
                            },
                            labelColor: function (context) {
                                return {
                                    borderColor: context.dataset.borderColor[context.dataIndex],
                                    backgroundColor: context.dataset.backgroundColor[context.dataIndex]
                                };
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: Math.max(data.PendingTasks, data.OnHoldTasks, data.CompletedTasks) + 1,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#6c757d',
                            font: { size: 9 },
                            display: false,
                            backdropColor: 'transparent'
                        },
                        pointLabels: {
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#495057',
                            padding: 15
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
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
