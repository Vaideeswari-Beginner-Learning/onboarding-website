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

    if (!emailUser || !emailPass || emailUser.includes('your-') || emailPass.includes('paste-your-')) {
        console.error('❌ Mailer Error: Credentials missing in .env');
        return null;
    }

    // Clean space from app password (Gmail app passwords often have spaces)
    const cleanPass = emailPass.replace(/\s+/g, '');

    if (cleanPass.length !== 16) {
        console.warn(`⚠️ Warning: Gmail App Password is ${cleanPass.length} chars. (Expected: 16 chars). Authentication might fail.`);
    }

    if (!transporter) {
        console.log(`📧 Initializing Nodemailer for: ${emailUser}`);
        transporter = nodemailer.createTransport({
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
        });
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
        subject: `Welcome to Forge India Connect – Official Offer Letter`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #007bff;">Hello ${name},</h2>
                <p>Congratulations on completing your onboarding process successfully.</p>
                <p>We are excited to have you join our team! Please download your official <strong>Offer Letter</strong> using the button below, or view the attached PDF document.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${pdfLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Download Offer Letter
                    </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                    Alternatively, you can copy and paste this link into your browser:<br/>
                    <span style="color: #007bff;">${pdfLink}</span>
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p>Best Regards,<br/><strong>HR Administration Team</strong></p>
            </div>
        `,
        attachments: fs.existsSync(pdfPath) ? [
            {
                filename: 'Offer_Letter.pdf',
                path: pdfPath
            }
        ] : []
    };

    return await mailTransporter.sendMail(mailOptions);
};
