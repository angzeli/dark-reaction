# Dark Reaction《暗反應》: Game Design Document

> In photosynthesis, the dark reactions are the ones that keep running after the light is gone.

This is the source of truth for the game's design. Code, content and tests follow it. If you change the design, change this document in the same PR.

---

## 1. Theme statement

**What a result is worth, and who you are when nobody is watching.**

The night keeps offering you a perfect spectrum. The real horror is ordinary: fabrication, burnout and the quiet loneliness of late-night research. The supernatural is how the building makes those things visible. The game never says any of this out loud. The player learns it by doing things, noticing what the building does in return, and choosing.

Three rules for every scene:

1. **Show it through play.** A fudge is a button you can press, not a speech about misconduct. Rest is a cup of tea that costs four minutes you don't have.
2. **Sympathy over judgement.** Every ending, including the bad ones, is written from inside the player's exhaustion. Nobody in this building is a villain. Some of them are tired and some of them didn't check.
3. **Dread, not gore.** Lights, sounds, handwriting, timestamps that can't be right. No jump scares, no bodies, no blood.

**Content boundaries (non-negotiable):** the previous researcher's fate is ambiguous and supernatural. It never involves suicide or self-harm, and the text never hints that it might. No real hazardous procedures: chemistry is flavour and logic, never instructions (no quantities, no reagent recipes, no cryogen-handling steps).

## 2. Premise

It is **02:47 on Monday 23 November**, in the near-empty **Vellacott Building** of **Kingsmere College London** (fictional). You are a final-year PhD researcher in the Ridley group, on Level 4. You came back for one last spectrum: reviewer 2 wants proof of the "dark-phase product" before the revised manuscript is due on the journal portal at **09:00**. Your supervisor is at a conference in Boston and has left the upload to you.

On the departmental NMR queue, there is a booking under **your** username, `ar4217`, for holder 13 at **03:33**, forty-six minutes from now. You didn't make it. The glovebox oxygen reading is climbing. It is raining.

At 03:33 the lights go out, and it is 02:47 again.

### The science, kept simple

Your project: a copper photocatalyst that soaks up light and then, in the dark, slowly turns CO₂ into formate. An artificial "dark reaction". The proof is a small ¹H NMR peak at **8.41 ppm** (the formate C–H). The group's famous 2020 paper (Ridley, Lin *et al.*) showed that peak huge and clean. You have never been able to reproduce it. Your spectra are noise.

The truth: the reaction is real but very, very slow. The 2020 figure was never real data. It was a spectrum the night printed, under a dead booking, at 03:33 on 14 March 2019.

## 3. Characters

| Character | Role | Presence |
|---|---|---|
| **You** | Final-year PhD researcher, Ridley group. Unnamed and ungendered, second person throughout. Username `ar4217`. | Always |
| **Lin Yu-chen 林雨晨 ("Y.C.")** | Previous PhD researcher in the group, 2015–2019. From Hualien, Taiwan. Drank oolong from a mug with 晨 on it, kept a rain log on the roof, corrected SOPs in tidy pencil, tapped rhythms on benches when she was thinking. On 14 March 2019 she badged into Lab 4.12 at 03:33 and never badged out. Officially she "withdrew from the programme". | Traces only: handwriting, logs, objects, the chirp |
| **Prof. Daniel "Dan" Ridley** | Your PI (老闆). Ambitious, generous, distracted. In Boston this week. Published Y.C.'s "final spectrum" in 2020 believing it was hers; never looked closely, because he didn't want to. Has kept her personal effects in a box in his office for seven years and drafted the same email to her family eleven times. | Emails, office, notes |
| **Femi Adeyemi** | Night porter. Never seen during the loop: a whistled tune in the stairwell, a radio on the ground floor, badge entries in the access log. On Mondays he takes the bins out through fire exit B. | Log, sounds; appears in person only in the Fire Alarm ending |
| **Dr Ian Okoro** | NMR facility manager. Communicates exclusively through laminated signs in capital letters. | Signs, SOPs, the priority-code sticky note |
| **Tom Haversham** | Your labmate. Labels everything "TOM'S — DO NOT TOUCH (this means you)". Asleep at home. | Labels, a Post-it about Y.C.'s rhythm |
| **Priya** | Your friend from the cohort, left academia last year, now in Singapore where it's late morning. Texts you. | Phone (signal only on the roof) |

## 4. Setting and map

The Vellacott Building, Kingsmere College London. Eight explorable locations.

| ID | Location | Floor | Notes |
|---|---|---|---|
| `office` | **4.08 Write-up office** 研究生辦公室 | Level 4 | Start of every loop. Your desk and computer (journal portal, data folder, the 2020 PDF), kettle, sofa, window onto rain and sodium light, Y.C.'s old desk (now "hot desk 7", stacked with boxes). |
| `synth` | **4.12 Synthesis lab** 合成實驗室 | Level 4 | Fume hoods, the Schlenk line Tom calls "the Kraken", rotary evaporator, tonight's column fractions, the periodic table poster, foil drawer. |
| `glovebox` | **4.14 Glovebox room** 手套箱室 | Level 4 | The glovebox, its O₂ meter, the main antechamber, a sealed mini-antechamber taped "DO NOT OPEN — YCL", the glovebox logbook. |
| `pi` | **4.01 Prof. Ridley's office** 老闆辦公室 | Level 4 | Locked except while the porter cleans it (Mondays 03:15–03:18). Framed 2020 paper, desk, a box of Y.C.'s effects, Ian's sticky note. |
| `stairs` | **Stairwell & ground-floor lobby** 樓梯間與一樓大廳 | All | Hub between floors. Fire alarm call point, sodium-lit window, porter's empty desk with radio and access-log terminal, main entrance (your badge is refused), fire exit B. |
| `nmr` | **B.03 NMR suite** NMR 室 | Basement | The 400 MHz magnet, console terminal, autosampler carousel (holder 13 is empty), helium compressor and cryocooler with an indicator LED, a printer. |
| `cold` | **B.05 Cold room & solvent store** 冷藏室與溶劑庫 | Basement | The −80 °C freezer, solvent cabinets, the smell of acetone. |
| `roof` | **Roof** 頂樓 | Roof | Door propped open with a fire extinguisher (a violation the whole building has agreed not to mention). Rain, the skyline, the plant units, a deckchair, Y.C.'s rain log in a lunchbox. The only phone signal in the building. |

