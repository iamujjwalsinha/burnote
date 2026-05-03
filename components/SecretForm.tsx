"use client";

import { useState } from "react";
import { generateKey, encryptSecret, exportKeyToFragment } from "@/lib/crypto";

const TTL_OPTIONS = [
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
];

type Step = "write" | "preview" | "done";

export default function SecretForm() {
  const [step, setStep] = useState<Step>("write");
  const [plaintext, setPlaintext] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [burnOnRead, setBurnOnRead] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const ttlLabel = TTL_OPTIONS.find((o) => o.value === ttl)?.label ?? "";
  const charCount = plaintext.length;
  const lineCount = plaintext.split("\n").length;

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!plaintext.trim()) {
      setError("Please enter a secret.");
      return;
    }
    setError("");
    setStep("preview");
  }

  async function handleEncrypt() {
    setLoading(true);
    setError("");

    try {
      const key = await generateKey();
      const { ciphertext, iv } = await encryptSecret(plaintext, key);
      const keyFragment = await exportKeyToFragment(key);

      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, iv, burnOnRead, ttl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to store secret");
      }

      const { id } = await res.json();
      const link = `${window.location.origin}/s/${id}#${keyFragment}`;
      setGeneratedLink(link);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  function reset() {
    setStep("write");
    setPlaintext("");
    setGeneratedLink("");
    setCopied(false);
    setError("");
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">

      {/* ── STEP 1: Write ── */}
      {step === "write" && (
        <form onSubmit={handlePreview} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-300">
                Your secret
              </label>
              {plaintext.length > 0 && (
                <span className="text-xs text-neutral-600">
                  {charCount} chars · {lineCount} {lineCount === 1 ? "line" : "lines"}
                </span>
              )}
            </div>
            <textarea
              value={plaintext}
              onChange={(e) => {
                setPlaintext(e.target.value);
                if (error) setError("");
              }}
              rows={7}
              placeholder="Paste your secret here — passwords, tokens, private notes..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Expires in
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                {TTL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Burn after reading
              </label>
              <button
                type="button"
                onClick={() => setBurnOnRead((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  burnOnRead
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                    : "bg-[#0f0f0f] border-[#2a2a2a] text-neutral-400"
                }`}
              >
                <span>{burnOnRead ? "Enabled" : "Disabled"}</span>
                <span
                  className={`w-8 h-4 rounded-full relative transition-colors ${
                    burnOnRead ? "bg-amber-500" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      burnOnRead ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            Review & Confirm →
          </button>

          <p className="text-neutral-600 text-xs text-center">
            Encryption happens in your browser. The server never sees your plaintext.
          </p>
        </form>
      )}

      {/* ── STEP 2: Preview / Confirm ── */}
      {step === "preview" && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              Review your secret
            </h2>
            <p className="text-neutral-500 text-sm">
              Make sure everything looks right before it gets encrypted.
            </p>
          </div>

          {/* Secret preview */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]">
              <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                Secret preview
              </span>
              <span className="text-xs text-neutral-600">
                {charCount} chars · {lineCount} {lineCount === 1 ? "line" : "lines"}
              </span>
            </div>
            <pre className="px-4 py-3 text-sm font-mono text-neutral-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed">
              {plaintext}
            </pre>
          </div>

          {/* Settings summary */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Expires in</span>
              <span className="text-neutral-300">{ttlLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Burn after reading</span>
              <span className={burnOnRead ? "text-amber-400" : "text-neutral-400"}>
                {burnOnRead ? "Yes — deleted on first view" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Encryption</span>
              <span className="text-neutral-300">AES-GCM 256-bit (browser-only)</span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("write")}
              disabled={loading}
              className="flex-1 border border-[#2a2a2a] hover:border-[#3a3a3a] text-neutral-400 hover:text-neutral-200 py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              ← Edit
            </button>
            <button
              onClick={handleEncrypt}
              disabled={loading}
              className="flex-[2] bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-semibold py-3 rounded-lg text-sm transition-colors"
            >
              {loading ? "Encrypting..." : "Confirm & Encrypt"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === "done" && (
        <div className="space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="text-2xl mb-2">✅</div>
            <h2 className="text-lg font-semibold text-white">Secret encrypted!</h2>
            <p className="text-neutral-400 text-sm mt-1">
              Share this link. The decryption key lives after the{" "}
              <code className="text-amber-400">#</code> and never touches the server.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Your shareable link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 min-w-0 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs font-mono text-neutral-300 focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Expires</span>
              <span className="text-neutral-300">{ttlLabel} from now</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Burn after reading</span>
              <span className={burnOnRead ? "text-amber-400" : "text-neutral-300"}>
                {burnOnRead ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full border border-[#2a2a2a] hover:border-[#3a3a3a] text-neutral-400 hover:text-neutral-200 py-2.5 rounded-lg text-sm transition-colors"
          >
            Create another secret
          </button>
        </div>
      )}
    </div>
  );
}
