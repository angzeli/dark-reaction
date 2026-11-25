/** 控制台的隱藏指令（docs/HUMOUR.md §5）。軟體的輸出照軟體原樣，需要時再加一行註解。 */
import type { terminal as en } from '../en/terminal.ts';

export const terminal: Record<keyof typeof en, string> = {
  'console.out.sudo': 'ar4217 不在 sudoers 名單裡。此事件將回報給你的老闆。',
  'console.out.rm': 'rm：無法刪除 ‘/’：已護貝。——I.O.',
  'console.out.xyzzy': '什麼事都沒發生。',
  'console.out.vasp': ' ZBRENT: fatal error in bracketing\n     please rerun with smaller EDIFF, or copy CONTCAR\n     to POSCAR and continue',
  'console.out.g16': ' Normal termination of Gaussian 16 at Mon Nov 23 {clock}:00 2026.',
  'console.out.ping': 'PING 老闆（波士頓）：56 data bytes\n64 bytes from 老闆：icmp_seq=0 ttl=52 time=0.4 ms\n  進度？',
  'console.out.history':
    '  1  queue --all\n  2  info 13\n  3  info 13\n  4  cancel 13\n  5  info 13\n  6  man sleep\n  7  info 13\n  8  who\n  9  exit\n 10  exit\n 11  exit',
  'console.out.uptime': ' {clock}:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33',
  'console.out.top':
    '  PID USER      %CPU   TIME+  COMMAND\n    1 root       0.0  1247d   init\n 3333 ar4217   100.0  46:00   you\n 4217 ar4217     0.0   0:00   sleep <defunct>',
  'console.out.man':
    'SLEEP(1)                使用者指令                SLEEP(1)\n\n名稱\n       sleep —— 延遲指定的時間\n\n用法\n       sleep NUMBER[SUFFIX]...\n\n已知問題\n       02:47 至 03:33 之間無法使用。',
  'console.out.blame': 'a3f9c21 (ar4217  2026-11-23 03:32)  第 4 章\na3f9c21 (ar4217  2026-11-23 03:32)  圖 3\na3f9c21 (ar4217  2026-11-23 03:32)  其他全部',
  'console.out.ls': 'data/  queue.sh  DO_NOT_DELETE/\n論文_最終版.docx  論文_最終版_v2.docx  論文_最終版_老闆改過.docx\n論文_最終版_老闆改過_真的不改了.docx',
  'console.out.thesis': 'PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@ … 表觀量子效率未測定。^@^@^@',
  'console.out.superseded': '已經不是最新版了。',
  'console.out.shuttle': '末班車：18:15。現在是 {clock}。',
  'console.out.who': 'ar4217   pts/0   02:41 (4.08-desk-04)\nycl      pts/1   2019-03-14 03:33',
};
