import { z } from "zod";

// Goal categories
export const goalCategories = [
  "Emergency Fund",
  "Vacation",
  "New Car",
  "Home Purchase",
  "Education",
  "Wedding",
  "Other",
] as const;

// Priority levels
export const goalPriorities = ["High", "Medium", "Low"] as const;

// Goal colors
export const goalColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-pink-500",
] as const;

// Schema for creating a new goal
export const createGoalSchema = z.object({
  name: z
    .string()
    .min(2, "Goal name must be at least 2 characters")
    .max(80, "Goal name must be at most 80 characters")
    .trim(),
  target: z
    .number({ message: "Target amount must be a number" })
    .positive("Target amount must be greater than zero"),
  category: z.enum(goalCategories, {
    message: "Please select a valid category",
  }),
  priority: z.enum(goalPriorities, {
    message: "Please select a valid priority",
  }),
  deadline: z.string().min(1, "Deadline is required"),
  color: z.enum(goalColors, {
    message: "Please select a color",
  }),
});

// Schema for updating a goal (all fields optional)
export const updateGoalSchema = createGoalSchema.partial();

// TypeScript types
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
