import { z } from "zod";

// Goal categories — match the chip set in the Mobile UI mock so the same
// labels round-trip between web and mobile. Order matters: the picker
// renders chips in this order.
export const goalCategories = [
  "Emergency",
  "Travel",
  "House",
  "Vehicle",
  "Gadget",
  "Gift",
  "Education",
  "Other",
] as const;

// Priority levels
export const goalPriorities = ["High", "Medium", "Low"] as const;

// Goal colors. Hex values shared with the mobile AccountSheet's CARD_COLORS
// so the same picker palette works across goals and accounts.
export const goalColors = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#a855f7", // purple
  "#ec4899", // pink
  "#3b82f6", // blue
] as const;

// Accept any well-formed hex string. We don't restrict to the curated
// palette so older docs with custom colors keep validating.
const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid color");

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
  priority: z
    .enum(goalPriorities, { message: "Please select a valid priority" })
    .default("Medium"),
  deadline: z.string().min(1, "Deadline is required"),
  color: hexColor,
});

// Schema for updating a goal (all fields optional)
export const updateGoalSchema = createGoalSchema.partial();

// TypeScript types
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
