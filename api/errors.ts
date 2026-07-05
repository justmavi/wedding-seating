// Domain error carrying the HTTP status the API should respond with.
// Thrown by controllers/services and translated to a JSON response by the
// central error handler in index.ts.
export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string) => new AppError(400, message);
export const conflict = (message: string) => new AppError(409, message);
