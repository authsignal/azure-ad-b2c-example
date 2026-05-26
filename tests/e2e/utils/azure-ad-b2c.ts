import { randomUUID } from "crypto";
import { requiredEnv } from "./env";

type GraphTokenResponse = {
  access_token?: string;
};

type GraphUser = {
  id: string;
};

export type ProvisionedB2CUser = {
  id: string;
  email: string;
  displayName: string;
  password: string;
};

const graphBaseUrl = "https://graph.microsoft.com/v1.0";

function tenantDomain() {
  return `${requiredEnv("AZURE_AD_B2C_TENANT_NAME")}.onmicrosoft.com`;
}

function graphTenant() {
  return process.env.AUTH_TENANT_GUID || tenantDomain();
}

function randomPassword(id: string) {
  return `Passkey-${id.slice(0, 8)}-A1!`;
}

async function graphAccessToken() {
  const body = new URLSearchParams({
    client_id: requiredEnv("AZURE_AD_B2C_GRAPH_CLIENT_ID"),
    client_secret: requiredEnv("AZURE_AD_B2C_GRAPH_CLIENT_SECRET"),
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${graphTenant()}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get Graph token: ${response.status} ${await response.text()}`);
  }

  const token = (await response.json()) as GraphTokenResponse;

  if (!token.access_token) {
    throw new Error("Graph token response did not include an access token");
  }

  return token.access_token;
}

async function graphFetch(path: string, init?: RequestInit) {
  const token = await graphAccessToken();

  return fetch(`${graphBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function provisionTestUser(): Promise<ProvisionedB2CUser> {
  const id = randomUUID();
  const emailDomain = process.env.E2E_TEST_EMAIL_DOMAIN || "example.com";
  const email = `passkey-e2e-${id}@${emailDomain}`;
  const displayName = `Passkey E2E ${id.slice(0, 8)}`;
  const mailNickname = `passkey-e2e-${id.replace(/-/g, "").slice(0, 16)}`;
  const password = randomPassword(id);

  const response = await graphFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      accountEnabled: true,
      displayName,
      identities: [
        {
          signInType: "emailAddress",
          issuer: tenantDomain(),
          issuerAssignedId: email,
        },
      ],
      mailNickname,
      passwordPolicies: "DisablePasswordExpiration",
      passwordProfile: {
        forceChangePasswordNextSignIn: false,
        password,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create B2C test user: ${response.status} ${await response.text()}`);
  }

  const user = (await response.json()) as GraphUser;

  return {
    id: user.id,
    email,
    displayName,
    password,
  };
}

export async function deleteTestUser(userId: string) {
  const response = await graphFetch(`/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete B2C test user: ${response.status} ${await response.text()}`);
  }
}
