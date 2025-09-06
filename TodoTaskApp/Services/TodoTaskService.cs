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

        public async Task<IEnumerable<TodoTaskViewModal>> GetAllTasksAsync()
        {
            var tasks = await _repository.GetAllAsync();
            return tasks.Select(MapToViewModel);
        }

        public async Task<TodoTaskViewModal?> GetTaskByIdAsync(int id)
        {
            var task = await _repository.GetByIdAsync(id);
            return task != null ? MapToViewModel(task) : null;
        }

        public async Task<int> CreateTaskAsync(TodoTaskViewModal model)
        {
            var task = MapToEntity(model);
            return await _repository.CreateAsync(task);
        }

        public async Task<bool> UpdateTaskAsync(TodoTaskViewModal model)
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

        public async Task<IEnumerable<TodoTaskViewModal>> FilterTasksAsync(FilterViewModel filter)
        {
            var tasks = await _repository.FilterTasksAsync(filter.Status, filter.Priority, filter.SearchTerm);
            return tasks.Select(MapToViewModel);
        }

        public FilterViewModel GetFilterOptions()
        {
            return new FilterViewModel();
        }

        private TodoTaskViewModal MapToViewModel(TodoTask task)
        {
            return new TodoTaskViewModal
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

        private TodoTask MapToEntity(TodoTaskViewModal model)
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
    }
}