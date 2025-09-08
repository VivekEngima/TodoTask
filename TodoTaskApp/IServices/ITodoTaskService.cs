using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITodoTaskService
    {
        Task<IEnumerable<TodoTaskViewModel>> GetAllTasksAsync();
        Task<TodoTaskViewModel?> GetTaskByIdAsync(int id);
        Task<int> CreateTaskAsync(TodoTaskViewModel model);
        Task<bool> UpdateTaskAsync(TodoTaskViewModel model);
        Task<bool> DeleteTaskAsync(int id);
        Task<bool> UpdateTaskStatusAsync(int id, string status);
        Task<IEnumerable<TodoTaskViewModel>> FilterTasksAsync(FilterViewModel filter);
        FilterViewModel GetFilterOptions();

        Task<DashboardViewModel> GetDashboardStatisticsAsync();
    }
}