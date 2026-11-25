/** 控制台的隱藏指令（docs/HUMOUR.md §5）。軟體的輸出照軟體原樣，需要時再加一行註解。 */
import type { terminal as en } from '../en/terminal.ts';

export const terminal: Record<keyof typeof en, string> = {
  'console.out.sudo': 'ar4217 不在 sudoers 名單裡。此事件將回報給你的老闆。',
  'console.out.rm': 'rm：無法刪除 ‘/’：已護貝。——I.O.',
  'console.out.xyzzy': '什麼事都沒發生。這不是那種冒險遊戲。',
  'console.out.vasp': ' ZBRENT: fatal error in bracketing\n     please rerun with smaller EDIFF, or copy CONTCAR\n     to POSCAR and continue\n（學長說他畢業前看過這行三百次。）',
  'console.out.orca': 'ORCA finished by error termination in SCF\n[file orca_tools/qcmsg.cpp, line 465]:\n  .... aborting the run\n（換了三個 functional，還是不收斂。）',
  'console.out.g16': ' Normal termination of Gaussian 16 at Mon Nov 23 {clock}:00 2026.\n（你差點想截圖傳給學長。）',
  'console.out.coffee': 'make: *** No rule to make target ‘coffee’.  Stop.\n（茶水間的咖啡機上個月就壞了。）',
  'console.out.ping': 'PING 老闆（波士頓）：56 data bytes\n64 bytes from 老闆：icmp_seq=0 ttl=52 time=0.4 ms\n  進度？',
  'console.out.history':
    '  1  queue --all\n  2  info 13\n  3  info 13\n  4  cancel 13\n  5  info 13\n  6  man sleep\n  7  info 13\n  8  who\n  9  exit\n 10  exit\n 11  exit',
  'console.out.uptime': ' {clock}:00 up 1247 days,  3:33,  2 users,  load average: 0.33, 0.33, 0.33\n（兩個使用者？）',
  'console.out.top':
    '  PID USER      %CPU   TIME+  COMMAND\n    1 root       0.0  1247d   init\n 3333 ar4217   100.0  46:00   you\n 4217 ar4217     0.0   0:00   sleep <defunct>\n（爆肝中。）',
  'console.out.man':
    'SLEEP(1)                使用者指令                SLEEP(1)\n\n名稱\n       sleep —— 延遲指定的時間\n\n用法\n       sleep NUMBER[SUFFIX]...\n\n已知問題\n       02:47 至 03:33 之間無法使用。',
  'console.out.blame': 'usage: git blame [<options>] [<rev>] [--] <file>\n\n（反正都是 Reviewer 2 的錯。）',
  'console.out.ls':
    'data/  queue.sh  DO_NOT_DELETE/\nthesis_final.docx  thesis_final_v2.docx  thesis_final_v3_FINAL.docx\nthesis_final_v7_FINAL.docx  thesis_final_v7_FINAL_actually.docx',
  'console.out.thesis': 'PK^C^D^T^@^F^@^H^@ [Content_Types].xml ^@^@ word/document.xml ^@\n（第 4 章還是只有標題。）',
  'console.out.superseded': '已經不是最新版了。',
  'console.out.shuttle': '末班車：18:15。現在是 {clock}。',
  'console.out.who': 'ar4217   pts/0   02:41 (4.08-desk-04)\nycl      pts/1   2019-03-14 03:33',
  'console.out.coshh': 'coshh：執行 coshh 之前，請先填寫 coshh 的 COSHH 風險評估表（表單 COSHH-COSHH-1）。',
};
