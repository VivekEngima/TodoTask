using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Controllers
{
    public class TodoController : Controller
    {
        private readonly ITodoTaskService _todoTaskService;
        private readonly ILogger<TodoController> _logger;

        public TodoController(ITodoTaskService todoTaskService, ILogger<TodoController> logger)
        {
            _todoTaskService = todoTaskService;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                var tasks = await _todoTaskService.GetAllTasksAsync();
                var filterModel = _todoTaskService.GetFilterOptions();

                ViewBag.Tasks = tasks;
                ViewBag.Filter = filterModel;

                return View(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading todo tasks");
                return View(new List<TodoTaskViewModel>());
            }
        }

        // AJAX: Get all tasks
        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            try
            {
                var tasks = await _todoTaskService.GetAllTasksAsync();
                return Json(new { success = true, data = tasks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks");
                return Json(new { success = false, message = "Error retrieving tasks" });
            }
        }

        // AJAX: Get task by ID
        [HttpGet]
        public async Task<IActionResult> GetTask(int id)
        {
            try
            {
                var task = await _todoTaskService.GetTaskByIdAsync(id);
                if (task == null)
                    return Json(new { success = false, message = "Task not found" });

                return Json(new { success = true, data = task });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task {TaskId}", id);
                return Json(new { success = false, message = "Error retrieving task" });
            }
        }

        // AJAX: Create new task - FIXED: Using correct TodoTaskViewModel
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateTask([FromBody] TodoTaskViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return Json(new { success = false, message = "Validation failed", errors = errors });
                }

                var taskId = await _todoTaskService.CreateTaskAsync(model);

                if (taskId > 0)
                {
                    var newTask = await _todoTaskService.GetTaskByIdAsync(taskId);
                    return Json(new { success = true, data = newTask, message = "Task created successfully" });
                }

                return Json(new { success = false, message = "Failed to create task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return Json(new { success = false, message = "Error creating task" });
            }
        }

        // AJAX: Update task - FIXED: Using correct TodoTaskViewModel
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateTask([FromBody] TodoTaskViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return Json(new { success = false, message = "Validation failed", errors = errors });
                }

                var success = await _todoTaskService.UpdateTaskAsync(model);

                if (success)
                {
                    var updatedTask = await _todoTaskService.GetTaskByIdAsync(model.Id);
                    return Json(new { success = true, data = updatedTask, message = "Task updated successfully" });
                }

                return Json(new { success = false, message = "Failed to update task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", model.Id);
                return Json(new { success = false, message = "Error updating task" });
            }
        }

        // AJAX: Delete task
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var success = await _todoTaskService.DeleteTaskAsync(id);

                if (success)
                    return Json(new { success = true, message = "Task deleted successfully" });

                return Json(new { success = false, message = "Failed to delete task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", id);
                return Json(new { success = false, message = "Error deleting task" });
            }
        }

        // AJAX: Update task status
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateTaskStatus(int id, string status)
        {
            try
            {
                var success = await _todoTaskService.UpdateTaskStatusAsync(id, status);

                if (success)
                {
                    var updatedTask = await _todoTaskService.GetTaskByIdAsync(id);
                    return Json(new { success = true, data = updatedTask, message = "Task status updated successfully" });
                }

                return Json(new { success = false, message = "Failed to update task status" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status {TaskId}", id);
                return Json(new { success = false, message = "Error updating task status" });
            }
        }

        // AJAX: Filter tasks
        [HttpPost]
        public async Task<IActionResult> FilterTasks([FromBody] FilterViewModel filter)
        {
            try
            {
                var tasks = await _todoTaskService.FilterTasksAsync(filter);
                return Json(new { success = true, data = tasks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering tasks");
                return Json(new { success = false, message = "Error filtering tasks" });
            }
        }

        // AJAX: Get filter options
        [HttpGet]
        public IActionResult GetFilterOptions()
        {
            try
            {
                var filter = _todoTaskService.GetFilterOptions();
                return Json(new { success = true, data = filter });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filter options");
                return Json(new { success = false, message = "Error getting filter options" });
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
        // Export tasks to CSV
        [HttpGet]
        public async Task<IActionResult> ExportTasks()
        {
            try
            {
                var tasks = await _todoTaskService.GetAllTasksAsync();

                var csv = new StringBuilder();
                csv.AppendLine("Title,Description,Priority,Status,DueDate,CreatedDate");

                foreach (var task in tasks)
                {
                    csv.AppendLine($"\"{task.Title}\",\"{task.Description ?? ""}\",\"{task.Priority}\",\"{task.Status}\",\"{task.DueDate:yyyy-MM-dd}\",\"{task.CreatedDate:yyyy-MM-dd}\"");
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                var fileName = $"TodoTasks_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting tasks");
                return Json(new { success = false, message = "Error exporting tasks" });
            }
        }

        // Import tasks from CSV
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ImportTasks(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return Json(new { success = false, message = "Please select a file" });

                if (!Path.GetExtension(file.FileName).Equals(".csv", StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Only CSV files are supported" });

                var tasks = new List<TodoTaskViewModel>();

                using var reader = new StreamReader(file.OpenReadStream());
                var line = await reader.ReadLineAsync(); // Skip header

                int lineNumber = 1;
                var errors = new List<string>();

                while ((line = await reader.ReadLineAsync()) != null)
                {
                    lineNumber++;
                    try
                    {
                        var values = ParseCsvLine(line);

                        if (values.Length < 5)
                        {
                            errors.Add($"Line {lineNumber}: Insufficient columns");
                            continue;
                        }

                        var task = new TodoTaskViewModel
                        {
                            Title = values[0]?.Trim().Trim('"') ?? "",
                            Description = values[1]?.Trim().Trim('"'),
                            Priority = values[2]?.Trim().Trim('"') ?? "Normal",
                            Status = values[3]?.Trim().Trim('"') ?? "Pending",
                            DueDate = DateTime.TryParse(values[4]?.Trim().Trim('"'), out var dueDate)
                                ? dueDate : DateTime.Now.AddDays(7)
                        };

                        // Validate
                        if (string.IsNullOrEmpty(task.Title))
                        {
                            errors.Add($"Line {lineNumber}: Title is required");
                            continue;
                        }

                        if (!new[] { "High", "Normal", "Low" }.Contains(task.Priority))
                            task.Priority = "Normal";

                        if (!new[] { "Pending", "Hold", "Completed" }.Contains(task.Status))
                            task.Status = "Pending";

                        tasks.Add(task);
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Line {lineNumber}: {ex.Message}");
                    }
                }

                // Import valid tasks
                int imported = 0;
                foreach (var task in tasks)
                {
                    var taskId = await _todoTaskService.CreateTaskAsync(task);
                    if (taskId > 0) imported++;
                }

                var message = $"Successfully imported {imported} tasks";
                if (errors.Any())
                    message += $". {errors.Count} errors occurred";

                return Json(new
                {
                    success = true,
                    message = message,
                    imported = imported,
                    errors = errors.Take(5) // Return first 5 errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing tasks");
                return Json(new { success = false, message = "Error importing file" });
            }
        }

        // Helper method to parse CSV line
        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            var inQuotes = false;
            var current = new StringBuilder();

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            result.Add(current.ToString());
            return result.ToArray();
        }
    }
}