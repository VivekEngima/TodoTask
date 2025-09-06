using Dapper;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class TodoTaskRepository : ITodoTaskRepository
    {
        private readonly DapperContext _context;

        public TodoTaskRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TodoTask>> GetAllAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TodoTask>(
                "sp_GetAllTasks",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<TodoTask?> GetByIdAsync(int id)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<TodoTask>(
                "sp_GetTaskById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateAsync(TodoTask task)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Title", task.Title);
            parameters.Add("@Description", task.Description);
            parameters.Add("@Priority", task.Priority);
            parameters.Add("@Status", task.Status);
            parameters.Add("@DueDate", task.DueDate);

            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_InsertTask",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result;
        }

        public async Task<bool> UpdateAsync(TodoTask task)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Id", task.Id);
            parameters.Add("@Title", task.Title);
            parameters.Add("@Description", task.Description);
            parameters.Add("@Priority", task.Priority);
            parameters.Add("@Status", task.Status);
            parameters.Add("@DueDate", task.DueDate);

            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_UpdateTask",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_DeleteTask",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Id", id);
            parameters.Add("@Status", status);

            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_UpdateTaskStatus",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<IEnumerable<TodoTask>> FilterTasksAsync(string? status, string? priority, string? searchTerm)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Status", status == "All" ? null : status);
            parameters.Add("@Priority", priority == "All" ? null : priority);
            parameters.Add("@SearchTerm", string.IsNullOrEmpty(searchTerm) ? null : searchTerm);

            return await connection.QueryAsync<TodoTask>(
                "sp_FilterTasks",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}