import { Page } from "@playwright/test";

type WebAuthnClient = Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>>;

type WebAuthnEventName = "WebAuthn.credentialAdded" | "WebAuthn.credentialAsserted";

export async function setupWebAuthn(page: Page) {
  const client = await page.context().newCDPSession(page);

  await client.send("WebAuthn.enable", { enableUI: true });

  const result = await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  return { client, authenticatorId: result.authenticatorId };
}

export function waitForWebAuthnEvent(client: WebAuthnClient, eventName: WebAuthnEventName) {
  return new Promise<void>((resolve) => {
    const listener = (event: { method: string }) => {
      if (event.method !== eventName) {
        return;
      }

      client.off("event", listener);
      resolve();
    };

    client.on("event", listener);
  });
}
