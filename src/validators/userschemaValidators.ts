import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string({ message: "Please write User Name" })
    .min(4, "Name should be a 4 characters"),
  email: z.string({ message: "Email should be a string" }).email(),
  externalId: z
    .string({ message: "External ID should be a string" })
    .min(1, "External ID is required"),
  image: z.string().url("Invalid image URL").optional(), // If image URLs are stored
});
