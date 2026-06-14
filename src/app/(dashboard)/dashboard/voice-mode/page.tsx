import { VoiceModeClient } from "./voice-mode-client";

export const dynamic = "force-dynamic";

export default function VoiceModePage() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Voice Mode</h1>
        <p className="max-w-3xl text-muted-foreground">
          Open ArthSaathi, tap start once, and speak multiple transactions while
          the app stays open.
        </p>
      </div>

      <VoiceModeClient />
    </main>
  );
}
