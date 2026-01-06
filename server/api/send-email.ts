import nodemailer from 'nodemailer';

/**
 * SMTP Email Sending API Endpoint
 * Uses Turbo-SMTP or any SMTP provider
 * 
 * Setup: npm install nodemailer
 */

const SMTP_CONFIG = {
    host: process.env.VITE_SMTP_HOST || 'pro.eu.turbo-smtp.com',
    port: parseInt(process.env.VITE_SMTP_PORT || '465'),
    secure: process.env.VITE_SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.VITE_SMTP_USERNAME || '', // Consumer Key
        pass: process.env.VITE_SMTP_PASSWORD || ''  // Consumer Secret
    }
};

// Create reusable transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { from, to, cc, bcc, subject, text, html, replyTo } = req.body;

        // Validate required fields
        if (!to || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: to, subject'
            });
        }

        // Send email
        const info = await transporter.sendMail({
            from: from || process.env.VITE_SMTP_FROM_EMAIL || 'noreply@growyourneed.com',
            to,
            cc,
            bcc,
            subject,
            text,
            html,
            replyTo
        });

        console.log('✅ Email sent successfully:', info.messageId);

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
            response: info.response
        });

    } catch (error: any) {
        console.error('❌ Email sending failed:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
}

/**
 * Verify SMTP connection on server start
 */
export async function verifyConnection() {
    try {
        await transporter.verify();
        console.log('✅ SMTP Server ready to send emails');
        return true;
    } catch (error) {
        console.error('❌ SMTP Connection failed:', error);
        return false;
    }
}
