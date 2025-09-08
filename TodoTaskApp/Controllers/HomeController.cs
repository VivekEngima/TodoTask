using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using TodoTaskApp.Models;

namespace TodoTaskApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        // Automatically redirect to Todo application
        public IActionResult Index()
        {
            return RedirectToAction("Index", "Todo");
        }

        // Alternative: Show a welcome page with navigation to Todo app
        //public IActionResult Index()
        //{
        //    return View();
        //}

        // 

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}