import {z} from "zod"
import dotenv from "dotenv"
dotenv.config()

const schema=z.object({
    PORT:z.string().default("3000"),
    NODE_ENV: z.string().default("development"),
    DATABASE_URL:z.string(),
    REDIS_URL:z.string(),
    ANTHROPIC_API_KEY:z.string(),
    JWT_SECRET: z.string(),
    SENTRY_DSN: z.string().optional(),
    UPLOAD_DIR: z.string().default("./uploads"),
    REPORTS_DIR:z.string().default("./reports") 
})

export const config=schema.parse(process.env);


