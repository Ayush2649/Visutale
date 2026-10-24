export class ProviderUnavailableError extends Error {
  public readonly code = "PROVIDER_UNAVAILABLE";
  public readonly statusCode = 503;
  public readonly provider: string;
  public readonly isRetryable = true;
  constructor(message: string, provider = "llm") {
    super(message);
    this.name = "ProviderUnavailableError";
    this.provider = provider;
  }
}

export class ProviderTimeoutError extends Error {
  public readonly code = "PROVIDER_TIMEOUT";
  public readonly statusCode = 504;
  public readonly provider: string;
  public readonly isRetryable = true;
  constructor(message: string, provider = "llm") {
    super(message);
    this.name = "ProviderTimeoutError";
    this.provider = provider;
  }
}

export class ModelOutputValidationError extends Error {
  public readonly code = "MODEL_OUTPUT_INVALID";
  public readonly statusCode = 502;
  public readonly issues: Array<{ path: string; message: string }>;
  constructor(message: string, issues: Array<{ path: string; message: string }> = []) {
    super(message);
    this.name = "ModelOutputValidationError";
    this.issues = issues;
  }
}

export class RequestValidationError extends Error {
  public readonly code = "INVALID_REQUEST";
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export class ProviderAuthenticationError extends Error {
  public readonly code = "PROVIDER_AUTH_ERROR";
  public readonly statusCode = 401;
  public readonly provider: string;
  public readonly isRetryable = false;
  constructor(message: string, provider = "llm") {
    super(message);
    this.name = "ProviderAuthenticationError";
    this.provider = provider;
  }
}

export class ProviderNotFoundError extends Error {
  public readonly code = "PROVIDER_NOT_FOUND";
  public readonly statusCode = 404;
  public readonly provider: string;
  public readonly isRetryable = false;
  constructor(message: string, provider = "llm") {
    super(message);
    this.name = "ProviderNotFoundError";
    this.provider = provider;
  }
}

