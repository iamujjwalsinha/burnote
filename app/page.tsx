import SecretForm from "@/components/SecretForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
            🔥 Burnote
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            End-to-end encrypted secret sharing. The server never sees your
            plaintext — encryption happens entirely in your browser.
          </p>
        </div>
        <SecretForm />
      </div>
    </main>
  );
}
