import * as nodemailer from 'nodemailer';
import User from '../entity/User';

export default class EmailManager {

    static account = {
        user: 'info@cheflyfe.com',
        password: 'Cairnsboy01!'
    }

    static async sendEmail(to: string, email: {subject: string, html: string}){
        let transport = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: EmailManager.account.user,
                pass: EmailManager.account.password
            }
        });

        await transport.sendMail({
            from: 'ChefLyfe.com <info@cheflyfe.com>',
            to: to,
            subject: email.subject,
            html: email.html
        });
    }

    static async sendVerificationEmail(user: User){
        await EmailManager.sendEmail(user.email, {
            subject: 'Verify your email',
            html: `Hello ${user.name.first} ${user.name.last},<br>
            To use your ChefLyfe account,
            please <a href="https://cheflyfe.com/verify?authKey=${user.authKey}">verify</a> that your email is ${user.email}.
            Your account may be deleted if you do not confirm.<br>
            Regards,<br>
            Cheflyfe Team`
        });
    }

}
