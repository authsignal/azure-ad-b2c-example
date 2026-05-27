import { expect, test } from "@playwright/test";
import { provisionTestUser } from "./utils/azure-ad-b2c";
import { appOrigin } from "./utils/env";
import { setupWebAuthn, waitForWebAuthnEvent } from "./utils/page-helpers";

test("user can enrol a passkey then sign back in with it", async ({ page }) => {
  // 1. Set up webAuthn and provision a test user
  const { client } = await setupWebAuthn(page);
  const testUser = await provisionTestUser();

  // Wait for the B2C directory to propagate the new user to the sign-in policy
  await page.waitForTimeout(5_000);

  // 2. Navigate to your application's login page
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();

  // 3. Complete the login form and click the sign-in button
  await page.getByRole("textbox", { name: "Email Address" }).fill(testUser.email);
  await page.getByRole("textbox", { name: "Password" }).fill(testUser.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // 4. Wait for the virtual authenticator to create the passkey
  const credentialAdded = waitForWebAuthnEvent(client, "WebAuthn.credentialAdded");

  // Depending on your integration and action configuration, you may need to customize this step to initiate the passkey creation prompt.
  // This example assumes the use of the Authsignal pre-built UI with an action configuration that has multiple authentication methods enabled.
  await page.getByText("Passkey", { exact: true }).click();

  await credentialAdded;

  // 5. The pre-built UI redirects back to your app and assert that the user is authenticated.
  await page.waitForURL((url) => url.origin === appOrigin && url.pathname === "/");
  await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();

  // 6. Sign out from your application to start a fresh journey on the next request
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  // 7. Sign back in to begin the re-authentication process.
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("textbox", { name: "Email Address" }).fill(testUser.email);
  await page.getByRole("textbox", { name: "Password" }).fill(testUser.password);

  // 8. After clicking sign in, the user will be redirected to the Authsignal pre-built UI where they passkey prompt will be displayed.
  const credentialAsserted = waitForWebAuthnEvent(client, "WebAuthn.credentialAsserted");
  await page.locator("#next").click();

  // Present the virtual authenticator credential to the browser
  await credentialAsserted;

  // 9. Wait for the pre-built UI to redirect back to your application and assert that the user is authenticated.
  await page.waitForURL((url) => url.origin === appOrigin && url.pathname === "/");
  await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();
});
