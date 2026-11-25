/** Act II: the second half of the building, her traces, and the night's offer. British English. CC BY-NC-SA 4.0. */
export const act2 = {
  // ── 4.08 Research Write-Up Room, Act II ──────────────────────────────────────────
  'office.microsd': 'Read the microSD card',
  'office.microsd.r.1':
    'The card reader takes the little card with a click. One folder, *YCL_DARK*, and inside it nineteen more, one a week from November 2018 to March 2019, each holding a single spectrum of the same sample, run at the same hour of the night.',
  'office.microsd.r.2':
    'You open them in order. Week one: noise. Week six: a shoulder at 8.41 that you could talk yourself out of. Week twelve: a bump. Week nineteen: a small, unremarkable, honest peak, no taller than the noise around it is wide, its two carbon-13 satellites sitting exactly where they should, like a pair of commas. The reaction works. It is just very, very slow.',
  'office.microsd.r.3':
    'At the bottom of the folder, one more file, renamed in a hurry: *2019-03-14_0333_PROTON_DARK_NOT_MINE.fid*. And a text file one line long: *Real, slow, mine. The 03:33 one isn’t. — Y.C.*',
  'office.process': 'Process your spectrum',
  'office.process.text':
    'Your spectrum fills the screen, fresh from the 400. Solvent; the grease everyone has at 1.26; a small honest bump at 6.9 that has been in every run since September. And at 8.41, where the formate should be, a stretch of noise that looks, if you want it to, a little like something.',
  'office.process.honest': 'Leave it as it is and write it down',
  'office.process.honest.r':
    'You write down what is there: nothing at 8.41, the bump at 6.9, the date. Thirty-two runs now. The thirty-second is no different from the first, and you write that down too.',
  'office.baseline.fudge': 'Clean up the baseline',
  'office.baseline.fudge.r':
    'You draw a cleaner baseline under the spectrum, a few points here and there, and it lies down flat and obedient. The bump at 6.9 goes with it, the way a stain goes when you paint over it. It was a real impurity. It isn’t anywhere now.',
  'office.integral.fudge': 'Integrate the bump at 8.41 as 0.08 H',
  'office.integral.fudge.r':
    'You drag the integral across the noise at 8.41 and type *0.08*. *Trace product.* It is a number now, with a decimal point, and numbers can be cited.',
  'office.reprocess': 'Reprocess it with different settings',
  'office.reprocess.r':
    'Another window function. A different phase. Zero-filling to twice the points, then four times. The noise rearranges itself like a crowd shuffling to let someone through, and nobody comes through.',
  'office.stare': 'Stare at the noise until it means something',
  'office.stare.r':
    'You zoom in until the screen is all noise, then until it is a single trembling line, then until it is pixels. At some point you notice that you have stopped breathing evenly, that the clock in the corner has moved on without you, and that for a second, there, you were sure.',
  'office.print': 'Print the attachment',
  'office.print.r': 'The printer by the door wakes, considers the matter, and prints a single page. It is warm when you take it.',
  'office.submit.own': 'Upload your spectrum to the portal',
  'office.submit.printout': 'Upload the printout to the portal',
  'office.declare.own.text':
    'You drag your spectrum into the portal and it uploads in a bar of grey: your noise, your bump at 6.9, your nothing at 8.41. Under *Reviewer 2, comment 4* the response box is still empty. At the bottom of the page, above the button, the box: *I confirm that these data are complete and unaltered.*',
  'office.declare.printout.text':
    'You scan the printout on the copier by the door and it goes into the portal as a crisp PDF: the peak, the flat baseline, the timestamp nobody will check. Under *Reviewer 2, comment 4* you could write a single line now. At the bottom of the page, above the button, the box: *I confirm that these data are complete and unaltered.*',
  'office.declare.blocked': 'Your hand stops over it. Somewhere in your notebook there is a page that says otherwise, and you know which one.',
  'office.declare.clear': 'Nothing in your notebook stands against it. The box is there to be ticked, if you are going to tick it.',
  'office.upload': 'Tick the box and upload',

  // ── B12 NMR suite, Act II ────────────────────────────────────────────────
  'nmr.run': 'Run your sample with the priority code',
  'nmr.run.late': 'Run your sample with the priority code anyway, though 03:33 will come before it finishes',
  'nmr.code': 'Type Ian’s priority code into the console',
  'nmr.code.locked': 'You type *priority RIDLEY-4*. *PRIORITY REQUESTS SUSPENDED UNTIL HOLDER 13 HAS RUN.* It hasn’t run. Not yet.',
  'nmr.code.empty':
    'You type *priority RIDLEY-4*. The console thinks for a long second, then: *PRIORITY ACCEPTED · NO SAMPLE IN CAROUSEL.* Holder 2 is empty. Whatever you did last night, 02:47 undid it: the fractions are back in their rack upstairs, and your tube has to be made again, combined, dried and taken through the antechamber, before there is anything down here to run.',
  'nmr.code.vial':
    'You type *priority RIDLEY-4*. The console thinks for a long second, then: *PRIORITY ACCEPTED · NO SAMPLE IN CAROUSEL.* Holder 2 is empty, and the vial in your hand won’t fill it: the carousel takes tubes. Your solid still has to go up to the glovebox, in through the antechamber and into a tube, before there is anything down here to run.',
  'nmr.code.fractions':
    'You type *priority RIDLEY-4*. The console thinks for a long second, then: *PRIORITY ACCEPTED · NO SAMPLE IN CAROUSEL.* Holder 2 is empty, and the flask in your hand is a long way from filling it. The fractions still have to be dried on the rotavap and taken in through the glovebox’s antechamber into a tube, before there is anything down here to run.',
  'nmr.code.ruined':
    'You type *priority RIDLEY-4*. The console thinks for a long second, then: *PRIORITY ACCEPTED · NO SAMPLE IN CAROUSEL.* Holder 2 is empty, and tonight it will stay that way: your sample went green in the glovebox, and the fractions are spent. There is nothing left to make another tube from before 03:33.',
  'nmr.run.r.1':
    'You type *priority RIDLEY-4*. The console considers it for a long second, then unlocks the queue with a little chime that sounds like an apology. Holder 2. Your tube sinks into the magnet on its cushion of air.',
  'nmr.run.r.2':
    'Eight minutes. The free induction decay crawls across the screen, a long thin shiver, and the transform turns it into a spectrum: solvent, grease, the bump at 6.9 that is always there, and at 8.41 nothing at all. The console saves it to your folder without comment.',
  'nmr.rerun': 'Run it again',
  'nmr.rerun.r': 'You run it again. Eight more minutes of the magnet listening. The second spectrum is the first spectrum, a little more tired, and so are you.',
  'nmr.printout': 'Take the printout',
  'nmr.printout.r': 'You lift the page out of the tray. It is warm, as if it has been held.',
  'perfect.describe':
    '*PROTON_DARK · holder 13 · ar4217 · acquired 23/11/2026 03:33:00.* {n} {n:minute:minutes} from now. A single peak at 8.41, tall and clean as a struck match, alone on a baseline as straight as a ruled line. It is Figure 3. It is better than Figure 3. It is everything reviewer 2 asked for, and it is in your hands.',

  // ── Stairwell and lobby ───────────────────────────────────────────────────
  'stairs.desk': 'Look at the porter’s desk',
  'stairs.desk.r':
    'A radio murmuring to itself, a tartan flask, a crossword done in confident capitals with one clue left: *Keeps going (8)*. A plastic name plate: *F. ADEYEMI · NIGHT PORTER*. A rota taped to the desk in the same capitals: *MON — BINS (EXIT B)*. Behind it all, the access-log terminal glows, logged in and patient. You have never seen him. You have heard him whistle.',
  'stairs.radio': 'Sit on the stairs and listen to the radio',
  'stairs.radio.r':
    'You sit on the bottom step with your back against the cold rail. The radio is reading the shipping forecast to nobody: *Dogger, Fisher, German Bight. Southwesterly five to seven, occasionally gale eight later. Rain, then squally showers. Moderate or good, occasionally poor.* It is the kindest thing anyone has said to you in weeks. For three minutes the weather is somewhere else’s problem.',
  'stairs.entrance': 'Try the main entrance',
  'stairs.entrance.r':
    'The big glass doors, the rain beyond them, the street lamp, the bus shelter. You touch your badge to the reader. It thinks about it and blinks red: *CARD NOT VALID AT THIS TIME*. You try again. It is very sure. Through the glass the street goes on being a street, a few metres and a whole night away.',
  'stairs.exitb': 'Push the bar on fire exit B',
  'stairs.exitb.r':
    'The bar doesn’t move, not even the little give a bar usually has. A sticker at eye level: *ALARMED — RELEASED BY SECURITY ONLY*. Beyond the door, the faint sound of rain on a metal roof.',
  'stairs.exitb.open.r':
    'This time the bar gives. The door swings out onto the service yard and the night comes in all at once: rain on your face, the smell of wet bins, the street lamp lying in the puddles. The big wheelie bins stand in a row by the kerb like people waiting for a bus. Nobody is there. The door would let you go.',
  'stairs.door.text': 'The door stands open on its closer. Rain blows in across the threshold, and the bins wait by the kerb.',
  'stairs.door.close': 'Let the door swing shut',
  'stairs.leave': 'Step out into the rain',
  'stairs.leave.notyet':
    'You stand in the doorway with the rain on your face, and you don’t move. There is a sample upstairs, a deadline at nine, a queue with your name on it. Not yet. You let the door swing shut, and the bar clunks home.',
  'stairs.leave.cant':
    'You put one foot on the wet step and stop. The spectrum. The deadline. One more run, and it might be there. Your hand finds the door frame and holds on, and you can’t, not tonight, not like this. The door swings shut. The bar clunks home.',
  'stairs.callpoint': 'Look at the fire alarm call point',
  'stairs.callpoint.r':
    'A red box at shoulder height with a little pane and the words *FIRE — BREAK GLASS — PRESS HERE*. A label under it: *WEEKLY TEST: TUESDAYS 11:00*. Someone has added in biro: *it is never Tuesday*.',
  'stairs.glass': 'Put your thumb on the call point',
  'stairs.alarm.text':
    'The little pane is cool under your thumb. *FIRE — BREAK GLASS — PRESS HERE*. You know now what the building does with whoever is still inside at 03:33. It occurs to you that this red box is the one thing in it built to get everybody out.',
  'stairs.alarm.break': 'Break the glass',
  'stairs.alarm.leave': 'Take your thumb away',
  'stairs.window': 'Look out of the landing window',
  'stairs.window.r':
    'From the landing you can see the car park: three cars beaded with rain and a fourth that has been there since September. The sodium lamp makes everything the colour of weak tea. Across the yard, the roof of the bin store shines like a lake.',

  // ── 4.01 Prof. Ridley’s office ────────────────────────────────────────────
  'pi.knock': 'Knock',
  'pi.knock.r':
    'You knock, because it is what you do at this door. Nobody answers. Through the frosted glass the shape of the lamp and the shape of the chair stay exactly where they are.',
  'pi.paper': 'Look at the framed paper',
  'pi.paper.r':
    'The 2020 paper, framed like a degree: Ridley, Lin *et al.*, the first page, and beside it Figure 3 enlarged. If you lean in you can read the spectrum’s own header, printed tiny in the corner of the figure: *PROTON_DARK · holder 13 · acquired 14/03/2019 03:33:00*. A brass plate on the frame says *THE DARK REACTION · 2020*. Someone has dusted the frame recently, and only the frame.',
  'pi.email': 'Read the email printed on the desk',
  'pi.email.r.1':
    'It lies on the blotter as if it was put down a minute ago, though the paper has gone soft at the folds from being opened and closed. *From:* Lin Yu-chen · *To:* Daniel Ridley · *Sent:* 14/03/2019, 03:31.',
  'pi.email.r.2': '*Dan, the 03:33 spectrum isn’t mine. I didn’t run it. Please don’t use it, whatever it looks like. I’ll explain in the morning. Y.C.*',
  'pi.box': 'Open the box marked Y.C. LIN',
  'pi.box.text':
    'A document box on the floor behind the desk, its lid labelled in Dan’s handwriting: *Y.C. LIN — PERSONAL — DO NOT BIN — D.R.* Inside, packed carefully, as if by someone who kept stopping: a lab notebook with a green spine, a tin of tea, a grey cardigan, a plastic wallet of printed pages. On the inside of the lid, a sticky note in the same hand: *Contact family? — D (2019)*.',
  'pi.tin': 'Pick up the tea tin',
  'pi.tin.r':
    'A tall tin with a painted mountain on it. On the side, in tidy pencil, a place name in two scripts, *花蓮 · Hualien*, and underneath: *for bad weeks*. It is half full. When you lift the lid the smell is roasted and faintly floral, like something cooked slowly a long way from here.',
  'pi.cardigan': 'Lift out the cardigan',
  'pi.cardigan.r':
    'Grey wool, thin at the elbows, one button replaced with another that doesn’t quite match. In the pocket, a library card and a receipt for two oolong teas and a scone, dated 13/03/2019. Someone has folded it very carefully, later, the way you fold a thing that is going to have to wait a long time.',
  'pi.drafts': 'Read the pages in the plastic wallet',
  'pi.drafts.r':
    'Emails, printed, every one a draft. All to the same address in Hualien, all beginning *Dear Mr and Mrs Lin,* and none of them sent. The first is dated April 2019. The eleventh is dated this September. They get shorter as they go. The last says only: *Dear Mr and Mrs Lin, I am so sorry. I don’t know how to*',
  'pi.box.close': 'Put the lid back on the box',
  'pi.photo': 'Look at the group photo',
  'pi.photo.r':
    'The Ridley group, summer 2018, squinting on the front steps. Dan in the middle with his arms out as if presenting them. Tom with a beard he has since regretted. And at the very end of the row, a young woman in a grey cardigan who isn’t looking at the camera: her face is turned up towards the windows of Lab 4.12, as if someone has just called her name from inside.',
  'pi.sticky': 'Read the sticky note on Dan’s monitor',
  'pi.sticky.r':
    'Yellow, curling, in capitals you would know anywhere: *NMR PRIORITY: RIDLEY-4. DON’T ABUSE IT. — I.O.* Underneath Dan has added, in biro, *!!*, which is either agreement or a plan.',

  // ── B.05 Cold room ────────────────────────────────────────────────────────
  'cold.freezer': 'Open the −80 freezer',
  'cold.freezer.r':
    'The seal lets go with a gasp and the cold comes out to meet you, white and heavy, pouring over your hands. Five racks, each a tower of boxes, their labels furred with frost: initials, dates, a decade of the group’s samples. You don’t know what you’re looking for. You shut it before the display can complain.',
  'cold.cabinets': 'Read the solvent cabinets',
  'cold.cabinets.r':
    'Yellow cabinets with yellow warning triangles. Behind the glass, the big brown bottles everyone uses and nobody orders: acetone, hexane, ethyl acetate. One has a label in Tom’s capitals: *TOM’S ACETONE — FOR WASHING — NOT FOR DRINKING (this means you)*. You have never been less tempted.',
  'cold.dewar': 'Listen to the dewar',
  'cold.dewar.r':
    'A squat steel dewar in the corner breathes out a thin white plume and sighs every few seconds, like an old dog dreaming. Frost has made a lace collar round its neck. It is the only thing down here that sounds alive.',
  'cold.tom': 'Look at Tom’s boxes',
  'cold.tom.r':
    'A stack of cardboard boxes, each marked *TOM’S — DO NOT TOUCH (this means you)*. The top one also says *THESIS — PRINTED — DO NOT FREEZE*. It is in the cold room. You decide this is not tonight’s problem.',

  // ── The roof ──────────────────────────────────────────────────────────────
  'roof.priya': 'Reply to Priya',
  'roof.priya.r.1':
    'Up here your phone finds a single bar, and the messages arrive all at once, as if they have been waiting at the door. Priya, in Singapore, where it is nearly noon: *ok it’s 11:40 and I’ve had two coffees* — *are you at the lab* — *of course you are* — *eat something. not from the machine.*',
  'roof.priya.r.2':
    'You type *still here. it’s raining. the queue’s being weird.* Three dots, then: *go home. the queue will be weird tomorrow too x*. You stand there holding the phone a while longer than you need to, rain ticking on the screen.',
  'roof.priya.r.late': 'Then one more: *you sound far away. are you ok?* You start to answer, and the bar goes.',
  'roof.rain': 'Stand in the rain',
  'roof.rain.r':
    'You walk out from under the plant units and stand in it. The rain is cold and completely uninterested in you. It gets into your collar and your eyelashes and makes the city soft at the edges. For two minutes you are just a person standing in the rain, which is a thing people have always done, and which produces no results.',
  'roof.deckchair': 'Look under the deckchair',
  'roof.deckchair.r':
    'Under the deckchair, wrapped in a carrier bag, a plastic lunchbox. Inside: a cracked rain gauge and a notebook with a raincloud drawn on the cover. Thirty-one months of entries in tidy pencil, one line a night. *03:00 — 2.4 mm — drizzle, warm.* *03:00 — 0 mm — clear, cold, stars (3).* The last is dated 14/03/19: *03:00 — 1.1 mm — rain starting. Going down to run it.*',
  'roof.city': 'Look at the city',
  'roof.city.r':
    'London in every direction, orange at the edges and dark in the middle where the river is. The cranes stand over it with their red lights on, keeping watch over nothing. Somewhere out there people are asleep in their thousands, and some of them have deadlines too.',

  // ── Second looks and small things (#69) ───────────────────────────────────
  'office.mug.rain':
    'You know now where the ring came from: a mug carried up to the roof at three in the morning and back down again, tea going cold beside a rain gauge, one line written a night. Thirty-one months of it. You turn the mug so that the character faces the window, which feels like the right way round.',
  'pi.photo.keeps':
    'Now you look at the windows she is looking at. In the photograph, behind the glass of Lab 4.12, there is nothing: a fume hood, a strip light, the blur of a summer afternoon. You look anyway, for longer than makes sense, in case whoever called her is still in there, and in case they are still calling.',
  'pi.books': 'Read the spines on Dan’s shelves',
  'pi.books.r':
    'Dan shelves by guilt. Standing up: the books he has read, spines cracked white. Lying flat on top of them: the books he means to read, which is most of them. *Photocatalysis: Principles and Practice.* *Mentoring the Modern Researcher.* *Leadership in the Laboratory*, still in its shrink-wrap. On the bottom shelf, spine out, a Mandarin phrasebook, a Post-it marking a page near the front: *Excuse me, can you help me? I am looking for someone.*',
  'stairs.crossword': 'Look at the crossword',
  'stairs.crossword.r':
    'Femi’s crossword, done in confident capitals except for one clue: *Keeps going (8)*. Eight empty squares. CONTINUE fits. So does PERSISTS. You pick up his pen and put it down again. It isn’t your crossword, and tonight is not a night for finishing other people’s things.',
  'roof.priya.act2.1':
    'The bar finds you and the messages fall in. Priya: *ok random question* — *wasn’t there someone in your group who just stopped coming in? before our time* — *my old flatmate says the ridley group has a ghost* — *she also says crystals cure hangovers so*',
  'roof.priya.act2.2':
    'You type *there was someone. Lin. 2019.* and look at it for a long time before you send it. The dots come and go twice. Then: *that’s not a ghost story, then. that’s a person.* And, a minute later: *go home. nobody should end up as a story about a building x*',

  // ── v1.1.0: the lobby, the corridor, her lanyard ────────────────────────────
  'stairs.lift': 'Go over to the lift',
  'stairs.lift.press': 'Press 4',
  'stairs.plan': 'Read the floor plan by the lift',
  'stairs.toilets': 'Go into the toilets',
  'stairs.toilets.text':
    'A laminated sign on the door: *NO NETWORK ACCESS*. Inside it is warm and very quiet, and the hand dryer’s little light is the only thing awake. You take your notebook out from habit and find there is nothing to write. For a minute nothing is keeping a record of you, not even you.',
  'pi.corridor': 'Look along the corridor',
  'pi.photo.lanyard': 'She is the only one in the photo still wearing her lanyard.',
  'pi.box.lanyard': 'Her lanyard isn’t in the box.',

  // ── v1.1.0: B.05 ────────────────────────────────────────────────────────────
  'cold.fridge': 'Open the fridge marked NO FOOD',

  // ── v1.1.0: the roof’s water tank ─────────────────────────────────────────────
  'roof.tank': 'Look at the water tank',
  'roof.tank.r':
    'Scratched small and careful into the paint on the side of the water tank, at the height you’d see it from the deckchair, a line of Chinese: 下一秒想去看海. The rain has been at it for years and hasn’t got it out. You don’t know who wrote it. You sit with it for a while anyway.',
  'stairs.timetable': 'Read the shuttle timetable by the doors',
} as const;
