import React, { useMemo, useState } from "react";
import { RULES } from "../content/RulesData";
import type { RuleCategory, RuleItem } from "../content/RulesData";


const CATEGORIES: RuleCategory[] = ["Core Rules", "Races", "Special Powers", "Artifacts", "Legendary Places"];

function matches(item: RuleItem, q: string) {
  const hay = [
    item.name,
    item.summary ?? "",
    ...(item.details ?? []),
    ...(item.tags ?? []),
    item.category,
  ].join(" ").toLowerCase();

  return hay.includes(q);
}

type RulesSectionProps = {
  embedded?: boolean; // NEW
};

export function RulesSection({ embedded = false }: RulesSectionProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RuleCategory | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RULES.filter((r) => {
      const okCategory = activeCategory === "All" ? true : r.category === activeCategory;
      const okQuery = q.length === 0 ? true : matches(r, q);
      return okCategory && okQuery;
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, RuleItem[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const item of filtered) map.get(item.category)?.push(item);
    return map;
  }, [filtered]);

  // ✅ If embedded, don't add max-width / outer padding
  const containerClass = embedded
    ? "w-full"
    : "w-full max-w-5xl mx-auto px-4 py-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col gap-3">
        {!embedded && <h2 className="text-2xl font-semibold">Rules Reference</h2>}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            className="w-full sm:flex-1 rounded-xl border px-4 py-2"
            placeholder="Search races, powers, artifacts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-xl border px-3 py-2 text-sm ${
                activeCategory === "All" ? "font-semibold" : "opacity-80"
              }`}
              onClick={() => setActiveCategory("All")}
            >
              All
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  activeCategory === cat ? "font-semibold" : "opacity-80"
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-8">
        {(activeCategory === "All" ? CATEGORIES : [activeCategory]).map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (items.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">{cat}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item) => (
                  <details key={item.id} className="rounded-2xl border p-4 shadow-sm">
                    <summary className="cursor-pointer select-none">
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name}</span>
                        {item.summary && (
                          <span className="text-sm opacity-80 mt-1">{item.summary}</span>
                        )}
                      </div>
                    </summary>

                    <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed">
                      {item.details.map((line, idx) => (
                        <p key={idx} className="opacity-90">{line}</p>
                      ))}

                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.tags.map((t) => (
                            <span key={t} className="text-xs rounded-full border px-2 py-1 opacity-80">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
