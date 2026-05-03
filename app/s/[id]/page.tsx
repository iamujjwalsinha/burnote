import SecretViewer from "@/components/SecretViewer";

export default function SecretPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
            🔥 Burnote
          </h1>
          <p className="text-neutral-500 text-sm">Encrypted secret</p>
        </div>
        <SecretViewer id={params.id} />
      </div>
    </main>
  );
}
