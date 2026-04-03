// Base class for all our custom errors
// Extends the built-in Error class with two extra fields:
//   statusCode → HTTP status to send back to client
//   isOperational → true means "expected error we handled"
//                   false means "unexpected crash"
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Needed in TypeScript when extending built-in classes
    Object.setPrototypeOf(this, new.target.prototype)

    // Captures where the error was thrown in the stack trace
    Error.captureStackTrace(this)
  }
}

// 400 - Client sent bad data
// Example: uploaded a file that isn't a PDF or CSV
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

// 401 - Not logged in
// Example: no JWT token in the request header
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401)
  }
}

// 403 - Logged in but not allowed
// Example: DSA agent trying to access another agent's reports
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403)
  }
}

// 404 - Resource doesn't exist
// Example: GET /reports/999 but report 999 doesn't exist
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404)
  }
}

// 409 - Conflict with existing data
// Example: applicant with this PAN already exists
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}

// 422 - File or data is the right type but can't be processed
// Example: PDF uploaded but it's a scanned image, can't extract text
export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(message, 422)
  }
}

// 429 - Too many requests
// Example: same DSA uploading 50 statements per minute
export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429)
  }
}

// 503 - External service is down
// Example: Claude API is unreachable, Redis is down
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is currently unavailable`, 503)
  }
}

// Helper function used in the global error handler
// Tells us if this is an error WE threw (operational)
// or an unexpected crash (programming bug)
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

// Usage examples:
//
// throw new NotFoundError("Report")
// → 404: "Report not found"
//
// throw new ValidationError("File must be PDF or CSV")
// → 400: "File must be PDF or CSV"
//
// throw new ServiceUnavailableError("Claude API")
// → 503: "Claude API is currently unavailable"