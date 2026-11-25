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
  'fun.clocking.lanyard': 'Somewhere around four you notice you’re still wearing your lanyard. On the night bus. At four in the morning. Visible at all times.',
  'fun.lift.r': 'On 0 the lift is waiting with its doors open, as it always is.',
  'fun.lift.press': 'You step in and press 4. The doors think about it and stay open. After a while you step out again and take the stairs, like everyone does.',
  'fun.lift.again': 'It was waiting like this at 03:33, too. Whatever the night does to the building, nobody has told the lift.',
  'fun.plan':
    'A fire evacuation plan in a steel frame, one panel per floor, *YOU ARE HERE* on 0. On 4, the Research Write-Up Room in full. In the basement, *B.05 COLD ROOM* and *B12 NMR*, numbered in two different systems, depending on who was in charge of signs that year. The roof isn’t on it. Officially, nobody goes up there.',
  'fun.labdoor':
    'Lab 4.12’s door has been papered over so many times it is mostly paper. *LAB COATS MUST BE WORN BEYOND THIS POINT*, half under *NO LAB COATS IN CORRIDORS*, which is where you are standing to read it. *EYE PROTECTION MUST BE WORN*, and newer, beside it: *(THIS MEANS GOGGLES, NOT YOUR GLASSES)*. *REMOVE GLOVES BEFORE TOUCHING DOOR HANDLES*, over *DO NOT TOUCH DOOR HANDLES WITH BARE HANDS*. *KEEP THIS DOOR SHUT*, on a door that also says *FIRE DOOR: KEEP CLEAR*. Three minutes later you know exactly what you must and mustn’t do, and that you can’t do all of it.',
  'fun.labdoor.poster.0': 'In the middle, this month’s safety poster: *IS YOUR SASH AT THE CORRECT HEIGHT?* A cartoon fume hood gives you a thumbs up. Its sash is at the wrong height.',
  'fun.labdoor.poster.1':
    'In the middle, this month’s safety poster: *SLIPS, TRIPS AND FALLS: THE MOST COMMON LABORATORY INJURY.* Someone has drawn an arrow to the cable across the doorway and written *still here*.',
  'fun.labdoor.poster.2': 'In the middle, this month’s safety poster: *HAVE YOU COMPLETED YOUR RISK ASSESSMENT?* Taped beneath it, a risk assessment for reading the poster. *Likelihood: certain.*',
  'fun.labdoor.poster.3': 'In the middle, this month’s safety poster: *LONE WORKING: NEVER WORK ALONE OUT OF HOURS. TELL SOMEONE WHERE YOU ARE.* You think about who you would tell.',
  'fun.labdoor.poster.4': 'In the middle, this month’s safety poster: *KNOW WHERE YOUR NEAREST EYEWASH IS.* The arrow points at a wall.',
  'fun.corridor':
    'Along this end of the corridor, three more professors’ doors, all dark, none with a name on it. Each has a sign. *Big OP is here.* *Running out of money soon.* *Don’t laugh at students.*',
} as const;
