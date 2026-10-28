import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Flame, Pause, Play, Search, X } from "lucide-react";
import { ForceGraph, type ForceGraphHandle, type GraphPhase } from "@/components/force-graph";
import {
  DEGREE,
  EDGES,
  KIND_LABEL,
  NODE_BY_ID,
  NODES,
  searchChart,
  tiesOf,
  type Kind,
} from "@/graph/data";

export const Route = createFileRoute("/")({ component: Home });

const LEGEND: readonly { kind: Kind; label: string; query: string; swatch: string }[] = [
  { kind: "post", label: "Posts", query: "posts", swatch: "bg-brass" },
  { kind: "craft", label: "Craft", query: "craft", swatch: "rotate-45 bg-sage" },
  { kind: "signal", label: "Signals", query: "signals", swatch: "border border-bone bg-transparent" },
  { kind: "person", label: "People", query: "people", swatch: "bg-clay" },
];

function Home() {
  const graphRef = useRef<ForceGraphHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [phase, setPhase] = useState<GraphPhase>("live");
  const hits = useMemo(() => searchChart(query), [query]);
  const selected = selectedId ? NODE_BY_ID.get(selectedId) : undefined;
  const ties = selected ? tiesOf(selected.id) : [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if ((event.key === "f" || event.key === "F") && !typing) {
        event.preventDefault();
        graphRef.current?.fitAll();
      } else if (event.key === "Escape") {
        setSelectedId(null);
        if (typing && target instanceof HTMLElement) target.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const phaseLabel = phase === "live" ? "Live" : phase === "frozen" ? "Frozen" : "Settled";
  const countLabel = hits
    ? hits.nodes.size === 0
      ? "No marks match"
      : `${hits.nodes.size} marks`
    : `${NODES.length} nodes · ${EDGES.length} edges`;

  const reheatLayout = () => {
    setFrozen(false);
    graphRef.current?.reheat();
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink text-bone">
      <ForceGraph
        ref={graphRef}
        query={query}
        selectedId={selectedId}
        frozen={frozen}
        onSelect={setSelectedId}
        onPhase={setPhase}
      />
      <div className="chart-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="absolute top-3 right-3 left-3 z-10 md:right-auto md:w-80">
        <div className="rounded-2xl border border-line bg-panel px-3 py-3 md:px-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-brass uppercase">North Atlantic</p>
              <h1 className="font-display text-3xl leading-none text-bone">Meridian</h1>
            </div>
            <p className="text-right text-xs text-mist tabular-nums">
              <span
                className={
                  "mr-1.5 inline-block size-2 rounded-full align-middle " +
                  (phase === "live" ? "bg-sage" : phase === "frozen" ? "bg-brass" : "bg-mist")
                }
                aria-hidden="true"
              />
              {phaseLabel}
            </p>
          </div>
          <p className="mt-2 hidden text-sm text-mist md:block">
            Listening posts, ships, and the sounds between them.
          </p>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mist"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="chart-search">
              Search nodes and ties
            </label>
            <input
              ref={searchRef}
              id="chart-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (hits && hits.nodes.size > 0) graphRef.current?.fitIds([...hits.nodes]);
                else graphRef.current?.fitAll();
              }}
              placeholder="Search nodes and ties"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              suppressHydrationWarning
              className="h-11 w-full rounded-full border border-line bg-ink pr-11 pl-10 text-base text-bone placeholder:text-mist focus-visible:border-brass focus-visible:outline-none"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-full text-mist hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-mist tabular-nums" aria-live="polite">
            {countLabel}
          </p>
          <ul className="mt-2 flex flex-nowrap gap-2 overflow-x-auto">
            {LEGEND.map((item) => {
              const pressed = query.trim().toLowerCase() === item.query;
              return (
                <li key={item.kind} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setQuery(pressed ? "" : item.query)}
                    className={
                      "inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm " +
                      "transition-[background-color,border-color] duration-150 ease-out " +
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass " +
                      (pressed ? "border-brass bg-ink text-bone" : "border-line text-mist hover:border-mist")
                    }
                  >
                    <span className={"size-2.5 rounded-sm " + item.swatch} aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      {selected ? (
        <aside
          aria-label={`${selected.label} details`}
          className="inspector-scroll absolute right-3 bottom-24 left-3 z-20 overflow-y-auto rounded-2xl border border-line bg-panel p-4 md:bottom-3 md:left-auto md:w-80"
        >
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setSelectedId(null)}
            className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-full text-mist hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <p className="text-xs tracking-widest text-brass uppercase">{KIND_LABEL[selected.kind]}</p>
          <h2 className="font-display pr-10 text-2xl leading-tight text-bone">{selected.label}</h2>
          <p className="mt-2 text-sm text-mist">{selected.blurb}</p>
          <p className="mt-2 text-sm leading-normal text-bone">{selected.notes}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-mist">Ties</dt>
            <dd className="text-bone tabular-nums">{DEGREE.get(selected.id) ?? 0}</dd>
            {selected.facts.map((fact) => (
              <span key={fact.k} className="contents">
                <dt className="text-mist">{fact.k}</dt>
                <dd className="text-bone">{fact.v}</dd>
              </span>
            ))}
          </dl>
          {ties.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-bone">Tied to</h3>
              <ul className="mt-1">
                {ties.map(({ edge, other, outbound }) => (
                  <li key={edge.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(other.id);
                        graphRef.current?.focus(other.id);
                      }}
                      className="flex min-h-11 w-full items-baseline gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                    >
                      {outbound ? (
                        <>
                          <span className="text-brass">{edge.label}</span>
                          <span className="text-bone">{other.label}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-bone">{other.label}</span>
                          <span className="text-brass">{edge.label}</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      ) : null}

      <div className="absolute right-3 bottom-3 left-3 z-10 md:right-auto">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-panel p-2">
          <button
            type="button"
            onClick={reheatLayout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brass px-3 text-sm font-medium text-ink transition-[background-color,scale] duration-150 ease-out hover:bg-brass/80 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <Flame className="size-4" aria-hidden="true" />
            Reheat
          </button>
          <button
            type="button"
            aria-pressed={frozen}
            onClick={() => setFrozen((value) => !value)}
            className={
              "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium " +
              "transition-[background-color,border-color,scale] duration-150 ease-out active:scale-95 " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass " +
              (frozen ? "border-brass bg-brass text-ink" : "border-line bg-ink text-bone hover:border-mist")
            }
          >
            {frozen ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
            {frozen ? "Resume" : "Freeze"}
          </button>
          <button
            type="button"
            onClick={() => graphRef.current?.fitAll()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-ink px-3 text-sm font-medium text-bone transition-[background-color,border-color,scale] duration-150 ease-out hover:border-mist active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <Crosshair className="size-4" aria-hidden="true" />
            Fit
          </button>
        </div>
      </div>
    </main>
  );
}
