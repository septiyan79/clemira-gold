import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@clemira.id";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: `Clemira Gold <${FROM}>`,
    to,
    subject: "Verifikasi Email Akun Clemira Gold",
    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#13110E;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#13110E;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#1A1612;border:1px solid rgba(201,168,76,.2);border-radius:16px;padding:40px 36px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#7A6E5F;text-transform:uppercase">Clemira Gold</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#EDE8DE">Verifikasi Email</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#9A8E7F;line-height:1.6">
            Terima kasih sudah mendaftar! Klik tombol di bawah untuk mengaktifkan akun Anda.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#9A8E7F;line-height:1.6">
            Link ini berlaku selama <strong style="color:#EDE8DE">24 jam</strong>.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#C9A84C,#A8843A);color:#13110E;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:.3px">
            Verifikasi Email →
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#5A4E3F;line-height:1.6">
            Atau salin link berikut ke browser Anda:<br>
            <span style="color:#7A6E5F;word-break:break-all">${verifyUrl}</span>
          </p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#3A342A">© 2026 Clemira Gold</p>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: `Clemira Gold <${FROM}>`,
    to,
    subject: "Reset Password Akun Clemira Gold",
    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#13110E;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#13110E;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#1A1612;border:1px solid rgba(201,168,76,.2);border-radius:16px;padding:40px 36px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#7A6E5F;text-transform:uppercase">Clemira Gold</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#EDE8DE">Reset Password</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#9A8E7F;line-height:1.6">
            Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#9A8E7F;line-height:1.6">
            Link ini berlaku selama <strong style="color:#EDE8DE">1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#C9A84C,#A8843A);color:#13110E;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:.3px">
            Reset Password →
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#5A4E3F;line-height:1.6">
            Atau salin link berikut ke browser Anda:<br>
            <span style="color:#7A6E5F;word-break:break-all">${resetUrl}</span>
          </p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#3A342A">© 2026 Clemira Gold</p>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
