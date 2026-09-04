export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  public constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
