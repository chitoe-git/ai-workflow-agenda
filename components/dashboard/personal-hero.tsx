"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const quotes = [
  "Waste no more time arguing what a good person should be. Be one.",
  "If it is not right, do not do it. If it is not true, do not say it.",
  "You have power over your mind, not outside events. Realize this, and you find strength.",
  "No great thing is created suddenly. Train daily, then compound.",
  "The obstacle is not the enemy; it is the training ground.",
  "Discomfort is the price of admission for uncommon outcomes.",
  "A focused hour beats a distracted day.",
  "Win the morning, and the day starts in your favor."
];

const QUOTE_STORAGE_KEY = "agenda-saved-quotes";
const ROTATION_MS = 5 * 60 * 1000;

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function PersonalHero() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [greeting, setGreeting] = useState(getTimeGreeting());
  const [savedQuotes, setSavedQuotes] = useState<string[]>([]);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(QUOTE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setSavedQuotes(parsed);
      } catch {
        setSavedQuotes([]);
      }
    }

    const quoteTimer = setInterval(() => {
      setQuoteIndex((index) => (index + 1) % quotes.length);
    }, ROTATION_MS);

    const greetingTimer = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60000);

    return () => {
      clearInterval(quoteTimer);
      clearInterval(greetingTimer);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(savedQuotes));
  }, [savedQuotes]);

  function saveCurrentQuote() {
    const current = quotes[quoteIndex];
    setSavedQuotes((existing) => {
      if (existing.includes(current)) {
        setQuoteMessage("Already saved.");
        return existing;
      }
      setQuoteMessage("Quote saved.");
      return [current, ...existing].slice(0, 20);
    });

    window.setTimeout(() => {
      setQuoteMessage(null);
    }, 1500);
  }

  function useSavedQuote(quote: string) {
    const idx = quotes.findIndex((item) => item === quote);
    if (idx >= 0) {
      setQuoteIndex(idx);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-6 shadow-soft sm:px-8 sm:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_100%_at_100%_0%,rgba(129,99,255,0.21),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_100%,rgba(35,135,251,0.2),transparent_75%)]" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">Agenda Command</p>
          <Badge>Private console</Badge>
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {greeting}, Charlie.
        </h1>
        <p className="max-w-2xl text-sm text-ink-subtle sm:text-base">{quotes[quoteIndex]}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-ink-subtle">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--accent-cyan))]" />
            Systems online
          </div>
          <Button size="sm" variant="secondary" type="button" onClick={saveCurrentQuote}>
            Save quote
          </Button>
          {quoteMessage ? <span className="text-xs text-ink-subtle">{quoteMessage}</span> : null}
        </div>
        <details className="rounded-2xl border border-line bg-panel/70 p-3">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-ink-subtle">
            Saved quotes ({savedQuotes.length})
          </summary>
          <div className="mt-2 space-y-2">
            {savedQuotes.length ? (
              savedQuotes.map((quote) => (
                <button
                  key={quote}
                  type="button"
                  onClick={() => useSavedQuote(quote)}
                  className="block w-full rounded-xl border border-line bg-panel px-3 py-2 text-left text-xs text-ink-subtle transition hover:bg-[#242a46] hover:text-ink"
                >
                  {quote}
                </button>
              ))
            ) : (
              <p className="text-xs text-ink-subtle">No saved quotes yet.</p>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
