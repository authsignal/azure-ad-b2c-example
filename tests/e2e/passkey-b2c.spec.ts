import { expect, test } from "@playwright/test";
import { getAuthenticators, hasPasskeyAuthenticator } from "./utils/authsignal";
import { deleteTestUser, provisionTestUser } from "./utils/azure-ad-b2c";
import { appOrigin } from "./utils/env";
import { setupWebAuthn, waitForWebAuthnEvent } from "./utils/page-helpers";

test("user can enroll a passkey through B2C then sign back in with it", async ({ page }) => {
  const { client } = await setupWebAuthn(page);

  // Programmatically provision a test user through the IDP
  const testUser = await provisionTestUser();

  // Wait for the B2C directory to propagate the new user to the sign-in policy
  await page.waitForTimeout(5000);

  try {
    // Navigate to the app homepage and click the "Sign in" button
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Fill in the email and password fields and click the next button
    await page.getByRole("textbox", { name: "Email Address" }).fill(testUser.email);
    await page.getByRole("textbox", { name: "Password" }).fill(testUser.password);
    await page.locator("#next").click();

    // Click the "Passkey" option and wait for the credential to be added
    const credentialAdded = waitForWebAuthnEvent(client, "WebAuthn.credentialAdded");
    await page.getByText("Passkey", { exact: true }).click();
    await credentialAdded;

    // Wait for the URL to change to the app's homepage and verify the user is signed in
    await page.waitForURL((url) => url.origin === appOrigin && url.pathname === "/");
    await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();

    // Verify the user has a passkey authenticator enrolled with Authsignal
    const authenticators = await getAuthenticators(testUser.id);
    expect(hasPasskeyAuthenticator(authenticators)).toBe(true);

    // Sign out and sign in again
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    await page.getByRole("button", { name: "Sign in" }).click();

    await page.getByRole("textbox", { name: "Email Address" }).fill(testUser.email);
    await page.getByRole("textbox", { name: "Password" }).fill(testUser.password);

    // Present the previously enrolled passkey
    const credentialAsserted = waitForWebAuthnEvent(client, "WebAuthn.credentialAsserted");
    await page.locator("#next").click();
    await credentialAsserted;

    await page.waitForURL((url) => url.origin === appOrigin && url.pathname === "/");

    // Verify the user has signed in successfully
    await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();
  } finally {
    await deleteTestUser(testUser.id).catch((error) => {
      console.warn(error);
    });
  }
});
