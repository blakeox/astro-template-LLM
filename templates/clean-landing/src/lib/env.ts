import { z } from "zod";

const envSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  PUBLIC_SITE_NAME: z.string().default("Example Co."),
});

export const env = envSchema.parse(process.env);