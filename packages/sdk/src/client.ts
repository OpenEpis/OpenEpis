import type { ApiError } from "@openepis/types";
import { OpenEpisApiError } from "./error.js";

export interface OpenEpisClientConfig {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export class HttpClient {
  private baseUrl: string;
  private fetch: typeof globalThis.fetch;

  constructor(config: OpenEpisClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await this.fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let code = "UNKNOWN";
      let message = res.statusText;
      try {
        const errBody = (await res.json()) as ApiError;
        code = errBody.error.code;
        message = errBody.error.message;
      } catch {
        // use defaults
      }
      throw new OpenEpisApiError(res.status, code, message);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
