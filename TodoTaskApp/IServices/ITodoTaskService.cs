using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITodoTaskService
    {
        Task<IEnumerable<TodoTaskViewModal>> GetAllTasksAsync();
        Task<TodoTaskViewModal?> GetTaskByIdAsync(int id);
        Task<int> CreateTaskAsync(TodoTaskViewModal model);
        Task<bool> UpdateTaskAsync(TodoTaskViewModal model);
        Task<bool> DeleteTaskAsync(int id);
        Task<bool> UpdateTaskStatusAsync(int id, string status);
        Task<IEnumerable<TodoTaskViewModal>> FilterTasksAsync(FilterViewModel filter);
        FilterViewModel GetFilterOptions();
    }
}