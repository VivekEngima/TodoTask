using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.Models;
using TodoTaskApp.IServices;
using System.Diagnostics;

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

        // Main Index page - FIXED: Added IActionResult return type
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
    }


}