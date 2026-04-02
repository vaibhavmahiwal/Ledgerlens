#!/bin/bash

echo "Setting up LedgerLens project structure..."

# Create all directories
mkdir -p src/api/routes
mkdir -p src/api/middleware
mkdir -p src/workers
mkdir -p src/queues
mkdir -p src/services/parser/banks
mkdir -p src/services/analysis
mkdir -p src/services/report
mkdir -p src/db/schema
mkdir -p src/db/migrations
mkdir -p src/validators
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/config
mkdir -p uploads
mkdir -p reports

echo "Directories created..."

# Create all files
touch src/api/routes/statements.ts
touch src/api/routes/reports.ts
touch src/api/routes/applicants.ts
touch src/api/middleware/correlationId.ts
touch src/api/middleware/errorHandler.ts
touch src/api/middleware/upload.ts
touch src/api/middleware/auth.ts
touch src/api/server.ts
touch src/workers/parser.worker.ts
touch src/workers/analysis.worker.ts
touch src/workers/report.worker.ts
touch src/queues/index.ts
touch src/queues/parser.queue.ts
touch src/queues/analysis.queue.ts
touch src/queues/report.queue.ts
touch src/services/parser/pdf.parser.ts
touch src/services/parser/csv.parser.ts
touch src/services/parser/banks/hdfc.ts
touch src/services/parser/banks/sbi.ts
touch src/services/parser/banks/icici.ts
touch src/services/analysis/claude.service.ts
touch src/services/analysis/prompt.ts
touch src/services/report/pdf.service.ts
touch src/db/schema/applicants.ts
touch src/db/schema/statements.ts
touch src/db/schema/transactions.ts
touch src/db/schema/jobs.ts
touch src/db/schema/reports.ts
touch src/db/index.ts
touch src/db/seed.ts
touch src/validators/statement.validator.ts
touch src/validators/claude.validator.ts
touch src/validators/applicant.validator.ts
touch src/lib/logger.ts
touch src/lib/sentry.ts
touch src/lib/redis.ts
touch src/lib/errors.ts
touch src/types/job.types.ts
touch src/types/transaction.types.ts
touch src/types/analysis.types.ts
touch src/config/index.ts
touch worker.ts
touch index.ts
touch drizzle.config.ts

echo "Files created..."

# Create .env.example
cat > .env.example << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://ledgerlens:ledgerlens@localhost:5432/ledgerlens

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic
ANTHROPIC_API_KEY=sk-ant-

# Sentry
SENTRY_DSN=

# Auth
JWT_SECRET=your-secret-here-change-in-production

# Storage
UPLOAD_DIR=./uploads
REPORTS_DIR=./reports
EOF

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ledgerlens
      POSTGRES_PASSWORD: ledgerlens
      POSTGRES_DB: ledgerlens
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "index.ts", "worker.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
uploads/
reports/
*.log
EOF

echo "Config files created..."

# Init npm and install dependencies
echo "Initializing npm..."
npm init -y

echo "Installing dependencies..."
npm install express drizzle-orm pg bullmq ioredis @anthropic-ai/sdk pdfkit pdf-parse csv-parse multer helmet zod pino @sentry/node jsonwebtoken bcrypt uuid

echo "Installing dev dependencies..."
npm install -D typescript ts-node nodemon @types/express @types/node @types/pg @types/pdfkit @types/pdf-parse @types/multer @types/jsonwebtoken @types/bcrypt @types/uuid drizzle-kit tsx

# Copy .env.example to .env
cp .env.example .env

echo ""
echo "LedgerLens setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in your API keys in .env"
echo "  2. Run: docker-compose up -d"
echo "  3. Start building src/config/index.ts"