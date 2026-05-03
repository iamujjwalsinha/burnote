"use client";

import { useEffect, useState } from "react";
import { importKeyFromFragment, decryptSecret } from "@/lib/crypto";

type State =
  | { status: "loading" }
  | { status: "missing_key" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "success"; plaintext: string; burned: boolean };

export default function SecretViewer({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchAndDecrypt() {
      const fragment = window.location.hash.slice(1);

      if (!fragment) {
        setState({ status: "missing_key" });
        return;
      }

      try {
        const res = await fetch(`/api/secret/${id}`);

        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const { ciphertext, iv, burnOnRead } = await res.json();
        const key = await importKeyFromFragment(fragment);
        const plaintext = await decryptSecret(ciphertext, iv, key);

        setState({ status: "success", plaintext, burned: Boolean(burnOnRead) });
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 404) {
          setState({ status: "not_found" });
        } else {
          setState({
            status: "error",
            message:
              err instanceof Error ? err.message : "Decryption failed",
          });
        }
      }
    }

    fetchAndDecrypt();
  }, [id]);

  async function copyPlaintext() {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  }

  if (state.status === "loading") {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center">
        <div className="text-2xl mb-3 animate-pulse">🔐</div>
        <p className="text-neutral-400 text-sm">Decrypting secret...</p>
      </div>
    );
  }

  if (state.status === "missing_key") {
    return (
      <div className="bg-[#1a1a1a] border border-red-900/40 rounded-xl p-8 text-center">
        <div className="text-2xl mb-3">🔑</div>
        <h2 className="text-white font-semibold mb-2">Missing decryption key</h2>
        <p className="text-neutral-400 text-sm">
          The decryption key is missing from the URL. Make sure you copied the
          full link including the <code className="text-amber-400">#</code> part.
        </p>
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center">
        <div className="text-2xl mb-3">💨</div>
        <h2 className="text-white font-semibold mb-2">Secret not found</h2>
        <p className="text-neutral-400 text-sm">
          This secret may have expired or already been read.
        </p>
        <a
          href="/"
          className="inline-block mt-4 text-amber-500 hover:text-amber-400 text-sm transition-colors"
        >
          Create a new secret →
        </a>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="bg-[#1a1a1a] border border-red-900/40 rounded-xl p-8 text-center">
        <div className="text-2xl mb-3">⚠️</div>
        <h2 className="text-white font-semibold mb-2">Decryption failed</h2>
        <p className="text-neutral-400 text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {state.burned && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-lg">🔥</span>
          <p className="text-amber-300 text-sm">
            This secret has been permanently deleted after viewing. No one can
            access it again.
          </p>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-400">
            Decrypted secret
          </h2>
          <button
            onClick={copyPlaintext}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-md transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="font-mono text-sm text-neutral-100 whitespace-pre-wrap break-words leading-relaxed bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 max-h-96 overflow-y-auto">
          {state.plaintext}
        </pre>
      </div>

      <a
        href="/"
        className="block text-center text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
      >
        Create your own secret →
      </a>
    </div>
  );
}
