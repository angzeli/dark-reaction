/** Notebook entries, in your voice. British English. CC BY-NC-SA 4.0. */
export const notebook = {
  // Tonight
  'nb.portal.title': 'The deadline',
  'nb.portal.body':
    'Revised manuscript on the portal by 09:00. Reviewer 2 wants ¹H NMR evidence for the dark-phase product: the formate peak at 8.41 ppm. Then a box to tick: *these data are complete and unaltered*.',
  'nb.tlc.title': 'The fractions',
  'nb.tlc.body': 'Product (Rf 0.35) runs clean in fractions 12–14. Fraction 11 hides a spot that only shows under UV; 15 has a slower one.',
  'nb.sop.title': 'The SOP',
  'nb.sop.body': 'The laminated antechamber SOP says evacuate and refill twice. Someone who signs YCL pencilled in: THREE. Trust me.',
  'nb.purge.title': 'The antechamber',
  'nb.purge.body':
    'Three evacuate–refill cycles, not two. Whoever pencilled YCL on the SOP was right. The box passes 10 ppm O₂ at about 03:28, so start the purge by 03:18.',
  'nb.logbook.title': 'Glovebox logbook',
  'nb.logbook.body': 'Regeneration overdue since 9 November. Wrote it in the log and emailed the group.',
  'fudge.logbook.title': 'Glovebox logbook',
  'fudge.logbook.body': 'Regeneration check: done.',
  'nb.queue.locked.title': 'The queue is locked',
  'nb.queue.locked.body': 'The 400 won’t take my sample: the 03:33 priority booking locks the queue. Only the facility manager can override it.',

  // People
  'nb.dan.title': 'Dan',
  'nb.dan.body': 'Prof. Daniel Ridley. In Boston until the 27th. Wants the spectrum by 09:00. Says I’m a star, which is worse.',
  'nb.priya.title': 'Priya',
  'nb.priya.body': 'In Singapore, where it’s late morning. Wants to know if I’m sleeping yet. No signal anywhere in this building to tell her.',
  'nb.tom.title': 'Tom',
  'nb.tom.body': 'Labmate. Labels everything TOM’S — DO NOT TOUCH (this means you). Asleep at home, like a sensible person.',
  'nb.ian.title': 'Ian Okoro',
  'nb.ian.body': 'NMR facility manager. Speaks only in laminated capitals. Will know.',
  'nb.mug.title': 'Desk 7',
  'nb.mug.body': 'A white mug with 晨 brushed on it in blue. Clean, cold, no dust. Nobody sits at desk 7.',
  'nb.drawer.title': 'Y.C.L.',
  'nb.drawer.body': 'Scratched inside the drawer of desk 7: Y.C.L. 2015–. No end date.',

  // Data
  'nb.paper.title': 'Figure 3',
  'nb.paper.body': 'Ridley, Lin *et al.*, 2020: one clean peak at 8.41 ppm. I have run this reaction thirty-one times and seen noise thirty-one times.',
  'nb.yield.title': 'Yield',
  'nb.yield.body': '61 %. (The paper says 70.)',
  'fudge.yield.title': 'Yield',
  'fudge.yield.body': '68 %. (Balance drifting?)',

  // Anomalies
  'nb.booking.title': 'A booking in my name',
  'nb.booking.body': 'On the department’s queue page: holder 13, 03:33 tonight, ar4217, priority, details restricted. I didn’t book it.',
  'nb.queue.0333.title': 'The 03:33 booking',
  'nb.queue.0333.body':
    'Holder 13, PROTON_DARK, one scan. User: me. Booked and submitted at 03:33 tonight, which hasn’t happened yet. Priority: facility override. Comment: “it’s still going”.',
  'nb.holder13.title': 'Holder 13',
  'nb.holder13.body': 'Empty. Whatever is booked for 03:33 hasn’t been loaded yet.',
  'nb.mini.title': 'The small antechamber',
  'nb.mini.body': 'Taped shut: DO NOT OPEN — YCL 14/03/19. Its gauge still reads vacuum.',
  'nb.reset.title': '03:33',
  'nb.reset.body': 'At 03:33 every light in the building went out. Then it was 02:47, and I was at my desk, and the kettle was cold.',

  // Pages you don't remember writing
  'ph.tea.title': '02:47',
  'ph.tea.body': '02:47. You’ve done this before. Make tea first. Then the plate.',
  'ph.three.title': 'Three',
  'ph.three.body': 'Three cycles. It’s always three.',
  'ph.all.title': 'The queue',
  'ph.all.body': 'The queue only shows you what it thinks is yours.',
  'ph.strike.title': 'Pages',
  'ph.strike.body': 'Single line through it. Initial. Date. You know how.',
} as const;
