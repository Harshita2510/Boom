"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function DashboardUserButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-9 rounded-full bg-muted" aria-hidden="true" />;
  }

  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "size-9"
        }
      }}
    />
  );
}