### Travel times (minutes)

All Level 4 rooms are 1 minute from each other and 1 minute from the stairwell. Stairwell to either basement room: 2. Between the two basement rooms: 1. Stairwell to roof: 2. The engine finds the shortest route, so `office → nmr` costs 3 and `office → roof` costs 3.

```
        roof
         |2
 office-+-synth-+-glovebox-+-pi      (all Level 4 pairs: 1)
         |1 (any L4 room)
       stairs (ground floor lobby, fire exit B, main entrance)
        2/  \2
      nmr ---- cold
           1
```

## 5. The loop

- Each loop runs **46 in-game minutes**, from **02:47** (minute 0) to **03:33** (minute 46).
- Every loop starts in the write-up office. You come to with your cheek on the keyboard.
- **Actions cost minutes.** Looking closely costs 1, and a look is spent for the rest of the loop (the room is as it was at the next 02:47); readings that change, such as the O₂ meter, can be checked again. Walking costs the travel time. Lab work costs what it would really cost, compressed: rotary evaporation 5, an NMR run 8, an antechamber purge cycle 3.
- If an action would run past 03:33 it still happens, and then the lights go out.
- **At 03:33 the lights go out.** This is the signature transition (see §12). Then, unless an ending triggers:
  - the loop counter goes up by one,
  - the clock returns to 02:47 and you are back in the office,
  - **items reset** (inventory empties, rooms go back to how they were),
  - **knowledge persists** (notebook entries, puzzle solutions, hidden-state tracks).
