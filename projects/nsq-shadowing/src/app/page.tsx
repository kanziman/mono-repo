const previewItems = [
  "YouTube episode import",
  "Subtitle translation",
  "Shadowing player",
  "AI tutor chat",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background-normal-normal px-24 py-20 text-label-normal">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-40">
        <div className="flex flex-col gap-16">
          <p className="text-label1 text-primary-normal">NSQ Shadowing</p>
          <div className="flex max-w-3xl flex-col gap-12">
            <h1 className="text-title1 text-label-strong sm:text-display3">
              Practice English with No Stupid Questions episodes.
            </h1>
            <p className="text-body1-reading text-label-neutral">
              A local-first shadowing workspace for importing podcast audio,
              reading aligned subtitles, recording sentence practice, and
              asking focused tutor questions.
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {previewItems.map((item) => (
            <div
              className="rounded-md border border-line-normal-normal bg-background-elevated-normal p-16 text-label1 text-label-neutral"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
