using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface ITodoTaskRepository
    {
        Task<IEnumerable<TodoTask>> GetAllAsync();
        Task<TodoTask?> GetByIdAsync(int id);
        Task<int> CreateAsync(TodoTask task);
        Task<bool> UpdateAsync(TodoTask task);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<IEnumerable<TodoTask>> FilterTasksAsync(string? status, string? priority, string? searchTerm);
    }
}