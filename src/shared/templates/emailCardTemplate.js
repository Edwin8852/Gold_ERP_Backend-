/**
 * Reusable Responsive Card-Based Email Template
 */

function generateEmailCard({
  title,
  content,
  language = 'en'
}) {
  const isTamil = language === 'ta';

  const headerTitle = isTamil 
    ? '🏆 SDRS Gold Finance – அடகு & மீள் அடகு சேவை'
    : '🏆 SDRS Gold Finance – Pledge & Repledge';

  const greeting = isTamil ? 'அன்பார்ந்த வாடிக்கையாளருக்கு,' : 'Dear Customer,';

  const footerCopyright = isTamil 
    ? 'நம்பிக்கையுடன் சேவை செய்கிறோம்.'
    : '© SDRS Gold Finance<br/>Secure • Trusted • Transparent';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; padding: 20px; margin: 0; color: #000000;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header Logo -->
        <tr>
          <td style="text-align: center; padding: 20px 0 10px 0;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #D4AF37; text-transform: uppercase;">
              SDRS GOLD FINANCE
            </h1>
          </td>
        </tr>

        <!-- Main Title -->
        <tr>
          <td style="text-align: left; padding: 10px 0 20px 0;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
              ${headerTitle}
            </h2>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 0 0 20px 0;">
            <p style="font-size: 16px; margin: 0 0 20px 0; color: #111827;">
              ${greeting}
            </p>
            
            <div style="font-size: 15px; line-height: 1.6; color: #374151;">
              ${content}
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 20px 0;">
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 10px 0;">
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 700; color: #111827;">
              SDRS GOLD FINANCE
            </p>
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #4b5563;">
              Pledge & RePledge
            </p>

            <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
              📍 1/12, Maruthamalai Main Road,<br/>
              Opp Ramraj Cotton Showroom,<br/>
              Near High School Stop,<br/>
              Vadavalli, Coimbatore – 641041
            </p>

            <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;">
              📞 98432 57757
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563;">
              📧 support@sdrsgoldfinance.com
            </p>

            <p style="margin: 0; font-size: 14px; color: #9ca3af;">
              ${footerCopyright}
            </p>
          </td>
        </tr>

      </table>
    </div>
  `;
}

module.exports = {
  generateEmailCard
};
