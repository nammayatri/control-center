import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";

// API Base URLs
// In development, requests are proxied through Vite to avoid CORS
// In production, these should point to the actual API endpoints
const isDev = import.meta.env.DEV;
const API_DOMAIN =
  import.meta.env.VITE_API_URL || "https://control-center.moving.tech";

// For "dev" and "master" environments (integ domain), the path prefix is /api/dev
// For "prod" (moving.tech domain), the path prefix is /api
// ADMIN APIs (metrics, master-conversion) need /analytics-data prefix in production
const isInteg = API_DOMAIN.includes("integ");
const apiPath = isInteg ? "/api/dev" : "/api";
const adminPath = isInteg ? "/api/dev" : "/analytics-data/api";

export const API_BASE_URLS = {
  BAP: isDev ? "/api/bap" : `${API_DOMAIN}${apiPath}/bap`,
  BPP: isDev ? "/api/bpp" : `${API_DOMAIN}${apiPath}/bpp`,
  ADMIN: isDev ? "/api" : `${API_DOMAIN}${adminPath}`,
} as const;

// Create axios instances for different API endpoints
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("dashboard_token");
      if (token) {
        config.headers.token = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        localStorage.removeItem("dashboard_token");
        localStorage.removeItem("dashboard_user");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// API Clients
export const bapApi = createApiClient(API_BASE_URLS.BAP);
export const bppApi = createApiClient(API_BASE_URLS.BPP);
export const adminApi = createApiClient(API_BASE_URLS.ADMIN);

// Generic request helper with typed response
export async function apiRequest<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig
): Promise<T> {
  const response = await client.request<T>(config);
  return response.data;
}

// Helper to build path with merchant and city
export function buildPath(
  basePath: string,
  merchantId?: string,
  cityId?: string
): string {
  if (!merchantId || merchantId === "all") {
    return basePath;
  }

  if (cityId && cityId !== "all") {
    return basePath
      .replace("{merchantId}", merchantId)
      .replace("{city}", cityId);
  }

  return basePath.replace("{merchantId}", merchantId).replace("/{city}", "");
}

// Query param builder
export function buildQueryParams(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Error handler
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
    }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "An error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
