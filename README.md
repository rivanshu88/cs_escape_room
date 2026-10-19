# CS Escape Lab

Interactive CS missions: investigate a failing system, read traces, fix the code, escape the lab.

## Layout

```
src/app/                 HQ + mission routes
src/components/          Lab UI (editor, traces, hints)
src/lib/                 Shared engine contracts and runner
missions/                One folder per mission (json + starter)
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

[Adding and validating missions](./docs/ADDING_MISSIONS.md)

## First mission

`missions/dsa-binary-search` — broken binary search. Some lookups hang because `lo = mid` does not shrink the range.

- Buggy starter: c1, c2, c6 pass; c3, c4, c5 hit the step limit.
- Fix (`lo = mid + 1`): all 6 pass.
