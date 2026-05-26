# Authsignal's Azure AD B2C Integration Example

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and uses the Azure AD B2C Provider from [NextAuth.js](https://next-auth.js.org/) to handle authentication.

**The focus of this repository is to demonstrate how to use Authsignal with Azure AD B2C by adding steps to custom policies.**

## Links

| Resource          | URL                                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| Live Demo         | [as-azure-ad-b2c-example.vercel.app](https://as-azure-ad-b2c-example.vercel.app) |
| Custom Policies   | [./policies/](./policies/)                                                       |
| Integration Guide | [docs.authsignal.com](https://docs.authsignal.com/integrations/azure-ad-b2c)     |

## Quick Start Guide

### Option 1: Follow the Integration Guide

Follow our step-by-step [Integration Guide](https://docs.authsignal.com/integrations/azure-ad-b2c) for detailed instructions on integrating Authsignal with Azure AD B2C.

### Option 2: Use Policies as a Starter Template

Use the custom policies in this repo as a starting point for your own implementation.

#### Steps

1. **Download the Azure AD B2C VS Code extension**

   Install the [Azure AD B2C extension](https://marketplace.visualstudio.com/items?itemName=AzureADB2CTools.aadb2c) from the VS Code marketplace.

2. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd azure-ad-b2c-example
   ```

3. **Copy the example config**

   ```bash
   cp appsettings.example.json appsettings.json
   ```

4. **Replace the config**

   Update `appsettings.json` with your Azure AD B2C tenant details and Authsignal configuration.

5. **Build the policies**

   Run the **B2C Build all policies** command from the VS Code extension (press `Ctrl+Shift+P` or `Cmd+Shift+P` and search for "B2C Build all policies").

6. **Store your Authsignal Tenant Secret on Azure AD B2C**

   Your Authsignal tenant secret is stored as a policy key on Azure AD B2C's Identity Experience Framework and referenced by the technical profile with the Id `B2C_1A_AuthsignalSecret`.

   Find the secret key for your tenant in the [Authsignal Portal](https://portal.authsignal.com) and add it to your Azure AD B2C tenant as a policy key via the Azure Portal.

7. **Upload the custom policies**

   Upload the generated custom policies to your Azure AD B2C tenant via the Azure Portal or using the VS Code extension.

## E2E testing passkeys

This repo includes a Playwright E2E test for the Azure AD B2C passkey journey. It follows the Authsignal passkey E2E testing guide by installing a Chromium virtual authenticator, enrolling a passkey through the real B2C/Authsignal journey, then signing back in with the same virtual credential.

The test provisions a disposable B2C local account with Microsoft Graph, so run it only against a dedicated test tenant. In addition to the app's usual env variables in `.env.local.example`, configure these test variables:

| Variable                           | Purpose                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `E2E_BASE_URL`                     | Base URL for this Next.js app, for example `http://127.0.0.1:3000`.             |
| `AZURE_AD_B2C_TENANT_NAME`         | B2C tenant name without `.onmicrosoft.com`.                                     |
| `AUTH_TENANT_GUID`                 | Optional tenant GUID for Microsoft Graph auth; falls back to the tenant domain. |
| `AZURE_AD_B2C_GRAPH_CLIENT_ID`     | App registration client ID with Microsoft Graph user create/delete permission.  |
| `AZURE_AD_B2C_GRAPH_CLIENT_SECRET` | Client secret for the Graph app registration.                                   |
| `E2E_TEST_EMAIL_DOMAIN`            | Email domain used for generated test users; defaults to `example.com`.          |
| `AUTHSIGNAL_API_URL`               | Authsignal Server API URL, including `/v1` when required by the tenant region.  |
| `AUTHSIGNAL_SECRET_KEY`            | Authsignal Server API secret for server-side verification.                      |

Run the test with:

```bash
yarn playwright install chromium
yarn test:e2e
```
