using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TodoTaskService : ITodoTaskService
    {
        private readonly ITodoTaskRepository _repository;

        public TodoTaskService(ITodoTaskRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<TodoTaskViewModel>> GetAllTasksAsync()
        {
            var tasks = await _repository.GetAllAsync();
            return tasks.Select(MapToViewModel);
        }

        public async Task<TodoTaskViewModel?> GetTaskByIdAsync(int id)
        {
            var task = await _repository.GetByIdAsync(id);
            return task != null ? MapToViewModel(task) : null;
        }

        public async Task<int> CreateTaskAsync(TodoTaskViewModel model)
        {
            var task = MapToEntity(model);
            return await _repository.CreateAsync(task);
        }

        public async Task<bool> UpdateTaskAsync(TodoTaskViewModel model)
        {
            var task = MapToEntity(model);
            return await _repository.UpdateAsync(task);
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }

        public async Task<bool> UpdateTaskStatusAsync(int id, string status)
        {
            return await _repository.UpdateStatusAsync(id, status);
        }

        public async Task<IEnumerable<TodoTaskViewModel>> FilterTasksAsync(FilterViewModel filter)
        {
            var tasks = await _repository.FilterTasksAsync(filter.Status, filter.Priority, filter.SearchTerm);
            return tasks.Select(MapToViewModel);
        }

        public FilterViewModel GetFilterOptions()
        {
            return new FilterViewModel();
        }

        private TodoTaskViewModel MapToViewModel(TodoTask task)
        {
            return new TodoTaskViewModel
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,
                DueDate = task.DueDate,
                CreatedDate = task.CreatedDate,
                UpdatedDate = task.UpdatedDate,
                CompletedDate = task.CompletedDate
            };
        }

        private TodoTask MapToEntity(TodoTaskViewModel model)
        {
            return new TodoTask
            {
                Id = model.Id,
                Title = model.Title,
                Description = model.Description,
                Priority = model.Priority,
                Status = model.Status,
                DueDate = model.DueDate,
                CreatedDate = model.CreatedDate,
                UpdatedDate = model.UpdatedDate,
                CompletedDate = model.CompletedDate
            };
        }

        public async Task<DashboardViewModel> GetDashboardStatisticsAsync()
        {
            var allTasks = await _repository.GetAllAsync();
            var today = DateTime.Now.Date;

            var dashboard = new DashboardViewModel
            {
                TotalTasks = allTasks.Count(),
                CompletedTasks = allTasks.Count(t => t.Status == "Completed"),
                PendingTasks = allTasks.Count(t => t.Status == "Pending"),
                OnHoldTasks = allTasks.Count(t => t.Status == "Hold"),
                UpcomingTasks = allTasks.Count(t => t.DueDate.Date > today && t.Status != "Completed"),
                HighPriorityTasks = allTasks.Count(t => t.Priority == "High"),
                NormalPriorityTasks = allTasks.Count(t => t.Priority == "Normal"),
                LowPriorityTasks = allTasks.Count(t => t.Priority == "Low")
            };

            // Calculated daily task creation for 1 month before and after today (2 months total)
            var oneMonthBefore = today.AddMonths(-1);
            var oneMonthAfter = today.AddMonths(1);
            var dailyData = new List<DailyTaskData>();

            // Generate data for each day in the 2-month period
            for (var date = oneMonthBefore; date <= oneMonthAfter; date = date.AddDays(1))
            {
                var tasksCreatedThisDay = allTasks.Count(t => t.CreatedDate.Date == date);

                // Only add days with tasks or show every 3rd day to avoid overcrowding
                if (tasksCreatedThisDay > 0 || date.Day % 3 == 1)
                {
                    dailyData.Add(new DailyTaskData
                    {
                        DateLabel = date.ToString("MMM d"),
                        TasksCreated = tasksCreatedThisDay,
                        Date = date
                    });
                }
            }

            dashboard.MonthlyTaskCreation = dailyData;
            return dashboard;
        }
    }
}