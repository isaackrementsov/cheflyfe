import * as nodemailer from 'nodemailer';

export default class EmailManager {

    static account = {
        user: 'cheflyfe.info@gmail.com',
        password: 'ProjectPassword1!'
    }

    static async sendEmail(to: string, email: {subject: string, html: string}){
        let transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cheflyfe.info@gmail.com',
                pass: 'ProjectPassword1!'
            }
        });

        await transport.sendMail({
            from: 'ChefLyfe Support <cheflyfe.info@gmail.com>',
            to: to,
            subject: email.subject,
            html: email.html
        });
    }

}
