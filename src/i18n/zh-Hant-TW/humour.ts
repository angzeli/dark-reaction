/** 房間與筆記本裡的幽默（docs/HUMOUR.md）。這張表裡的每個鍵都是笑點鍵，由驗證器管它出現在哪裡。臺灣研究生的笑點，各自原創。 */
import type { humour as en } from '../en/humour.ts';

export const humour: Record<keyof typeof en, string> = {};
