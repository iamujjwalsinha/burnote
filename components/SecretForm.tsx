"use client";

import { useState } from "react";
import { generateKey, encryptSecret, exportKeyToFragment } from "@/lib/crypto";

const TTL_OPTIONS = [
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "45 minutes", value: 2700 },
  { label: "1 hour", value: 3600 },
];

const GREEN = "#034F46";
const BG = "#FFFFEB";
const CARD_BG = "#F4F4E0";
const BORDER = "#D8D8C8";
const TEXT = "#1A1A1A";

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
      setGeneratedLink(`${window.location.origin}/s/${id}#${keyFragment}`);
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
    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "28px" }}>

      {/* ── STEP 1: Write ── */}
      {step === "write" && (
        <form onSubmit={handlePreview} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: TEXT }}>
                Your secret
              </label>
              {charCount > 0 && (
                <span className="text-xs" style={{ color: TEXT, opacity: 0.4 }}>
                  {charCount} chars · {lineCount} {lineCount === 1 ? "line" : "lines"}
                </span>
              )}
            </div>
            <textarea
              value={plaintext}
              onChange={(e) => { setPlaintext(e.target.value); if (error) setError(""); }}
              rows={7}
              placeholder="Paste your secret here — passwords, tokens, private notes..."
              style={{
                width: "100%",
                backgroundColor: BG,
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                color: TEXT,
                outline: "none",
                resize: "none",
                lineHeight: "1.6",
              }}
              onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = `0 0 0 3px ${GREEN}18`; }}
              onBlur={(e) => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: TEXT }}>
                Expires in
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                style={{
                  width: "100%",
                  backgroundColor: BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: TEXT,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {TTL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: TEXT }}>
                Burn after reading
              </label>
              <button
                type="button"
                onClick={() => setBurnOnRead((p) => !p)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${burnOnRead ? GREEN : BORDER}`,
                  backgroundColor: burnOnRead ? `${GREEN}12` : BG,
                  fontSize: "14px",
                  color: burnOnRead ? GREEN : TEXT,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontWeight: burnOnRead ? 500 : 400,
                }}
              >
                <span>{burnOnRead ? "Enabled" : "Disabled"}</span>
                <span style={{
                  width: "32px", height: "18px", borderRadius: "9px", position: "relative",
                  backgroundColor: burnOnRead ? GREEN : "#CBD5D3",
                  transition: "background-color 0.15s", flexShrink: 0,
                }}>
                  <span style={{
                    position: "absolute", top: "3px",
                    left: burnOnRead ? "17px" : "3px",
                    width: "12px", height: "12px", borderRadius: "50%",
                    backgroundColor: "white", transition: "left 0.15s",
                  }} />
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: "#B91C1C", fontSize: "13px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%", backgroundColor: GREEN, color: "#FFFFEB",
              fontWeight: 600, padding: "13px", borderRadius: "10px",
              fontSize: "14px", border: "none", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(3,79,70,0.25)",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Review & Confirm →
          </button>

          <p className="text-center text-xs" style={{ color: TEXT, opacity: 0.4 }}>
            Encryption happens in your browser. The server never sees your plaintext.
          </p>
        </form>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === "preview" && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: TEXT }}>
              Review your secret
            </h2>
            <p className="text-sm" style={{ color: TEXT, opacity: 0.55 }}>
              Confirm everything looks right before encrypting.
            </p>
          </div>

          <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: TEXT, opacity: 0.4 }}>
                Secret preview
              </span>
              <span className="text-xs" style={{ color: TEXT, opacity: 0.35 }}>
                {charCount} chars · {lineCount} {lineCount === 1 ? "line" : "lines"}
              </span>
            </div>
            <pre style={{
              padding: "14px 16px", fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace", color: TEXT,
              whiteSpace: "pre-wrap", wordBreak: "break-words",
              maxHeight: "180px", overflowY: "auto", lineHeight: "1.6",
              margin: 0,
            }}>
              {plaintext}
            </pre>
          </div>

          <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 16px" }} className="space-y-2">
            {[
              ["Expires in", ttlLabel],
              ["Burn after reading", burnOnRead ? "Yes — deleted on first view" : "No"],
              ["Encryption", "AES-GCM 256-bit (browser-only)"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: TEXT, opacity: 0.5 }}>{label}</span>
                <span style={{ color: label === "Burn after reading" && burnOnRead ? GREEN : TEXT, fontWeight: burnOnRead && label === "Burn after reading" ? 500 : 400 }}>{value}</span>
              </div>
            ))}
          </div>

          {error && (
            <p style={{ color: "#B91C1C", fontSize: "13px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("write")}
              disabled={loading}
              style={{
                flex: 1, border: `1px solid ${BORDER}`, backgroundColor: BG,
                color: TEXT, padding: "12px", borderRadius: "10px",
                fontSize: "14px", cursor: "pointer", transition: "border-color 0.15s",
                opacity: loading ? 0.5 : 1,
              }}
            >
              ← Edit
            </button>
            <button
              onClick={handleEncrypt}
              disabled={loading}
              style={{
                flex: 2, backgroundColor: loading ? `${GREEN}80` : GREEN,
                color: "#FFFFEB", fontWeight: 600, padding: "12px",
                borderRadius: "10px", fontSize: "14px", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(3,79,70,0.25)",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Encrypting…" : "Confirm & Encrypt"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === "done" && (
        <div className="space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="text-3xl mb-3">🦉</div>
            <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: TEXT }}>
              Hedwig is on her way
            </h2>
            <p className="text-sm" style={{ color: TEXT, opacity: 0.55 }}>
              Your secret has been sealed. Share the link below — the decryption key flies only in the <code style={{ color: GREEN }}>#fragment</code>, never through our servers.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: TEXT }}>Shareable link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                style={{
                  flex: 1, minWidth: 0, backgroundColor: BG, border: `1px solid ${BORDER}`,
                  borderRadius: "10px", padding: "10px 12px",
                  fontSize: "12px", fontFamily: "'JetBrains Mono', monospace",
                  color: TEXT, outline: "none",
                }}
              />
              <button
                onClick={copyLink}
                style={{
                  padding: "10px 18px", backgroundColor: GREEN, color: "#FFFFEB",
                  fontWeight: 600, fontSize: "14px", borderRadius: "10px",
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(3,79,70,0.25)", transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 16px" }} className="space-y-2">
            {[
              ["Expires", `${ttlLabel} from now`],
              ["Burn after reading", burnOnRead ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: TEXT, opacity: 0.5 }}>{label}</span>
                <span style={{ color: label === "Burn after reading" && burnOnRead ? GREEN : TEXT, fontWeight: burnOnRead && label === "Burn after reading" ? 500 : 400 }}>{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            style={{
              width: "100%", border: `1px solid ${BORDER}`, backgroundColor: "transparent",
              color: TEXT, padding: "12px", borderRadius: "10px",
              fontSize: "14px", cursor: "pointer", opacity: 0.7,
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            Create another secret
          </button>
        </div>
      )}
    </div>
  );
}
