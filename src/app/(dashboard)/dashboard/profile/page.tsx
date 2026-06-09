import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Clerk user profile data is available to protected server components.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-4">
          <dt className="text-sm font-medium text-muted-foreground">Name</dt>
          <dd className="mt-1 text-base font-medium">
            {user?.fullName ?? "Not provided"}
          </dd>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
          <dd className="mt-1 break-words text-base font-medium">
            {primaryEmail?.emailAddress ?? "Not provided"}
          </dd>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
          <dd className="mt-1 break-words font-mono text-sm">
            {user?.id ?? "Unavailable"}
          </dd>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <dt className="text-sm font-medium text-muted-foreground">
            Account created
          </dt>
          <dd className="mt-1 text-base font-medium">
            {user?.createdAt
              ? new Intl.DateTimeFormat("en", {
                  dateStyle: "medium"
                }).format(user.createdAt)
              : "Unavailable"}
          </dd>
        </div>
      </dl>
    </main>
  );
}
