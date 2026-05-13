"use client";

import { useEffect, useState } from "react";
import { IDKitRequestWidget, orbLegacy, type IDKitResult, type RpContext } from "@worldcoin/idkit";

type Props = {
  appId?: `app_${string}`;
  action: string;
  configured: boolean;
  devBypass: boolean;
};

export function HumanVerifyButton({ appId, action, configured, devBypass }: Props) {
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    fetch(`/api/rp-context?action=${encodeURIComponent(action)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setRpContext)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to prepare World ID request"));
  }, [configured, action]);

  async function verifyProof(result: IDKitResult) {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idkitResponse: result, rp_id: rpContext?.rp_id }),
    });
    if (!response.ok) throw new Error(await response.text());
  }

  async function useDevBypass() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ devBypassCode: "human" }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(await response.text());
      return;
    }
    window.location.reload();
  }

  if (devBypass) {
    return (
      <div>
        <button className="button button-primary" disabled={loading} onClick={useDevBypass}>{loading ? "Verifying…" : "Dev: verify as human"}</button>
        {error ? <div className="error">{error}</div> : null}
      </div>
    );
  }

  if (!configured) {
    return (
      <div>
        <button className="button button-primary" disabled>World ID env vars needed</button>
        <div className="error">Set NEXT_PUBLIC_WORLD_APP_ID, NEXT_PUBLIC_WORLD_RP_ID, WORLD_RP_ID and WORLD_SIGNING_KEY. For local UI testing set HUMAN_DEV_BYPASS=1.</div>
      </div>
    );
  }

  return (
    <div>
      <button className="button button-primary" disabled={!rpContext || !appId} onClick={() => setOpen(true)}>
        {rpContext ? "Verify with World ID" : "Preparing World ID…"}
      </button>
      {error ? <div className="error">{error}</div> : null}
      {appId && rpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={appId}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy()}
          environment="production"
          handleVerify={verifyProof}
          onSuccess={() => window.location.reload()}
          onError={(code) => setError(`World ID error: ${code}`)}
        />
      ) : null}
    </div>
  );
}
