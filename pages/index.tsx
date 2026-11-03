import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const manageSecurity = (session as any)?.manageSecurity;

  if (status === "loading") {
    return (
      <main>
        <section>Loading...</section>
      </main>
    );
  }

  return (
    <main>
      <section>
        <h1>Azure AD B2C MFA Demo App</h1>
        {session?.user ? (
          <>
            <div>Signed in as: {session.user.name}</div>
            <div>Email: {session.user.email}</div>
            {manageSecurity && (
              <dl className="result">
                <dt>Manage security result</dt>
                <dd>{manageSecurity.actionState}</dd>
                <dt>Correlation ID</dt>
                <dd>
                  <code>{manageSecurity.correlationId}</code>
                </dd>
              </dl>
            )}
            <button
              onClick={() =>
                signIn("azure-ad-b2c-manage-security", undefined, {
                  login_hint: session.user?.email ?? "",
                })
              }
            >
              Manage security
            </button>
            <button onClick={() => signOut()}>Sign out</button>
          </>
        ) : (
          <>
            <button
              onClick={() =>
                signIn("azure-ad-b2c", undefined, { prompt: "login" })
              }
            >
              Sign in
            </button>
          </>
        )}
      </section>
    </main>
  );
}
