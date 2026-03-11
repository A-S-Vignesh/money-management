import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  phoneNo: z
    .string()
    .regex(/^(\+?\d{7,15})?$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  currency: z
    .enum(["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"], {
      message: "Select a valid currency",
    })
    .optional(),
  lang: z
    .enum(["en", "hi", "ta", "te", "kn", "ml", "mr", "bn", "gu", "pa"], {
      message: "Select a valid language",
    })
    .optional(),
  notifications: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const currencies = [
  { value: "INR", label: "₹ INR — Indian Rupee" },
  { value: "USD", label: "$ USD — US Dollar" },
  { value: "EUR", label: "€ EUR — Euro" },
  { value: "GBP", label: "£ GBP — British Pound" },
  { value: "JPY", label: "¥ JPY — Japanese Yen" },
  { value: "AUD", label: "A$ AUD — Australian Dollar" },
  { value: "CAD", label: "C$ CAD — Canadian Dollar" },
] as const;

export const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "mr", label: "Marathi" },
  { value: "bn", label: "Bengali" },
  { value: "gu", label: "Gujarati" },
  { value: "pa", label: "Punjabi" },
] as const;
