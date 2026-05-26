import { requiredEnv, trimTrailingSlash } from "./env";

type AuthsignalAuthenticator = {
  verificationMethod?: string;
  type?: string;
};

const authsignalApiUrl = () => trimTrailingSlash(requiredEnv("AUTHSIGNAL_API_URL"));

const authsignalHeaders = () => ({
  Authorization: `Basic ${Buffer.from(`${requiredEnv("AUTHSIGNAL_SECRET_KEY")}:`).toString(
    "base64",
  )}`,
});

export async function getAuthenticators(userId: string) {
  const response = await fetch(
    `${authsignalApiUrl()}/users/${encodeURIComponent(userId)}/authenticators`,
    { headers: authsignalHeaders() },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get Authsignal authenticators: ${response.status} ${await response.text()}`,
    );
  }

  return (await response.json()) as AuthsignalAuthenticator[];
}

export function hasPasskeyAuthenticator(authenticators: AuthsignalAuthenticator[]) {
  return authenticators.some(
    (authenticator) =>
      authenticator.verificationMethod === "PASSKEY" || authenticator.type === "PASSKEY",
  );
}
