export function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const appOrigin = new URL(
  process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
).origin;
