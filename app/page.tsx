import SecretForm from "@/components/SecretForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ backgroundColor: "#FFFFEB" }}>
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#034F46" }}>
            hedwig
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#1A1A1A", opacity: 0.6 }}>
            Zero-knowledge secret sharing. Encrypted in your browser.<br />
            The server never sees your plaintext.
          </p>
        </div>
        <SecretForm />
      </div>
    </main>
  );
}
