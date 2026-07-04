/**
 * Mail port. Domain code depends on this interface only; the SMTP adapter is
 * wired from env in production, and a console adapter is used in development.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}
