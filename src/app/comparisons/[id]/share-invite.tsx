"use client";

import { useState } from "react";

export function ShareInvite({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200"
      onClick={copyInvite}
      type="button"
    >
      {copied ? "Invite copied" : "Copy invite link"}
    </button>
  );
}
