/**
 * The console's hidden commands (docs/HUMOUR.md §5). Every key here is a joke key, like the humour
 * table's. Software output stays as the software prints it. CC BY-NC-SA 4.0.
 */
export const terminal = {
  'console.out.sudo': 'ar4217 is not in the sudoers file. This incident will be reported to your PI.',
  'console.out.rm': 'rm: cannot remove ‘/’: it has been laminated. — I.O.',
  'console.out.xyzzy': 'Nothing happens. This isn’t that kind of adventure.',
  'console.out.vasp': ' ZBRENT: fatal error in bracketing\n     please rerun with smaller EDIFF, or copy CONTCAR\n     to POSCAR and continue',
  'console.out.orca': 'ORCA finished by error termination in SCF\n[file orca_tools/qcmsg.cpp, line 465]:\n  .... aborting the run',
  'console.out.g16': ' Normal termination of Gaussian 16 at Mon Nov 23 {clock}:00 2026.',
  'console.out.coffee': 'make: *** No rule to make target ‘coffee’.  Stop.',
  'console.out.ping': 'PING supervisor (Boston): 56 data bytes\n64 bytes from supervisor: icmp_seq=0 ttl=52 time=0.4 ms\n  any news??',
  'console.out.history':
    '  1  queue --all\n  2  info 13\n  3  info 13\n  4  cancel 13\n  5  info 13\n  6  man sleep\n  7  info 13\n  8  who\n  9  exit\n 10  exit\n 11  exit',
  'console.out.uptime': ' {clock}:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33',
  'console.out.top':
    '  PID USER      %CPU   TIME+  COMMAND\n    1 root       0.0  1247d   init\n 3333 ar4217   100.0  46:00   you\n 4217 ar4217     0.0   0:00   sleep <defunct>',
  'console.out.man':
    'SLEEP(1)                User Commands                SLEEP(1)\n\nNAME\n       sleep - delay for a specified amount of time\n\nSYNOPSIS\n       sleep NUMBER[SUFFIX]...\n\nBUGS\n       Not available between 02:47 and 03:33.',
  'console.out.blame': 'usage: git blame [<options>] [<rev>] [--] <file>\n\n(It was Reviewer 2.)',
  'console.out.ls':
    'data/  queue.sh  DO_NOT_DELETE/\nthesis_final.docx  thesis_final_v2.docx  thesis_final_v3_FINAL.docx\nthesis_final_v7_FINAL.docx  thesis_final_v7_FINAL_actually.docx',
  'console.out.thesis': 'PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@\n(Chapter 4 is still just a heading.)',
  'console.out.superseded': 'Superseded.',
  'console.out.shuttle': 'Last service: 18:15. It is {clock}.',
  'console.out.who': 'ar4217   pts/0   02:41 (4.08-desk-04)\nycl      pts/1   2019-03-14 03:33',
  'console.out.coshh': 'coshh: a COSHH assessment is required before running coshh. See form COSHH-COSHH-1.',
} as const;
