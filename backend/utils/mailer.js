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


