using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.IServices;

namespace TodoTaskApp.Controllers
{
    public class DashboardController : Controller
    {
        private readonly ITodoTaskService _todoTaskService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ITodoTaskService todoTaskService, ILogger<DashboardController> logger)
        {
            _todoTaskService = todoTaskService;
            _logger = logger;
        }

        // Dashboard main page
        public IActionResult Index()
        {
            return View();
        }

        // API endpoint for dashboard statistics
        [HttpGet]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var statistics = await _todoTaskService.GetDashboardStatisticsAsync();
                return Json(new { success = true, data = statistics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard statistics");
                return Json(new { success = false, message = "Error loading dashboard statistics" });
            }
        }
    }
}
