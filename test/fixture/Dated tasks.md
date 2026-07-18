# Dated tasks

Fixture for manually evaluating the task date bar (PR #550).
Select a node to reveal its date pills. Pills always render in a fixed
order regardless of how they appear in the source line:

> due 📅 · scheduled ⏳ · start 🛫 · created ➕ · done ✅ · canceled ❌

Each section below exercises one input format. The `id`/`dependsOn`
metadata is only there so the tasks show up as connected nodes on the map.

## Emoji format (Tasks plugin)

- [ ] Emoji · all six date types #dates ➕ 2026-07-01 🛫 2026-07-05 ⏳ 2026-07-10 📅 2026-07-20 ✅ 2026-07-15 ❌ 2026-07-16 🆔 demoji1
- [ ] Emoji · due only #dates 📅 2026-08-01 ⛔ demoji1 🆔 demoji2
- [/] Emoji · start + scheduled #dates 🛫 2026-07-05 ⏳ 2026-07-10 ⛔ demoji2 🆔 demoji3
- [x] Emoji · done date #dates ✅ 2026-07-15 🆔 demoji4
- [-] Emoji · canceled date #dates ❌ 2026-07-16 🆔 demoji5

## Inline Dataview format

- [ ] Dataview · due + scheduled + start #dates [due:: 2026-08-01] [scheduled:: 2026-07-25] [start:: 2026-07-20] [id:: ddv1] 📅 2026-07-19
- [ ] Dataview · created + completion(=done) #dates [created:: 2026-07-01] [completion:: 2026-07-30] [dependsOn:: ddv1] [id:: ddv2]

## Plain-text format

- [ ] Text · due + scheduled #dates due:2026-09-01 scheduled:2026-08-20 🆔 dtxt1

## Control — no dates (should show no pills)

- [ ] Control · no dates at all #dates 🆔 dctrl1
