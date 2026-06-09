"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground">
          Please try again or return to the previous page.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
