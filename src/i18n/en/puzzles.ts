/** Puzzle frame strings, and puzzle text as puzzles arrive. British English. */
export const puzzles = {
  'puzzle.clock': 'Time',
  'puzzle.hints.title': 'Hints',
  'puzzle.hint.button': 'Hint ({n} of 3)',
  'puzzle.hint.none': 'No more hints',
  'puzzle.hint.label': '{n}.',
  'puzzle.leave': 'Step away',

  'puzzle.demo.title': 'A three-dial lock',
  'puzzle.demo.intro': 'Three brass dials, each from 0 to 9. Someone has scratched *2-4-1* into the paint beside them.',
  'puzzle.demo.dial': 'Dial {n}',
  'puzzle.demo.up': 'Turn dial {n} up',
  'puzzle.demo.down': 'Turn dial {n} down',
  'puzzle.demo.h1': 'Look at the paint beside the dials.',
  'puzzle.demo.h2': 'The scratched numbers are the combination, left to right.',
  'puzzle.demo.h3': 'Set the dials to 2, 4 and 1.',
} as const;
