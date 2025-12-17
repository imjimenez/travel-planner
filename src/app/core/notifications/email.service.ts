import { Injectable } from "@angular/core";
import { Resend } from "resend";

/**
 * Servicio para envío de emails con Resend
 *
 * Maneja todos los emails de la aplicación:
 * - Invitaciones a viajes
 * - Recordatorios
 * - Notificaciones
 */
@Injectable({
	providedIn: "root",
})
export class EmailService {
	private resend: Resend;
	readonly #RESEND_API_KEY = import.meta.env.NG_APP_RESEND_API_KEY;

	constructor() {
		this.resend = new Resend(this.#RESEND_API_KEY);
	}

	/**
	 * Envía email de invitación a viaje
	 */
	async sendTripInvite(
		to: string,
		inviteLink: string,
		tripName: string,
		inviterName: string,
	): Promise<void> {
		try {
			await this.resend.emails.send({
				from: "noreply@tudominio.com",
				to: to,
				subject: `${inviterName} te invita a ${tripName}`,
				html: this.getTripInviteTemplate(inviteLink, tripName, inviterName),
			});
		} catch (error) {
			console.error("Error enviando email de invitación:", error);
			throw new Error("No se pudo enviar el email");
		}
	}

	private getTripInviteTemplate(
		inviteLink: string,
		tripName: string,
		inviterName: string,
	): string {
		return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Te han invitado a un viaje</h2>
            <p>Hola,</p>
            <p><strong>${inviterName}</strong> te invita a <strong>${tripName}</strong>.</p>

            <a href="${inviteLink}" class="button">Aceptar invitación</a>

            <p>O copia este enlace:</p>
            <p style="color: #666; word-break: break-all;">${inviteLink}</p>

            <div class="footer">
              <p>Expira en 7 días.</p>
            </div>
          </div>
        </body>
      </html>
    `;
	}
}
