"use client";

import { useEffect, useState } from "react";

/**
 * Bridge page for TCG Masters replay viewer.
 *
 * TCG Masters stores replay data in React state (not localStorage).
 * For current version (v6), data goes through their file input.
 * This page auto-downloads the replay file and opens TCG Masters
 * so the user just needs to select the downloaded file.
 */
export default function ReplayBridgePage() {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    try {
      const content = sessionStorage.getItem("__replayContent");
      if (!content) {
        setStatus("error");
        return;
      }

      // Auto-download the replay file
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "replay.json";
      a.click();
      URL.revokeObjectURL(url);

      // Open TCG Masters replay viewer
      window.open("https://tcgmasters.net/#replay", "_blank");

      sessionStorage.removeItem("__replayContent");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-3 max-w-sm">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">Preparing replay...</p>
        )}
        {status === "done" && (
          <>
            <p className="text-sm text-foreground font-medium">Replay file downloaded!</p>
            <p className="text-xs text-muted-foreground">
              TCG Masters replay viewer opened in a new tab.
              Select the downloaded <code className="bg-muted/50 px-1 rounded">replay.json</code> file there.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              You can close this tab.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-destructive font-medium">Could not prepare replay</p>
            <p className="text-xs text-muted-foreground">
              Try again or upload the replay file manually at{" "}
              <a
                href="https://tcgmasters.net/#replay"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                tcgmasters.net
              </a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
