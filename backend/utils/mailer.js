import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

let transporter = null;

/**
 * Initializes/Returns a Nodemailer transporter.
 * Automatically cleans Gmail App Passwords (removes spaces).
 */
export const getTransporter = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailService = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();

    if (!emailUser || !emailPass || emailUser.includes('your-') || emailPass.includes('paste-your-') || emailPass.includes('here')) {
        console.error('❌ Mailer Error: Credentials missing or placeholder in .env');
        return null;
    }

    // Clean spaces from password (Gmail app passwords often have spaces)
    const cleanPass = emailPass.replace(/\s+/g, '');

    if (emailService === 'gmail' && cleanPass.length !== 16) {
        console.warn(`⚠️ Warning: Gmail App Password is ${cleanPass.length} chars. (Expected: 16 chars). Authentication might fail.`);
    }

    // Always create a fresh transporter to pick up latest env values
    if (!transporter) {
        console.log(`📧 Initializing Nodemailer for: ${emailUser} via ${emailService.toUpperCase()}`);

        const config = emailService === 'brevo'
            ? {
                host: 'smtp-relay.brevo.com',
                port: 587,
                secure: false, // TLS
                auth: {
                    user: emailUser,
                    pass: cleanPass
                }
            }
            : {
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: emailUser,
                    pass: cleanPass
                },
                tls: {
                    rejectUnauthorized: false
                }
            };

        transporter = nodemailer.createTransport(config);
    }

    return transporter;
};

/**
 * Resets the transporter (useful when .env is updated via UI)
 */
export const resetTransporter = () => {
    transporter = null;
    console.log('📧 Mailer transporter reset.');
};

/**
 * Sends the automated offer email with PDF attachment.
 */
export const sendAutomaticOfferEmail = async (name, email) => {
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
        throw new Error('CORNER_CASE: Transporter not configured.');
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const pdfLink = `${baseUrl}/files/offerletter.pdf`;
    const pdfPath = path.join(process.cwd(), 'public', 'offerletter.pdf');

    // Check if PDF exists to avoid crash
    if (!fs.existsSync(pdfPath)) {
        console.warn(`⚠️ Warning: ${pdfPath} not found. Sending email without attachment.`);
    }

    const mailOptions = {
        from: `Forge India Connect HR <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: email,
        subject: `Welcome to Forge India Connect – Official Offer Letter Attached`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Congratulations ${name}!</h1>
                    <p style="color: #64748b; font-size: 16px; margin-top: 8px;">Welcome to the Forge India Connect Team</p>
                </div>
                
                <p>Hello <strong>${name}</strong>,</p>
                
                <p>We are delighted to inform you that your onboarding process is complete. We've officially issued your <strong>Offer Letter</strong>, which you can find <strong>attached to this email as a PDF document</strong>.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 8px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">Next Steps:</p>
                    <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #475569;">
                        <li>Review the attached Offer Letter.</li>
                        <li>Sign and return the document (if required).</li>
                        <li>Reach out to HR if you have any questions.</li>
                    </ul>
                </div>

                <p>If you have trouble viewing the attachment, you can also download it securely from our portal:</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${pdfLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                        View In Portal
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                
                <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                    Best Regards,<br/>
                    <strong>HR Administration Team</strong><br/>
                    Forge India Connect
                </p>
            </div>
        `,
        attachments: fs.existsSync(pdfPath) ? [
            {
                filename: 'Official_Offer_Letter.pdf',
                path: pdfPath,
                contentType: 'application/pdf'
            }
        ] : []
    };

    return await mailTransporter.sendMail(mailOptions);
};
