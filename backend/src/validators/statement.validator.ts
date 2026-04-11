import { z } from "zod"

export const createApplicantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format. Example: ABCDE1234F")
    .toUpperCase(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  agentId: z.string().min(1, "Agent ID is required"),
})

export const uploadStatementSchema = z.object({
 bank: z.enum(["hdfc", "sbi", "icici"], {
  message: "Bank must be hdfc, sbi, or icici",
}),
  periodStart: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date")
    .transform((val) => new Date(val)),
  periodEnd: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date")
    .transform((val) => new Date(val)),
  months: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1, "Minimum 1 month").max(24, "Maximum 24 months")),
  applicantId: z.string().uuid("Invalid applicant ID").optional(),
})

export const newApplicantUploadSchema = createApplicantSchema.merge(
  uploadStatementSchema.omit({ applicantId: true })
)

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>
export type UploadStatementInput = z.infer<typeof uploadStatementSchema>
export type NewApplicantUploadInput = z.infer<typeof newApplicantUploadSchema>