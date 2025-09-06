namespace TodoTaskApp.Models
{
    public class FilterViewModel
    {
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? SearchTerm { get; set; }

        public List<string> StatusOptions { get; set; } = new List<string> { "All", "Pending", "Hold", "Completed" };
        public List<string> PriorityOptions { get; set; } = new List<string> { "All", "Low", "Normal", "High" };
    }
}