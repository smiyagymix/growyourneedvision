import { emailService } from './emailService';

/**
 * Email Templates for all platform notifications
 * Extends the base emailService with specific templates
 */

export const emailTemplates = {
    /**
     * Send assignment notification to students
     */
    async notifyNewAssignment(
        studentEmail: string,
        studentName: string,
        assignmentTitle: string,
        dueDate: string,
        teacherName: string
    ) {
        return emailService.send({
            to: [studentEmail],
            from: 'assignments@growyourneed.com',
            subject: `New Assignment: ${assignmentTitle}`,
            html_body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">📚 New Assignment</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${studentName},</p>
                        
                        <p style="font-size: 16px; color: #666;">Your teacher<strong> ${teacherName}</strong> has posted a new assignment:</p>
                        
                        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                            <h2 style="color: #667eea; margin: 0 0 10px 0; font-size: 20px;">${assignmentTitle}</h2>
                            <p style="color: #e74c3c; font-weight: bold; margin: 0;">⏰ Due: ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">Log in to your student dashboard to view details and submit your work.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${window.location.origin}/student/assignments" style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Assignment</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                            <p>Grow Your Need - Educational Platform</p>
                        </div>
                    </div>
                </div>
            `,
            plain_body: `Hi ${studentName}, Your teacher ${teacherName} has posted a new assignment: "${assignmentTitle}". Due: ${dueDate}. Log in to view: ${window.location.origin}/student/assignments`,
            tag: 'assignment'
        });
    },

    /**
     * Send grade notification to student and parent
     */
    async notifyGradePosted(
        emails: string[],
        studentName: string,
        assignmentTitle: string,
        grade: number,
        feedback?: string
    ) {
        const letterGrade = grade >= 90 ? 'A' : grade >= 80 ? 'B' : grade >= 70 ? 'C' : grade >= 60 ? 'D' : 'F';
        const gradeColor = grade >= 70 ? '#10b981' : grade >= 60 ? '#f59e0b' : '#ef4444';

        return emailService.send({
            to: emails,
            from: 'grades@growyourneed.com',
            subject: `Grade Posted: ${assignmentTitle}`,
            html_body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Grade Posted</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello ${studentName}'s family,</p>
                        
                        <p style="font-size: 16px; color: #666;">A new grade has been posted for:</p>
                        
                        <div style="background: #f8f9fa; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center;">
                            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">${assignmentTitle}</h2>
                            <div style="display: inline-block; background: ${gradeColor}; color: white; padding: 20px 40px; border-radius: 50%; font-size: 32px; font-weight: bold; margin: 10px 0;">
                                ${letterGrade}
                            </div>
                            <p style="color: #666; font-size: 18px; margin: 20px 0 0 0;"><strong>${grade}%</strong></p>
                        </div>
                        
                        ${feedback ? `
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Teacher Feedback:</h3>
                            <p style="color: #856404; margin: 0;">${feedback}</p>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${window.location.origin}/student/grades" style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View All Grades</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                            <p>Grow Your Need - Educational Platform</p>
                        </div>
                    </div>
                </div>
            `,
            plain_body: `Grade Posted for ${studentName}: ${assignmentTitle} - ${grade}% (${letterGrade}). ${feedback ? 'Feedback: ' + feedback : ''}`,
            tag: 'grade'
        });
    },

    /**
     * Send attendance alert to parent
     */
    async notifyAbsence(
        parentEmail: string,
        studentName: string,
        date: string,
        period?: string
    ) {
        return emailService.send({
            to: [parentEmail],
            from: 'attendance@growyourneed.com',
            subject: `Attendance Alert: ${studentName}`,
            html_body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Attendance Alert</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear Parent/Guardian,</p>
                        
                        <p style="font-size: 16px; color: #666;">This is to inform you that <strong>${studentName}</strong> was marked absent${period ? ` for ${period}` : ''} on:</p>
                        
                        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #991b1b; font-size: 18px; font-weight: bold; margin: 0;">📅 ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">If this absence was not excused, please contact the school office. If your child was present, please verify their attendance with the teacher.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${window.location.origin}/parent/attendance" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Attendance Record</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                            <p>Grow Your Need - Educational Platform</p>
                        </div>
                    </div>
                </div>
            `,
            plain_body: `Attendance Alert: ${studentName} was marked absent on ${date}${period ? ` for ${period}` : ''}. View details: ${window.location.origin}/parent/attendance`,
            tag: 'attendance'
        });
    },

    /**
     * Send support ticket confirmation
     */
    async notifyTicketCreated(
        userEmail: string,
        userName: string,
        ticketId: string,
        subject: string
    ) {
        return emailService.send({
            to: [userEmail],
            from: 'support@growyourneed.com',
            subject: `Support Ticket Created: #${ticketId}`,
            html_body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">🎫 Support Ticket Created</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${userName},</p>
                        
                        <p style="font-size: 16px; color: #666;">Your support ticket has been received and will be reviewed by our team shortly.</p>
                        
                        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #1e40af; margin: 0 0 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
                            <p style="color: #1e40af; margin: 0;"><strong>Subject:</strong> ${subject}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">We typically respond within 24-48 hours. You can track your ticket anytime.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${window.location.origin}/help-center/tickets" style="background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">View Ticket</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                            <p>Grow Your Need - Support Team</p>
                        </div>
                    </div>
                </div>
            `,
            plain_body: `Support Ticket Created #${ticketId}: ${subject}. We'll respond within 24-48 hours. View: ${window.location.origin}/help-center/tickets`,
            tag: 'support'
        });
    }
};
