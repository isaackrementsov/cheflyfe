import * as nodemailer from 'nodemailer';

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

}
