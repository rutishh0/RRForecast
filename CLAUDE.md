# Half Hands Live — working notes

See `README.md` for what this is, how to run it, scoring, and deployment. This file is for whoever (human or AI) edits the code next.

## Layout

```
src/lib/content.ts      ALL game content + GAME_CONFIG (timers, points, how many items per game). Edit here first.
src/lib/gameLogic.ts    Pure rules: state machine, scoring at reveal, timeouts, player messages. No I/O.
src/lib/types.ts        GameState / Player / messages.
src/lib/useGameSync.ts  Client hook: polling, version guard, server-clock offset, smooth countdown.
src/lib/room.ts         Room-code normalisation (client-safe).
src/server/store.ts     Persistence: Neon Postgres (or in-memory fallback), per-room batching, optimistic writes.
src/app/api/game/sync   The only endpoint. GET reads (and applies timer expiry); POST applies host actions / player messages.
src/app/host/page.tsx   Host screen. src/components/host/*
src/app/play/page.tsx   Phone controller. src/components/player/*
scripts/simulate.mjs    100-bot end-to-end assertion run. Run it after any change to gameLogic or store.
```

## Rules of the road

- **Scoring happens only at reveal** (`revealQuiz`, `revealQuiplash`, `revealFlag`). Never award points in a message handler — that is how the old vote-switch double-award and flag tap-spam exploits happened.
- **Timeouts and the host's Next share one code path** (`advance`). If you add a phase, add it there and in `applyTimeout`'s list of timed phases. A phase transition must call `resetRound` if the next phase accepts input.
- **`state.version` must increase on every mutation.** The client discards states with a lower version than it has already seen.
- **Do not read `state.timerSeconds` on the server** — it is derived on the way out (`withDerived`). Use `roundStartTime` + `timerTotal`.
- **Keep reducers re-runnable.** `store.ts` may apply a batch of mutators more than once on optimistic-write conflict.
- Player components that hold tap state must be mounted with a `key` tied to the question/prompt/scenario id (see `play/page.tsx`), so state never leaks between rounds.
- Content: wrong options must be *plausible misreadings*, short enough for a phone, and the Gen-Z line should use one or two slang terms, correctly. No name-dropping of people who aren't on the agenda.

## Verify before claiming anything works

```bash
npx tsc --noEmit && npx eslint src && npm run build
node scripts/simulate.mjs 100      # needs the dev server running
```
Then actually open `/host?room=X` and `/play?room=X` in two tabs and play a round. Rehearse against `npm run build && npm start`, not `next dev` — hot-reload sockets dying under a phone page looks like a frozen app.

Note for automated browser testing: the desktop-app browser harness sends an empty key event for "space"; use Enter to test the host shortcut.

## Event facts

Thu 1 Oct 2026, 10:40–11:15 slot (planning for 30 min), ~100 people, ~80% remote on Teams + 15–20 in the Abu Dhabi office. Runs after Omar's "12 Weeks Until Christmas" and before Graduations & Closing. Simon (pub quiz, Tue) and Katie (Never Have I Ever, Wed) run the other energisers.
