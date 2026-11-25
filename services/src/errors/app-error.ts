export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Permintaan tidak valid.") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi tidak valid atau telah berakhir. Silakan login kembali.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "Akses ditolak. Anda tidak memiliki kewenangan untuk mengakses fitur ini."
  ) {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data yang diminta tidak ditemukan.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Terjadi konflik status data pada transaksi.") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validasi input gagal.",
    errors: Record<string, string[]> = {}
  ) {
    super(message, 422, "VALIDATION_ERROR", errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = "Terlalu banyak permintaan dalam waktu singkat. Silakan coba beberapa saat lagi."
  ) {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = "Layanan sedang tidak siap memproses permintaan."
  ) {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}
