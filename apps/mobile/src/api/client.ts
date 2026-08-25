import type { FieldErrors } from "./types";

const baseURL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/v1"
).replace(/\/$/, "");
let accessToken: string | null = null;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

type RequestOptions = Omit<RequestInit, "body" | "signal"> & {
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal | undefined;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, timeoutMs = 12_000, signal, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(`${baseURL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return undefined as T;
    let payload: {
      data?: T;
      error?: { code: string; message: string; fields?: FieldErrors };
    };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new ApiError(
        "invalid_response",
        "The server returned an invalid response.",
        response.status,
      );
    }
    if (!response.ok || payload.error) {
      throw new ApiError(
        payload.error?.code ?? "request_failed",
        payload.error?.message ?? "The request could not be completed.",
        response.status,
        payload.error?.fields,
      );
    }
    if (!("data" in payload))
      throw new ApiError(
        "invalid_response",
        "The server returned an invalid response.",
        response.status,
      );
    return payload.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted)
      throw new ApiError(
        "timeout",
        "The request timed out. Please try again.",
        0,
      );
    throw new ApiError(
      "network_error",
      "Unable to reach The Hive. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
