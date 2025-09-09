using Microsoft.AspNetCore.Mvc;

namespace TodoTaskApp.Models
{
    public class DashboardViewModel
    {
        public int TotalTasks { get; set; }
        public int UpcomingTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OnHoldTasks { get; set; }

        public decimal CompletedPercentage => TotalTasks > 0 ? Math.Round((decimal)CompletedTasks / TotalTasks * 100, 1) : 0;
        public decimal PendingPercentage => TotalTasks > 0 ? Math.Round((decimal)PendingTasks / TotalTasks * 100, 1) : 0;
        public decimal OnHoldPercentage => TotalTasks > 0 ? Math.Round((decimal)OnHoldTasks / TotalTasks * 100, 1) : 0;

        // Priority Distribution
        public int HighPriorityTasks { get; set; }
        public int NormalPriorityTasks { get; set; }
        public int LowPriorityTasks { get; set; }

        public decimal HighPriorityPercentage => TotalTasks > 0 ? Math.Round((decimal)HighPriorityTasks / TotalTasks * 100, 1) : 0;
        public decimal NormalPriorityPercentage => TotalTasks > 0 ? Math.Round((decimal)NormalPriorityTasks / TotalTasks * 100, 1) : 0;
        public decimal LowPriorityPercentage => TotalTasks > 0 ? Math.Round((decimal)LowPriorityTasks / TotalTasks * 100, 1) : 0;

        // Monthly Daily Task Creation (1 month before and after today)
        public List<DailyTaskData> MonthlyTaskCreation { get; set; } = new();
    }

    public class DailyTaskData
    {
        public string DateLabel { get; set; } = string.Empty; // "Sep 1", "Sep 2", etc.
        public int TasksCreated { get; set; }
        public DateTime Date { get; set; }
    }
}
