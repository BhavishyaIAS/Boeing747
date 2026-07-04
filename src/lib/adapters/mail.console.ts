import type { MailPort } from "@lib/ports/mail";

/**
 * Development mail adapter — logs the message instead of sending. Lets the auth
 * flows (OTP, verification, reset) be exercised locally without an SMTP server.
 * Production swaps in an SMTP adapter behind the same {@link MailPort}.
 */
export const consoleMailPort: MailPort = {
  async send(message) {
    console.info(
      `[mail] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`,
    );
  },
};
