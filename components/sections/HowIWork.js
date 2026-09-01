import { howIWork } from "@/lib/site";

/** "How I work" — three steps. Server-rendered, no interactivity. */
export default function HowIWork() {
  return (
    <section aria-labelledby="how-i-work" className="mx-auto max-w-5xl px-6 py-16">
      <h2 id="how-i-work" className="text-3xl font-bold text-white">
        How I work
      </h2>

      <ol className="mt-8 space-y-8">
        {howIWork.map((step) => (
          <li key={step.n} className="border-t border-white/15 pt-6">
            <h3 className="text-xl font-semibold text-white">
              <span className="mr-3 text-white/70">{step.n}</span>
              {step.title}
            </h3>
            <p className="mt-2 max-w-2xl text-white/80">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
