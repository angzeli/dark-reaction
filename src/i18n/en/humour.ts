/**
 * Humour in the rooms and the notebook (docs/HUMOUR.md). Every key in this table is a joke key: the
 * validator keeps it out of dread scenes, the 03:33 transitions, Act III's climax and the epilogues, and
 * allows an uneasy scene one at most. British English; UK lab culture. CC BY-NC-SA 4.0.
 */
export const humour = {
  // ── Campus (§4) ───────────────────────────────────────────────────────────
  'fun.plate': '*RESEARCH WRITE-UP ROOM*, says the plate on the door, which is optimistic on both counts.',
  'fun.shuttle.timetable': 'Beside the doors, behind scratched perspex, the shuttle timetable: *LAST SERVICE 18:15*. It is {clock}.',
  'fun.lanyard.off': 'You take it off. You feel slightly less like yourself.',
  'fun.clocking.lanyard': 'On the night bus, somewhere around four, you notice you’re still wearing your lanyard. Visible at all times.',
  'fun.lift.r': 'On 0 the lift is waiting with its doors open, as it always is.',
  'fun.lift.press': 'You step in and press 4. The doors stay open. After a while you step out again and take the stairs, like everyone does.',
  'fun.lift.again': 'It was waiting like this at 03:33, too. Whatever the night does to the building, nobody has told the lift.',
  'fun.plan':
    'A fire evacuation plan in a steel frame, one panel per floor, *YOU ARE HERE* on 0. In the basement, *B.05 COLD ROOM* and *B12 NMR*, numbered in two different systems.',
  'fun.labdoor':
    'Lab 4.12’s door has been papered over so many times it is mostly paper. *LAB COATS MUST BE WORN BEYOND THIS POINT*, half under *NO LAB COATS IN CORRIDORS*, which is where you are standing to read it. *EYE PROTECTION MUST BE WORN*, and newer, beside it: *(THIS MEANS GOGGLES, NOT YOUR GLASSES)*. *FIRE DOOR: KEEP SHUT*, on a door wedged open with a Winchester.',
  'fun.labdoor.poster.0': 'In the middle, this month’s safety poster: *IS YOUR SASH AT THE CORRECT HEIGHT?* A cartoon fume hood gives you a thumbs up. Its sash is at the wrong height.',
  'fun.labdoor.poster.1':
    'In the middle, this month’s safety poster: *SLIPS, TRIPS AND FALLS: THE MOST COMMON LABORATORY INJURY.* Someone has drawn an arrow to the cable across the doorway and written *still here*.',
  'fun.labdoor.poster.2': 'In the middle, this month’s safety poster: *IS YOUR LAB COAT BUTTONED?* Nobody’s is.',
  'fun.labdoor.poster.3': 'In the middle, this month’s safety poster: *LONE WORKING: NEVER WORK ALONE OUT OF HOURS. TELL SOMEONE WHERE YOU ARE.* You think about who you would tell.',
  'fun.labdoor.poster.4': 'In the middle, this month’s safety poster: *KNOW WHERE YOUR NEAREST EYEWASH IS.* The arrow points at a wall.',
  'fun.corridor':
    'Along this end of the corridor, three more professors’ doors, all dark, none with a name on it. Each has a sign. *Big OP is here.* *Running out of money soon.* *Don’t laugh at students.*',

  // ── The Act I rooms (§8) ────────────────────────────────────────────────────
  'synth.sorry': 'Apologise to the fume hood',
  'fun.sorry':
    'As you turn away, your hood’s airflow alarm starts up, the way it does whenever anyone so much as looks at it. You say sorry to it, out loud. It stops. You’ve never been sure which of you that says more about.',
  'fun.synth.tlc':
    'In Tom’s hood, propped against his beaker, a TLC plate he has clearly given up on: starting material, product and co-spot all sitting at exactly Rf 0.3, side by side, as if they’ve agreed something. Down the sash, in his capitals, a column of attempts: *TRY 4:1. TRY 9:1. TRY 19:1. TRY A DIFFERENT PROJECT.*',
  'fun.pencil':
    'Department policy, laminated by the door, is that nothing is handled without a COSHH assessment, so you fill one in. *Substance:* pencil (graphite, clay, cedar). *Hazard:* splinters. *Route of exposure:* you will chew it. *Control measures:* don’t. *PPE:* gloves, goggles, lab coat. *Supervisor’s signature:* Dan is in Boston. You pick it up anyway, which is how most things in this building get done.',
  'fun.thesis':
    'Chapter 4, which you have been writing since June. *The catalyst outperforms commercial P25 by a factor of 3.7 under visible light (λ > 420 nm) and remains stable for 5 cycles. Binding energies were calibrated to C 1s at 284.8 eV. The apparent quantum yield was not determined.* You read it back. It sounds exactly like every paper you have ever rolled your eyes at, and it’s yours.',
  'fun.chart':
    'Taped by the console, Ian’s laminated table: *PEAKS THAT ARE NOT YOUR PRODUCT.* In CDCl₃: 7.26, the solvent; 1.56, water; 2.17, acetone; 0.86 and 1.26, grease. In C₆D₆: 7.16, 0.40, 1.55, 0.92 and 1.36. At the bottom, someone has added a row in biro: *8.41 — hope.*',

  // ── The rest of the building: B.05, the PA, past-you’s margins (§7–8) ───────
  'fun.cold.box':
    'As the door swings to, you catch the box on the top shelf, at the front, where it has been for longer than anyone in the group: *DO NOT THROW AWAY — 2009*. Nobody knows whose it is. Nobody has thrown it away.',
  'fun.cold.fridge':
    '*NO FOOD OR DRINK — CHEMICALS ONLY*, says the door, in Ian’s capitals. Inside: a boronic acid, three NMR solvents and a meal deal, labelled *TOM’S. I HAVE COUNTED THE CRISPS.*',
  'fun.pa.test':
    '*Bing-bong.* A recorded voice, very calm: *This is a test of the public address system. If you can hear this message, you are in the building.* *Bing-bong.*',
  'fun.pa.car':
    '*Bing-bong.* *Would the owner of the blue estate car in the car park please move it. It has been there since September. This is the final announcement.* *Bing-bong.*',
  'nb.aside.tlc': 'label your vials. you didn’t.',
  'nb.aside.yield': 'the balance isn’t drifting. you are.',
  'nb.aside.ian': 'he has a sign for this too.',

  // ── The credits (§7) ────────────────────────────────────────────────────────
  'credits.reviewer': 'Reviewer 2 — uncredited (as requested)',

  // ── The hidden eggs (§7) ────────────────────────────────────────────────────
  'fun.squid.synth':
    'On the tape along your fume hood’s sash, in biro, a squid the size of a thumbnail, holding a tiny round-bottomed flask. Under it, very small: *Squiddy*.',
  'fun.squid.glovebox': 'In the dust on the outside of the glovebox’s window, drawn with a fingertip: a squid with all its arms in the gloves. *Squiddy.*',
  'fun.squid.office': 'On a Post-it stuck to the kettle: a squid with a mug in each of its eight arms and two more in its tentacles. *Squiddy.*',
  'nb.squiddy.body': 'Three squid, three rooms, one signature. Nobody in the group is called Squiddy. You checked.',
  'fun.darkroom':
    'The dark room is a cupboard with ambitions: a blackout curtain, a xenon lamp in a fan-cooled box, a stirrer plate, and on the lamp housing a strip of tape in Tom’s capitals: *VISIBLE LIGHT (λ > 420 nm)*. Under it, smaller: *(MOSTLY HEAT).*',
  'nb.darkcontrol.body': 'Catalyst, CO₂, solvent; no light; 02:47 to 03:33. Result: nothing happened, as expected. (Repeat in triplicate for the SI.)',
  'fun.tare.1': 'You tare it. 0.0000 g. Then 0.0002. Then 0.0005, climbing gently.',
  'fun.tare.2': 'You tare it again. 0.0000. Then −0.0003, which is worse.',
  'fun.tare.3':
    'A third time. The display goes blank and comes back in percentage mode, which nobody has ever used on purpose: *104 %*. Of what, it doesn’t say.',
  'slide.preliminary': '(preliminary)',
  'slide.promising': 'Results look very promising!!',
  'slide.future': 'Future work: everything',
  'slide.footer': 'Slide 13 of 47 · CONFIDENTIAL — DO NOT DISTRIBUTE',
  'slide.close': 'No questions',
  'title.egg.bed': 'It’s 03:33. Go to bed.',
  'title.egg.mole': '23 October: Mole Day. Somewhere, a mole of PhD students is still in the lab.',

  // ── Cameos (§8) ─────────────────────────────────────────────────────────────
  'fun.macbook':
    'On the desk beside yours, somebody’s MacBook, lid open, fan whispering, running VASP. The output scrolls slowly past: energies, forces, a number getting smaller. It’s converging. Nobody knows how.',
  'fun.rack':
    'On the bench by the console, a 3D-printed rack for NMR tubes: forty-eight positions in six neat rows, each one numbered, in the particular orange only a 3D printer would choose. Someone designed it properly.',
} as const;
