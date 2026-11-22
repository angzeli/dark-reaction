/**
 * Moving saves in and out as files, entirely on the device: export makes a
 * Blob and clicks a temporary download link; import reads a file the
 * player picks. No network involved.
 */

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Generous: some browsers ask "Allow downloads?" before they read the URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type PickResult = { kind: 'ok'; text: string } | { kind: 'cancel' } | { kind: 'error'; reason: 'too-large' | 'unreadable' };
export const MAX_SAVE_BYTES = 2_000_000;

/**
 * Let the player pick a .json file. Resolves exactly once: with its text,
 * with "cancel", or with an error the UI can explain.
 */
export function pickTextFile(accept = 'application/json,.json'): Promise<PickResult> {
  return new Promise((resolve) => {
    let settled = false;
    let picked = false;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    const settle = (result: PickResult) => {
      if (settled) return;
      settled = true;
      input.remove();
      window.removeEventListener('focus', onFocus);
      resolve(result);
    };
    // Browsers without the 'cancel' event: the window regains focus when the
    // picker closes; if no file arrives shortly after, treat it as a cancel.
    const onFocus = () => window.setTimeout(() => !picked && settle({ kind: 'cancel' }), 1500);
    input.addEventListener('change', () => {
      picked = true;
      const file = input.files?.[0];
      if (!file) return settle({ kind: 'cancel' });
      if (file.size > MAX_SAVE_BYTES) return settle({ kind: 'error', reason: 'too-large' });
      file.text().then(
        (text) => settle({ kind: 'ok', text }),
        () => settle({ kind: 'error', reason: 'unreadable' }),
      );
    });
    input.addEventListener('cancel', () => settle({ kind: 'cancel' }));
    document.body.appendChild(input);
    window.addEventListener('focus', onFocus, { once: true });
    input.click();
  });
}

/** A filename like dark-reaction-loop4-0315.json */
export function saveFilename(loop: number, clock: string): string {
  return `dark-reaction-loop${loop}-${clock.replace(':', '')}.json`;
}
