using System.ComponentModel.DataAnnotations;

namespace TodoTaskApp.Models
{
    public class TodoTask
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
        [RegularExpression(@"^[a-zA-Z0-9\s]*$", ErrorMessage = "Title cannot contain special characters")]
        public string Title { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        [RegularExpression(@"^[a-zA-Z0-9\s]*$", ErrorMessage = "Description cannot contain special characters")]
        public string? Description { get; set; }

        [Required]
        public string Priority { get; set; } = "Normal";

        [Required]
        public string Status { get; set; } = "Pending";

        [Required]
        public DateTime DueDate { get; set; } = DateTime.Now.AddDays(7);

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        public DateTime? CompletedDate { get; set; }
    }
}