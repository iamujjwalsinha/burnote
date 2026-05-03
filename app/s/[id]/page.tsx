import SecretViewer from "@/components/SecretViewer";

export default function SecretPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ backgroundColor: "#FFFFEB" }}>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#034F46" }}>
            hedwig
          </h1>
          <p className="text-sm" style={{ color: "#1A1A1A", opacity: 0.5 }}>encrypted message</p>
        </div>
        <SecretViewer id={params.id} />
      </div>
    </main>
  );
}
