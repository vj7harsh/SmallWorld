# SmallWorld

A multiplayer digital adaptation of the Small World board game featuring procedurally generated hex maps and real-time room management.

## Getting Started

### Prerequisites
- Node.js

### Running the Server
```bash
cd server
npm install
npm run dev
```
The WebSocket server runs on port 8080.

### Running the Client
```bash
cd smallworld-client
npm install
npm run dev
```
The client runs on Vite's dev server with network access enabled.

---

# Game Rules

*Based on Small World by Days of Wonder (2009)*

## Overview

Players control fantasy races competing for territorial dominance on a map that's too small for everyone. Conquer regions, collect victory coins, and know when to put your race into decline and pick a new one.

## Setup

1. Pick the map matching the number of players
2. Place the Turn marker on the first space of the track
3. Shuffle Race banners, draw 5 and lay them faceup in a column
4. Do the same with Special Power badges, placing them next to the banners
5. Place Lost Tribe tokens on regions with Lost Tribe symbols
6. Place Mountain tokens on mountain regions (immovable)
7. Each player takes 5 Victory coins (value 1)

**Game Length:** When the Turn marker reaches the last space, play one final round. The player with the most Victory coins wins. Ties broken by most race tokens on board.

---

## Turn Structure

### First Turn

#### 1. Pick a Race and Special Power Combo

Select 1 combo from the 6 visible:
- **Top combo is free**
- Each combo below costs +1 Victory coin (place coins on combos you skip)
- Take any coins on the combo you select

Take race tokens equal to the sum of values on the race banner + special power badge.

Slide remaining combos up and reveal a new one from the stack.

#### 2. Conquer Regions

**First Conquest:** Must enter via a border region (adjacent to board edge or sea).

**To Conquer a Region:**
| Base Cost | 2 tokens |
|-----------|----------|
| +1 per | Encampment, Fortress, Mountain, or Troll's Lair |
| +1 per | Lost Tribe or enemy race token present |

*Minimum 1 token always required to initiate conquest.*

**Enemy Losses:**
- Defender permanently discards 1 token
- Remaining tokens redeploy to other owned regions at end of attacker's turn
- Single defending token is simply discarded

**Following Conquests:** Each new region must border a region you already occupy.

**Final Conquest Attempt:** If you have at least 1 unused token and are within 3 tokens of conquering a region, roll the Reinforcement Die (0-3). Add result to your remaining tokens.

**Troop Redeployment:** Freely redistribute tokens across your regions (minimum 1 per region).

#### 3. Score Victory Coins

- **1 coin per region** your active race occupies
- **1 coin per region** your declined race occupies
- **Bonus coins** from race/special power abilities

Scores are hidden until game end.

---

### Following Turns

Choose one:

#### Option A: Expand Through New Conquests

1. **Ready Troops:** Leave 1 token per region, take rest back in hand
2. **Conquer:** Follow conquest rules (no First Conquest restriction)
3. **Abandon Regions:** May completely empty regions to free tokens (lose those regions)

If you abandon ALL regions, next conquest follows First Conquest rule.

#### Option B: Put Race In Decline

1. Flip race banner to decline side
2. Discard special power (no longer in effect unless noted)
3. Keep 1 token per region, flip to decline side, remove the rest
4. **No conquests this turn** - turn ends after scoring
5. Score 1 coin per declined region (no race/power bonuses unless noted)
6. **Next turn:** Pick a new combo, follow First Turn rules

**Important:** Only 1 declined race at a time. New decline removes previous declined race.

---

## Races

### Amazons
4 extra tokens for conquest only (not defense). Remove 4 tokens at end of each Troop Redeployment; get them back when you Ready Troops next turn.

### Dwarves
+1 coin per Mine region. **Persists in decline.**

### Elves
When conquered, keep ALL tokens for redeployment (no discard).

### Ghouls
ALL tokens stay on map when declining. Can continue conquering as if active. Must conquer before your active race each turn.

### Giants
Conquer regions adjacent to Mountains you occupy at -1 token cost.

### Halflings
May enter through ANY region. First 2 conquered regions get Hole-in-the-Ground (immune to conquest). Holes removed on decline or abandonment.

### Humans
+1 coin per Farmland region.

### Orcs
+1 coin per non-empty region conquered this turn.

### Ratmen
No special ability - just lots of tokens.

### Skeletons
During Redeployment: +1 new token per 2 non-empty regions conquered this turn.

### Sorcerers
Once per turn per opponent: Replace a single enemy active token (in a region adjacent to yours) with one of your tokens. Target goes to tray.

### Tritons
Conquer Coastal regions at -1 token cost.

### Trolls
Place Troll's Lair in each region (+1 defense). Lairs persist in decline. Removed on abandonment or conquest.

### Wizards
+1 coin per Magic Source region.

---

## Special Powers

| Power | Effect |
|-------|--------|
| **Alchemist** | +2 coins per turn while active |
| **Berserk** | Roll Reinforcement Die before each conquest |
| **Bivouacking** | 5 Encampments (+1 defense each), relocate each turn |
| **Commando** | All conquests at -1 token cost |
| **Diplomat** | Choose 1 opponent who can't attack you next turn (if you didn't attack them) |
| **Dragon Master** | Once/turn: Conquer with 1 token regardless of defense. Dragon makes region immune. |
| **Flying** | Conquer any region (except Seas/Lakes) |
| **Forest** | +1 coin per Forest region |
| **Fortified** | Once/turn: Place Fortress (+1 defense, +1 coin). Max 6 on map. |
| **Heroic** | 2 Heroes make their regions immune to conquest |
| **Hill** | +1 coin per Hill region |
| **Merchant** | +1 coin per region (doubled scoring) |
| **Mounted** | Conquer Hills and Farmlands at -1 token cost |
| **Pillaging** | +1 coin per non-empty region conquered this turn |
| **Seafaring** | May conquer Seas and Lakes (keep in decline) |
| **Spirit** | Declined Spirit tokens don't count toward 1-decline limit |
| **Stout** | May decline at end of turn after conquests (not instead of) |
| **Swamp** | +1 coin per Swamp region |
| **Underworld** | Conquer Caverns at -1 cost. All Caverns adjacent to each other. |
| **Wealthy** | +7 coins at end of first turn only |

---

## Region Types

- **Border** - Adjacent to board edge
- **Coastal** - Adjacent to Sea or Lake
- **Farmland** - Bonus for Humans, Mounted
- **Forest** - Bonus for Forest power
- **Hill** - Bonus for Hill power, Mounted
- **Mine** - Bonus for Dwarves
- **Mountain** - +1 defense, immovable token
- **Magic Source** - Bonus for Wizards
- **Swamp** - Bonus for Swamp power
- **Cavern** - Connected for Underworld power
- **Sea/Lake** - Usually unconquerable (except Seafaring)

---

## Quick Reference

### Conquest Cost Formula
```
Tokens Needed = 2 + enemies + Lost Tribes + Mountains + Fortresses + Encampments + Troll's Lairs
```

### Scoring Per Turn
```
Coins = Regions(active) + Regions(declined) + Race Bonuses + Power Bonuses
```

### Reinforcement Die
- Faces: 0, 0, 1, 1, 2, 3
- Used for final conquest attempt only (unless Berserk)