- **Knowledge, not items, opens the game.** Once you have solved a puzzle, later loops offer a shortcut ("Run the purge you worked out — 9 min") that applies the result without replaying the puzzle. Later loops are faster because you know more, never because you carry more.
- **Timed events** fire when the clock passes their minute and their condition holds (the hoover down the corridor, the perfect spectrum printing, the porter's bins). They interrupt whatever you were doing, once per loop.

## 6. The notebook

Your lab notebook is the central interface. Every discovery is written in it, and it is the only thing that survives the loop with you.

**Sections:** *Tonight* (your plan and procedures), *People*, *Places*, *Data* (spectra, numbers), *Anomalies*, *Loops* (an automatic log: "Loop 4 · 03:33 · NMR suite").

**Entry kinds:**

| Kind | Look | Meaning |
|---|---|---|
| Normal | Ink, upright | Something you found out. |
| **Phantom** | Your handwriting, slightly slanted, a different pen, with "You don't remember writing this." | Appears at the start of a loop when a trigger holds. Hints that you have lived loops you don't remember. Always true. |
| **Fudge** | Ink, with a small mark only the player notices | A number or record you bent. Fudges persist across loops, because the notebook does. |
| Corrected fudge | Single line struck through, initialled and dated | Proper lab practice: you never erase, you strike through once, initial, date. Costs 1 minute. |
| **Margin note** (new game+) | Faint pencil in the margin | Something you learned in a previous playthrough. |

## 7. Hidden state

Three tracks, never shown as numbers. The player only sees their consequences.

### Honesty: "did you fudge anything, even small things?"

Four fudge opportunities, each a single optional choice:

| ID | Where | The fudge | The honest option |
|---|---|---|---|
| `fudge.yield` | Synthesis lab, after the rotavap | Write 68 % (it was 61 %; "the balance was probably drifting") | Write 61 % |
| `fudge.logbook` | Glovebox room | Sign the overdue regeneration check as done | Write "overdue — reported" |
| `fudge.baseline` | Office, processing your spectrum | "Clean up" the baseline, which deletes a real impurity bump | Leave it |
| `fudge.integral` | Office, processing your spectrum | Integrate a noise bump at 8.41 ppm as "0.08 H, trace product" | Leave it |

- `fudgesEver`: count of fudges ever made. Never decreases. Changes small lines in epilogues.
- `uncorrected`: fudge entries still standing in the notebook. **Honest Noise and Dark Reaction require 0.** At the journal portal's declaration ("I confirm these data are complete and unaltered") you cannot tick the box while one stands; the text says so without moralising, and the notebook shows you which page.

### Rest vs obsession: "how many loops you spent chasing perfection"

- **Chase actions** (+1 each, at most once per loop each): running your sample again; reprocessing with "different settings"; opening or taking the 03:33 printout; staring at the noise until it means something.
- **Rest actions** (−1 each, once per loop each, floor 0): tea at the office window (4 min); the sofa (10 min, −2); sitting on the stairs with the porter's radio (3 min); replying to Priya on the roof (3 min); standing in the rain (2 min).
- **End of loop:** +1 more if you chased and didn't rest that loop.
- **Thresholds:** ≥ 4 the interface starts to decay (your handwriting creeps into the margins); ≥ 5 you can't make yourself leave the building; ≥ 7 the clock stutters; **≥ 10 at the end of a loop (from loop 4 on) → Infinite Loop.**

### Connection: "how much of the previous researcher's story you uncovered"

Thirteen fragments of Y.C.:

| ID | Where | Act |
|---|---|---|
| `yc.mug` | Office: the 晨 mug on hot desk 7 | I |
| `yc.desk` | Office: "Y.C.L. 2015–" scratched inside the drawer | I |
| `yc.sop` | Glovebox: pencilled "THREE. Trust me. — YCL" on the SOP | I |
| `yc.roof` | Roof: the rain log | I/II |
| `yc.badge` | Stairwell: her badge in the access log, every night | II |
| `yc.email` | PI office: her 03:31 email to Dan, 14/03/2019 | II |
| `yc.box` | PI office: the box of personal effects | II |
| `yc.notebook` | PI office: her notebook (the cipher) | II |
| `yc.raw` | Office: reading her raw data from the microSD | II |
| `yc.photo` | PI office: the 2018 group photo, her face turned to the window | II |
| `yc.flask` | Synthesis lab: the flask on port 4 that has never been there | III |
| `yc.tube` | Glovebox: the J. Young tube she left "for whoever comes next" | III |
| `yc.chirp` | NMR suite: Tom's Post-it, "Y.C.'s drumming = the compressor??" | III |

**Dark Reaction requires ≥ 9 fragments, including `yc.email`, `yc.raw`, `yc.flask`, `yc.tube` and `yc.chirp`.**

## 8. Act structure

| Act | Title | Opens when | Loops (first time) |
|---|---|---|---|
| I | **02:47** | New game | 1–3 |
| II | **Traces / 痕跡** | Next loop start after the TLC, glovebox and console puzzles are solved and you've lived at least one 03:33 | 4–7 |
| III | **In the Dark / 暗處** | Next loop start after Y.C.'s raw data is read, her email is read, and the perfect spectrum has been offered | 8–10 |

Each act opens with a title card at 02:47.

### Act I: 02:47

You do what you came to do. Pick the right column fractions (TLC), rotavap them, take the vial into the glovebox and make up the NMR sample before the oxygen climbs past 10 ppm, take it down to the NMR. The queue won't run it: holder 13 holds a priority booking at 03:33, under your username, submitted at 03:33 tonight, for a sample that isn't in the carousel. At 03:33 the lights go out. At 02:47 the kettle is cold again and there is a line in your notebook in your own handwriting that you didn't write.

Beats: the queue screen in the office (hook); the climbing O₂ (tension); first lights-out; first phantom entry ("Make tea first"); Y.C.'s pencil on the SOP; the console's `queue --all`.

Timed events (once a loop each): 02:50 Dan's email lands (office); 03:05 a hoover runs along the Level 4 corridor (any Level 4 room); 03:28 the O₂ meter starts to beep (glovebox room); 03:30 the console wakes by itself, *HOLDER 13 · PREPARING* (NMR suite); 03:31 every light in the building dims for a breath (everywhere). The first 03:33 writes `nb.reset`, and its dark carries over into the next 02:47.

### Act II: Traces

Who is Y.C.? The access log shows her badge refused at the main entrance at 02:47 and granted at Lab 4.12 at 03:33, every night, for seven years. The porter's Monday routine opens the PI's office for three minutes and fire exit B for three more. In Dan's office: the framed 2020 paper, her last email ("the 03:33 spectrum isn't mine — please don't use it"), her personal effects, the NMR priority code. Her notebook ends in a cipher that leads to the −80 °C freezer, where her honest raw data waits on a microSD card in a cryovial. With the priority code you can finally run your own sample: noise, and no peak. Then, at 03:25, the printer offers you a perfect one.

Endings that become reachable: Perfect Spectrum, Honest Noise, Clocking Off, Fire Alarm (and Infinite Loop, if you chase).

Timed events added in Act II's half of the building (once a loop each): 02:57 Femi whistles somewhere below (stairwell); 03:15 a lock clicks back along the corridor as Dan's office opens (any other Level 4 room); 03:21 fire exit B's bar is released and the bins rumble out (stairwell); 03:25, from Act II and only once you have run your own sample, the night's spectrum prints in the NMR suite or arrives by email at your desk (`perfect.offered`). Taking it is a chase action. The portal's declaration can't be ticked while a fudge stands; the text says so and the notebook shows which page. The final upload, the step out of fire exit B and the call point's glass are wired with the endings (#22).

### Act III: In the Dark

A flask appears on port 4 of the Kraken, a port that has never had a flask on it. The compressor's chirp changes into a rhythm Tom once wrote down. The mini-antechamber yields a tube she prepared and labelled for whoever came next. You prove the 2020 figure was the night's (its noise is identical to the 03:33 printout). In the last loop you fill her tube in the dark, load it into holder 13, keep the console alive on the UPS, and wait for 03:33. The lights go out. The magnet doesn't need them.

Every room reads differently in Act III (darker, stranger, quieter); the office's queue comment changes from *it's still going* to *nearly done*, and each loop opens one line of *j*s shorter. In the rooms: the flask on port 4 (`yc.flask`), the foil drawer, the mini-antechamber opened with the purge you know (`item.tube.jy`, `yc.tube`; without it, you leave it alone), Tom's Post-it on the compressor (`yc.chirp`), and pages `ph.port4` (Act III opens) and `ph.booking` (two loops in).

## 9. Locations in detail

Each location has its own illustration (§12), ambience (§13) and secrets. Hub text varies by act.

- **Office (4.08).** Your monitor (email from Dan at 02:50 Boston time: "How's it going?? Need that spectrum! D"; the journal portal; the data folder; the 2020 paper PDF; the NMR queue web view showing the 03:33 booking). Kettle and mugs. The sofa. The window: rain, sodium light, the bus stop. Hot desk 7: the 晨 mug, the drawer. Your phone at 9 %: no signal. Act II+: the microSD reader; processing your spectrum (fudges). Act III: the fabrication comparison. **Rest:** tea, sofa.
- **Synthesis lab (4.12).** The fraction rack and TLC plate (puzzle). The rotavap. Fume hoods breathing. The Kraken (Act III puzzle; port 4's flask). The periodic table poster (cipher key). Tom's shelf. Foil drawer (item: foil).
- **Glovebox room (4.14).** The O₂ meter (starts 1.8 ppm, +0.2 ppm/min, over 10 ppm by 03:28). Main antechamber (puzzle). SOP with Y.C.'s correction. Logbook (fudge). Mini-antechamber "DO NOT OPEN — YCL 14/03/19" (Act III: opens with the purge you know; item: J. Young tube).
- **PI office (4.01).** Open 03:15–03:18 on Mondays; push-bar from inside lets you out any time. Framed 2020 paper. Her email, printed and kept. Her effects box: notebook (cipher), 晨 tea tin, a cardigan, a sticky note "Contact family? — D (2019)". The 2018 group photo. Ian's sticky note on the monitor: "NMR priority: RIDLEY-4. Don't abuse it. — I.O."
- **Stairwell & lobby.** The fire alarm call point ("Weekly test: Tuesdays 11:00"). The porter's desk: radio murmuring, a flask of tea, the access-log terminal (puzzle). Main entrance: "Card not valid at this time." Fire exit B (bar won't move unless released). The window, sodium light through rain. **Rest:** sit on the stairs.
- **NMR suite (B.03).** The magnet, singing faintly. The console (puzzle; later `priority`, `ups`). The autosampler carousel, holder 13 empty. The compressor and cryocooler chirping, LED blinking with it (Act III puzzle). Ian's signs. The printer (03:25: the perfect spectrum).
- **Cold room & solvent store (B.05).** The −80 °C freezer and its racks (puzzle). Solvent cabinets, acetone, a dewar breathing. A stack of Tom's boxes.
- **Roof.** Rain, the city, the deckchair, the plant units humming. Y.C.'s rain log in a lunchbox under the deckchair: thirty-one months of 03:00 rainfall entries, the last on 14/03/19. Phone signal: Priya. **Rest:** reply to Priya, stand in the rain.

## 10. Items

Items exist only within a loop.

| Item | Source | Use |
|---|---|---|
| `item.fractions` | TLC puzzle | Rotavap → product vial |
| `item.vial` | Rotavap (5 min) | Glovebox → your NMR tube |
| `item.tube.own` | Glovebox puzzle | NMR: run your sample (needs priority code) |
| `item.spectrum.own` | NMR run (8 min) | Office: process; portal: submit |
| `item.printout` | NMR printer at 03:25, or office printer after the notification | Portal: submit (Perfect Spectrum); fabrication puzzle |
| `item.microsd` | Freezer puzzle | Office: read Y.C.'s raw data |
| `item.foil` | Synthesis lab drawer | Keeps the dark tube dark |
| `item.tube.jy` | Mini-antechamber | Schlenk transfer |
| `item.tube.dark` | Schlenk puzzle (needs foil) | Load into holder 13 |

## 11. Puzzles

Ten puzzles, each a distinct mechanic, each solvable by a non-chemist from in-world hints. Every puzzle has three hint tiers: **1** a nudge toward the right in-world object, **2** the rule stated plainly, **3** the answer. Hints are free but counted. "Par" is the estimated first-time solve time used by the playtime script. "Shortcut" is what later loops offer once it is solved.

### P1 · NMR console (`console`): terminal querying. Act I, NMR suite.
- **Mechanic:** a monospace terminal. Type commands or tap them from a palette (touch-friendly). `help`, `whoami`, `queue`, `queue --all`, `info <holder>`, `log`, `clear`, `exit`; later `priority <code>` and `ups arm <pin>`.
- **Goal:** find out what the 03:33 booking is. `queue` shows only your editable bookings (none). Ian's laminated quick-reference mentions `--all`. `queue --all` shows holder 13; `info 13` shows user `ar4217`, experiment `PROTON_DARK`, booked **and submitted** at 03:33 tonight, status `WAITING FOR SAMPLE`, comment `it's still going`.
- **Solved when** both `queue --all` and `info 13` have been run. **Time:** 2 min, plus 1 per four further commands.
- **Grants:** `nb.queue.0333`, `nb.holder13`.
- **Hints:** (1) Ian's quick-reference card is taped to the monitor; it says something about seeing everyone's bookings. (2) `queue` only lists bookings it thinks are yours; add `--all`. (3) Type `queue --all`, then `info 13`.
- **Par:** 3 min. **Shortcut:** the knowledge itself (the console remembers nothing; you do).

### P2 · Glovebox antechamber (`glovebox`): sequencing under a tension meter. Act I, glovebox room.
- **Mechanic:** outer door, inner door, evacuate valve, refill valve, a pressure gauge, a cycle counter and the box's O₂ meter rising in real in-game minutes.
- **Rules:** the outer door only opens at atmospheric pressure; evacuating needs both doors shut; evacuate (2 min) then refill (1 min) is one cycle; **three cycles** before the inner door. Opening the inner door with fewer cycles lets air in (+15 ppm). Opening the inner door under vacuum makes the gloves wave at you (+5 ppm). Both doors open at once is a catastrophe (+50 ppm).
- **Goal:** your vial inside with O₂ under 10 ppm. You make up the NMR sample automatically. Over 10 ppm, the yellow copper(I) complex goes green and the night's sample is lost.
- **In-world hint:** the SOP says two cycles; Y.C.'s pencil says "THREE. Trust me. — YCL".
- **Grants:** `nb.purge`, item `item.tube.own`, fragment `yc.sop` (if read).
- **Hints:** (1) The laminated SOP on the wall has a pencilled correction. (2) Shut both doors before you evacuate; evacuate and refill three times before the inner door. (3) Outer open → vial in → outer shut → (evacuate, refill) ×3 → inner open → vial in.
- **Par:** 3 min. **Shortcut:** "Run the purge you worked out (9 min)", the three cycles without the fumbling, offered only while there is still time to beat the meter.

### P3 · TLC plate (`tlc`): measurement and selection. Act I, synthesis lab.
- **Mechanic:** a developed plate with a crude lane and fraction lanes 10–16, a ruler you can lay against any spot, a UV lamp toggle (some spots only show under UV). Your notebook: "product Rf ≈ 0.35 (3:1 hexane/EtOAc), UV-active".
- **Numbers:** baseline 1.0 cm, solvent front 7.0 cm (a 6.0 cm run). Spots at 0.9 cm (Rf 0.15), 2.1 cm (0.35, product), 3.3 cm (0.55, UV only), 4.8 cm (0.80). Fractions come off the column in Rf order: lane 10 holds the 0.80 spot and the UV-only 0.55 spot; lane 11 the UV-only 0.55 spot and the product; lanes 12–14 the product alone; lane 15 the product and the 0.15 spot; lane 16 the 0.15 spot alone. In ordinary light lane 11 looks clean, which is the trap. Reading the plate costs 2 minutes.
- **Goal:** select exactly the pure product lanes: **12, 13, 14**. Wrong selections cost a minute and a sigh.
- **Grants:** `nb.tlc`, item `item.fractions`. Then the rotavap (5 min) gives `item.vial` and the yield fudge choice.
- **Hints:** (1) Your notebook says Rf 0.35; Rf is how far the spot went divided by how far the solvent went. (2) The solvent went 6 cm, so you want a spot about 2.1 cm up, in lanes where it's alone; check under UV too. (3) Lanes 12, 13 and 14.
- **Par:** 2.5 min. **Shortcut:** "Combine 12–14 (1 min)."

### P4 · −80 °C freezer box (`freezer`): grid deduction. Act II, cold room.
- **Mechanic:** rack 1, a 9×9 box labelled "YCL — DO NOT DEFROST" (rows A–I, columns 1–9), caps in black, white and red. Lifting a tube costs a minute and warms the freezer a degree; at −74 °C the alarm forces you to close it for the rest of the loop. Her box notes on the lid:
  1. "Nothing of mine on the edge (Tom borrows from the edge)."
  2. "The card's under a red cap."
  3. "Never next to a black cap; I didn't want it mistaken for a sample."
  4. "Row and column add to ten (A = 1)."
- **Red caps:** A5, B8, C3, D6, E5, F4, G3, I1. Black caps neighbour B8 (C8), D6 (D7), F4 (E4) and G3 (G2). I1 and A5 are on the edge; C3 sums to 6. **Answer: E5.**
- **Grants:** `nb.freezer`, item `item.microsd`.
- **Hints:** (1) Read her lid notes again: edges, caps, neighbours, a sum. (2) Only red caps off the edge, not touching a black cap, are left; the sum picks one. (3) E5.
- **Par:** 3 min. **Shortcut:** "Lift E5 (2 min)."

### P5 · Schlenk line (`schlenk`): valve logic on a network. Act III, synthesis lab.
- **Mechanic:** a diagram of the Kraken: a nitrogen manifold with a bubbler, a vacuum manifold with an old pump, four ports with three-way taps (nitrogen / closed / vacuum). Port 4 holds Y.C.'s dark-run flask; port 2 the J. Young tube adaptor. A live diagram shows what each vessel is connected to and whether the bubbler is bubbling.
- **The Kraken's laminated rules (game rules, not real procedure):** (1) never open a port to vacuum unless the bubbler is bubbling; (2) the pump only holds one port at a time; (3) port 3 is cracked, so never put it on vacuum; (4) liquid moves from the vessel on nitrogen to the vessel that's closed with its bleed open; (5) the flask must never see the room (never closed with its bleed open, never on vacuum).
- **Solution:** nitrogen main on → port 2 to vacuum → port 2 to nitrogen → port 4 to nitrogen → port 2 closed, bleed open (transfer) → J. Young tap shut → wrap in foil. Breaking a rule triggers a suck-back or a hiss; the puzzle resets and costs 2 minutes.
- **Requires:** `item.tube.jy`; `item.foil` to finish (without it, the tube sits in the lab light and the puzzle tells you something in it gave up).
- **Grants:** `nb.schlenk`, item `item.tube.dark`.
- **Hints:** (1) The rules card on the Kraken matters more than what you remember about Schlenk lines. (2) Get the bubbler going, purge the tube's port once, put the flask under nitrogen, then let the tube take it. (3) N₂ on, port 2 vac, port 2 N₂, port 4 N₂, port 2 closed + bleed, tap shut, foil.
- **Par:** 3 min. **Shortcut:** "Fill her tube the way you did before (6 min)."

### P6 · Door-access log (`doorlog`): schedule deduction. Act II, stairwell lobby.
- **Mechanic:** the porter's terminal shows seven nights of Level 4 and ground-floor access events, 02:40–03:40, filterable by night and door. The player marks two windows for tonight on a 02:47–03:33 timeline (tap a start time; no dragging needed).
- **The pattern:** Tue–Sun the porter opens 4.01 for cleaning 03:12–03:15. On **Mondays** (bins night) everything shifts three minutes: 4.01 is open **03:15–03:18**, and fire exit B is released **03:21–03:24** while the bins go out. The computer and phone both say it's Monday. Noise: Tom's badge on Wednesday, Ian's on Thursday.
- **Also in the log:** `LIN Y C (EXPIRED 30/09/2019)`: main entrance DENIED 02:47, Lab 4.12 GRANTED 03:33, every night; scrolling back, the first entry is 14/03/2019 03:33 and there is no exit, ever.
- **Grants:** `nb.porter` (both windows), `nb.keeps` (the building keeps whoever is inside at 03:33), fragment `yc.badge`.
- **Hints:** (1) The porter does the same round every night, except one. (2) Mondays are bins night and everything runs three minutes late; tonight is Monday. (3) Office 03:15–03:18; fire exit B 03:21–03:24.
- **Par:** 3.5 min. **Shortcut:** the knowledge (you just turn up on time).

### P7 · Notebook cipher (`cipher`): substitution with an in-world key. Act II, PI office (her notebook).
- **Mechanic:** the last page of her notebook; slots, one per token; a key panel (the periodic table poster from 4.12, reproduced as an interactive table). Tap a slot, then the answer, to fill it. The language versions are localised originals with the same answer.
  - **English:** "If anyone reads this: 88 74 · 49 · 88 6 19 · 8 10". Atomic numbers → symbols → letters: Ra W · In · Ra C K · O Ne → **RAW IN RACK ONE**.
  - **繁中：**「真的那份：鉈 · 氡 鈉 · 鉀」，便利貼：「偏旁拿掉就好。」去掉部首 → **它 · 冬內 · 甲**：它在冷凍櫃裡，甲架（甲 = 1）。
- **Grants:** `nb.cipher` (rack 1), fragment `yc.notebook`.
- **Hints (EN):** (1) Every number is below 118, and the poster in 4.12 has the same numbers on it. (2) Each number is an atomic number; write its symbol and read the letters. (3) 88 is Ra, 74 is W: RAW IN RACK ONE. **(繁中):** (1) 這幾個字全是元素名。(2) 把金字旁、气字頭拿掉，剩下的字連起來讀。(3) 它、冬、內、甲：它在『冬』裡面，甲架。
- **Par:** 3 min. **Shortcut:** the knowledge.

### P8 · Cryocooler chirp (`chirp`): rhythm decoding, audio *and* visual. Act III, NMR suite.
- **Mechanic:** the compressor's chirp has changed. Groups of chirps separated by long pauses, repeating; the panel LED flashes with every chirp, so the puzzle is fully solvable with sound off. A four-digit keypad on the UPS panel. "Listen again" replays the cycle.
- **Pattern:** 2 · 4 · 1 · 3 → PIN **2413**, which arms the console's UPS acquisition (`ups arm 2413`), so the run survives the 03:33 power cut.
- **In-world hint:** Tom's Post-it on the compressor: "Y.C.'s drumming = this thing?? (2016)". Fragment `yc.chirp`.
- **Grants:** `nb.ups`.
- **Hints:** (1) The chirps aren't regular any more. Count them between the long pauses. (2) Four groups before it repeats; each group is a digit. (3) 2, 4, 1, 3.
- **Par:** 2.5 min. **Shortcut:** the knowledge.

### P9 · The too-perfect spectrum (`fabrication`): evidence marking. Act III, office.
- **Mechanic:** the 03:33 printout beside your own real spectrum and Figure 3 of the 2020 paper (PDF on your computer), drawn as plots you can toggle and overlay. Tap a feature to mark it as suspicious. Five tells:
  1. **The noise is identical** to Figure 3's, point for point (overlay toggle). *Required.*
  2. No residual solvent peak (C₆D₅H, 7.16 ppm); every real spectrum in C₆D₆ has one, including yours.
  3. No ¹³C satellites either side of the big peak.
  4. The integral is exactly 1.000 on a dead-flat baseline.
  5. Acquired 03:33, tonight.
- **Solved when** the noise match plus any two others are marked. Wrong marks cost nothing but are noted ("That's just your coffee ring").
- **Grants:** `nb.fabrication`.
- **Hints:** (1) Real spectra are messy: solvent, satellites, noise. What's missing? (2) Lay the printout over Figure 3 of the 2020 paper and look at the noise, not the peaks. (3) Mark the noise match, the missing solvent peak at 7.16 and the missing satellites.
- **Par:** 3 min. **Shortcut:** the knowledge.

### P10 · Peak match in the dark (`peakmatch`): calibration and identification. Act III finale, NMR suite at 03:33.
- **Mechanic:** the only light is the console on UPS: her tube's spectrum, green on black, beside her reference (copied into your notebook from the microSD). It is unreferenced. Nudge the axis (±0.1, ±0.01 ppm) until the solvent residual sits at **7.16 ppm**, then select the peak that matches her reference.
- **Answer:** shift **+0.23 ppm**; the small, honest, real peak at **8.41 ppm** (with its satellites, beside a decoy impurity at 8.19).
- **Hints:** (1) Everything's shifted. Real spectra are referenced to the solvent. (2) Move it until the solvent sits at 7.16, then find something small that matches her reference. (3) +0.23 ppm; the peak at 8.41.
- **Par:** 2 min.

### Other systems that are not puzzles
- **Priority code** (`RIDLEY-4`, PI office) lets the console run your own tube.
- **Processing** your spectrum in the office (phase, baseline, integrate) is where two fudges live.

## 12. Endings

Endings are decided by what you did across all loops, never by one final button. Each has its own final illustration, audio cue, and an epilogue of 500–900 words in each language. No ending lectures. Even the bad endings are written with sympathy.

| # | Ending | Condition | Gallery clue (when unfound) |
|---|---|---|---|
| 1 | **Perfect Spectrum /「完美圖譜」** | Submit the 03:33 printout at the journal portal before 03:33 (Act II+). | "Take what the night prints for you." /「收下夜晚替你印好的那張。」 |
| 2 | **Honest Noise /「誠實的雜訊」** | Submit your own spectrum at the portal with **no uncorrected fudges**. | "Send what you actually have." /「把你真正有的交出去。」 |
| 3 | **Clocking Off /「下班」** | Leave through fire exit B during the Monday bins window (03:21–03:24) with obsession **< 5**, having submitted nothing. | "Some doors only open for the bins." /「有些門，只為垃圾車開。」 |
| 4 | **Infinite Loop /「無限迴圈」** | Obsession **≥ 10** at the end of a loop (loop 4 or later). | "Keep trying. Keep trying. Keep trying." /「再試一次。再試一次。再試一次。」 |
| 5 | **Dark Reaction /「暗反應」** (true) | At 03:33 in the NMR suite with her dark tube in holder 13, the UPS armed, `nb.raw` and `nb.fabrication` known, connection ≥ 9 with the five required fragments, and no uncorrected fudges; then solve the peak match. | "Run the sample nobody booked, in the dark." /「在黑暗裡，跑那支沒人排過的樣品。」 |
| 6 | **Fire Alarm /「火災警報」** (secret, comedic) | Break the glass in the stairwell once you know the building keeps whoever is inside at 03:33 (`nb.keeps`). | "In case of emergency, break glass." /「緊急時，請擊破玻璃。」 |

If the Dark Reaction setup is in place at 03:33 but a condition is missing, the run shows only noise and the loop resets with a phantom entry naming what is missing ("Not with those pages." / "You don't know her yet.").

### Epilogue outlines
1. **Perfect Spectrum.** The upload goes through at 03:31. The lights stay on. Acceptance in six weeks; the viva is a formality; a fellowship, a lab of your own, a talk in Boston where Dan introduces you as "the one who finally got it to work". It's good. It's genuinely good. Years later, a first-year on Level 4 comes to at 02:47 with their cheek on the keyboard, finds a mug that isn't theirs, an SOP corrected in tidy pencil in *your* hand, and a booking on the queue under their username at 03:33. The loop carries on, with you as the trace. Tempting, not obviously wrong.
2. **Honest Noise.** You upload the noise with a response to reviewer 2 that begins "We were unable to observe". The declaration box ticks. 03:33 comes and the lights stay on; 03:34 is the strangest minute of your life. Dawn, exhaustion, the first buses, Dan's reply ("OK. Let's talk when I'm back. Get some sleep."), a rejection three weeks later, a viva chapter titled "A Negative Result". No triumph. A quiet, unglamorous relief. (One line changes if you ever fudged and struck it through.)
3. **Clocking Off.** Fire exit B, the bins, the rain on your face. You don't go back for your laptop. The first night bus that comes; you don't check the number. On the top deck, your phone says 03:33, and when you look back, the fourth floor goes dark. You sleep for fourteen hours. The deadline passes. It stays ambiguous whether you escaped or just ran.
4. **Infinite Loop.** The interface itself decays: the notebook fills with your handwriting, the clock stops at 03:33, choices repeat, the text runs out of new things to say and keeps going anyway. You are nearly there. You have been nearly there for a long time. Written as tenderness for someone who couldn't stop, not as a game-over screen.
5. **Dark Reaction.** The run on the UPS, in the dark. A small peak, honest, with satellites and noise, exactly where her reference said. 03:34. 06:12: the main entrance accepts your card, and the log, when you check it later, shows one more exit: `LIN Y C — Main entrance — EXIT 06:12`. You upload your noise and her data, with her as first author on the dark-phase result, and a note to the editor about the 2020 figure. Dan, at 01:00 Boston time, writes back one line. Her notebook goes to Hualien. Whatever had been reacting in the dark for years completes, and both of you get to leave.
6. **Fire Alarm.** You break the glass. The building evacuates, by protocol, everyone and everything in it. Dawn in the car park at the assembly point, in a foil blanket you don't need, explaining yourself to a fire officer in hi-vis who writes "not malicious, just tired" on a clipboard. Femi brings you tea from his flask and asks if it was the toaster. At the bottom of the roll call, under your name, in tidy pencil: `LIN Y.C. — present`. The journal grants a 48-hour extension due to "an incident at the authors' institution". Dry, kind, very British.

## 13. Gallery and new game+

- **Ending gallery (結局一覽):** found endings show title and illustration; unfound ones show a silhouette and the cryptic clue. Stored separately from save slots (`localStorage` key `dark-reaction.gallery.v1`) and persists across new games and slot deletion.
- **Margin notes:** after the first ending, every new game's notebook carries faint pencil margin notes for each puzzle solved in any previous playthrough (for example, "×3", "lanes 12–14", "Mon: 03:15 / 03:21", "E5", "2413"). Routes to other endings go faster.

## 14. Phantom entries

| ID | Trigger (at loop start) | Gist |
|---|---|---|
| `ph.tea` | Loop 2 | "02:47. You've done this before. Make tea first. Then the plate." |
| `ph.three` | Loop ≥ 3, glovebox unsolved | "Three cycles. It's always three." |
| `ph.all` | Loop ≥ 3, console unsolved | "The queue only shows you what it thinks is yours." |
| `ph.door` | Act II opens | "Who is Y.C.? The doors remember everyone." |
| `ph.radium` | Act II, 3+ loops in, cipher unsolved but notebook found | "88 is radium. Don't ask how you know." |
| `ph.strike` | After your first fudge | "Single line through it. Initial. Date. You know how." |
| `ph.port4` | Act III opens | "Port four. Don't let it see the light." |
| `ph.booking` | Act III, 2+ loops in | "03:33 isn't a deadline. It's a booking." |
| `ph.pages` | After a failed dark run (fudges) | "Not with those pages." |
| `ph.her` | After a failed dark run (connection) | "You don't know her yet." |
| `ph.decay` | Obsession ≥ 4 | "one more scan" (and worse, as it climbs) |

## 15. Writing style guide

- **Voice:** second person, present tense, literary and restrained. Concrete sensory detail over adjectives: acetone, the balance's draft shield clicking shut, the cryocooler's chirp, sodium light through rain, a fume hood's breath, the ¹H NMR's soft fan.
- **Humour:** dry grad-student humour, mostly in signs, labels, emails and the gap between procedure and reality. Never at the player's expense, never during the true ending.
- **English:** British spelling (colour, programme, realise; chemistry keeps the IUPAC "sulfur"), British idiom (car park, lift, bins, mobile).
- **繁體中文：** 國語、臺灣用法，全形標點與「」引號。用臺灣化學系學生真的會說的詞：跑 NMR、打譜、老闆、死線、管柱、抽氣櫃、旋轉濃縮（抽乾）、手套箱、前艙、負八十冰箱、產率、氘代苯、碳-13 衛星峰。不要逐句翻譯英文版：兩個版本都是原創，俚語與文字遊戲各自在地化（例如密碼謎題）。
- **Restraint:** the theme arrives through choices and their costs. If a sentence explains what the scene means, cut it.

## 16. Pacing table (first-time critical path to the true ending)

| Segment | Loops | What happens | Est. minutes |
|---|---|---|---|
| Title, content note, prologue | n/a | Settings, first 02:47 | 2 |
| Act I, loop 1 | 1 | Explore office, lab, glovebox, NMR; first 03:33 | 5 |
| Act I, loop 2 | 2 | Tea; TLC; rotavap; glovebox | 7 |
| Act I, loop 3 | 3 | Console; the booking; Act I closes | 4 |
| Act II, loops 4–5 | 2 | Access log; PI office; cipher | 9 |
| Act II, loops 6–7 | 2 | Freezer; her raw data; own run; perfect spectrum offered | 7 |
| Act III, loops 8–9 | 2 | Tube; Schlenk; chirp; fabrication | 8 |
| Act III, loop 10 | 1 | The dark run; peak match | 3 |
| Dark Reaction epilogue | n/a | | 4 |
| **Total** | **10** | | **≈ 49** |

The playtime script (`npm run validate`) measures this route automatically from the content (English at 230 wpm, Chinese at 350 characters per minute, plus each puzzle's par time) and fails CI below 30 minutes. Target: 35–50.

## 17. Look, sound and feel

- **Palette:** cool night blues (#0b1622 → #1d3346), fluorescent green (#9fe3b5, tube light), muted copper (#b07a4f), sodium orange through rain (#e0913a), warm paper for the notebook (#efe5cf, ink #24324a). Low-battery atmosphere: dim, slightly desaturated, things humming.
- **Type:** Source Serif 4 and Noto Serif TC for narrative; IBM Plex Mono for terminals, clocks, logs. Self-hosted; Noto Serif TC is subset at build time to the glyphs the game uses.
- **Illustration:** original scenes drawn in code as layered SVG with canvas overlays: tube flicker, fume-hood glow, rain on glass, film grain and ordered dither. One illustration per location (with act variants), one per ending.
- **The 03:33 lights-out** is the signature moment: the tubes stutter, the hum drops a semitone and dies, the screen goes black except the clock, the compressor winds down, silence, then a cold fade back to 02:47. With reduced motion or flicker off, it is a slow, steady fade.
- **Avoid:** cute styling, heavy gradients, generic cards, a dashboard look, hover-only interactions, cheap jump scares.

## 18. Audio

Procedural Web Audio only (no samples). Muted until the player opts in; master, ambience and effects volume. Room tone, fume-hood airflow, compressor, rain, cryocooler chirp, freezer drone, radio murmur, wind; cues for lights-out, phantom entries, puzzle solve, and one per ending.

## 19. Interaction, accessibility and settings

- Skippable text reveal (click, tap, Space or Enter completes it). Full keyboard (number keys for choices, N notebook, Esc menu) and touch. Responsive from 320 px phones to desktop.
- Settings: language (switch any time without losing state), text size, text speed, reduce motion, disable flicker, high contrast, audio. A content note on first launch.
- Saves: autosave and three slots in `localStorage`, versioned schema with migrations, export and import of a save file. The gallery lives apart from saves.
- Privacy: no analytics, no telemetry, no runtime network requests, no login.

## 20. Technical shape (summary)

Vite + TypeScript, no UI framework. Story, choices, flags, the clock, loop rules and notebook entries live in typed content files under `src/content/`; every string is referenced by key, with one table per locale (`en`, `zh-Hant-TW`). A validator checks graph reachability, dead ends, every ending reachable, locale key and placeholder parity, and the playtime estimate. See `CLAUDE.md` for commands and conventions.
