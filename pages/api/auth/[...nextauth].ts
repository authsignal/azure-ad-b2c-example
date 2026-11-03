import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { getToken } from "next-auth/jwt";

const tenantId = process.env.AZURE_AD_B2C_TENANT_NAME!;

const policy = "B2C_1A_SIGNUP_SIGNIN";
const manageSecurityPolicy = "B2C_1A_MANAGE_SECURITY";

const issuer = `https://${tenantId}.b2clogin.com/${tenantId}.onmicrosoft.com/v2.0`;

const b2cProvider = (id: string, policy: string): OAuthConfig<any> => ({
  id,
  name: "Azure Active Directory B2C",
  type: "oauth",
  wellKnown: `${issuer}/.well-known/openid-configuration?p=${policy}`,
  idToken: true,
  clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
  authorization: { params: { scope: "offline_access openid" } },
  profile: (profile) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
    };
  },
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // The manage security token has no name or email, so keep the sign-in session and add the result to it.
  const signedInToken = await getToken({ req });

  return NextAuth(req, res, {
    providers: [
      b2cProvider("azure-ad-b2c", policy),
      b2cProvider("azure-ad-b2c-manage-security", manageSecurityPolicy),
    ],
    callbacks: {
      jwt: ({ token, account, profile }: any) => {
        if (account?.provider !== "azure-ad-b2c-manage-security") {
          return token;
        }

        if (!signedInToken || signedInToken.sub !== profile.sub) {
          return token;
        }

        return {
          ...signedInToken,
          manageSecurity: {
            actionState: profile.action_state,
            correlationId: profile.correlation_id,
          },
        };
      },
      session: ({ session, token }: any) => {
        return { ...session, manageSecurity: token.manageSecurity };
      },
    },
  });
}
