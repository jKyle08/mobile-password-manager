import * as Clipboard from 'expo-clipboard';

export class ClipboardService {
  private static clearTimer: ReturnType<typeof setTimeout> | null = null;
  private static lastCopiedText: string | null = null;

  /**
   * Securely copies text to the clipboard and schedules automatic wipe
   */
  public static async copyWithAutoClear(
    text: string,
    timeoutSeconds = 30
  ): Promise<boolean> {
    try {
      if (this.clearTimer) {
        clearTimeout(this.clearTimer);
        this.clearTimer = null;
      }

      this.lastCopiedText = text;
      await Clipboard.setStringAsync(text);

      if (timeoutSeconds > 0) {
        this.clearTimer = setTimeout(async () => {
          try {
            // Verify clipboard still contains the secret text before overwriting
            const current = await Clipboard.getStringAsync();
            if (current === this.lastCopiedText) {
              await Clipboard.setStringAsync('');
            }
          } catch (e) {
            // Ignore error
          } finally {
            this.lastCopiedText = null;
            this.clearTimer = null;
          }
        }, timeoutSeconds * 1000);
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Immediately clears the clipboard
   */
  public static async clearImmediately(): Promise<void> {
    try {
      if (this.clearTimer) {
        clearTimeout(this.clearTimer);
        this.clearTimer = null;
      }
      this.lastCopiedText = null;
      await Clipboard.setStringAsync('');
    } catch (e) {
      // Ignore
    }
  }
}
