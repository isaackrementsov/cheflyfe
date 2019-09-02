import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';
import PaymentManager from '../managers/PaymentManager';

export default class PaymentController {

    userRepo : Repository<User>;

    getPayment = async (req: Request, res: Response) => {
        let plans = [];
        console.log('getting payment')
        try {
            plans = await PaymentManager.getAllPlans(4);
        }catch(e){
            console.log(e);
            req.flash('error', 'There was an error getting payment plans');
        }

        res.render('payment', {session: req.session, plans, error: req.flash('error'), payment: true});
    }

    getSignup = async (req: Request, res: Response) => {
        try {
            let plan = await PaymentManager.getPlan(req.params.id);
            let existing = await PaymentManager.getExistingUser(req.session.userID);

            res.render(plan ? 'paymentSignup' : 'notFound', {plan, existing, session: req.session, error: req.flash('error'), payment: true});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error getting plan');
                res.redirect('/payment');
            }
        }
    }

    getSubscription = async (req: Request, res: Response) => {
        try {
            let user = await this.userRepo.findOne(req.session.userID);
            let subscription = await PaymentManager.getActiveSubscription(user.paymentKey);

            res.render('subscription', {subscription, session: req.session, error: req.flash('error')});
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error getting subscription');
                res.redirect(`/users/${req.session.userID}`);
            }
        }
    }

    postSignup = async (req: Request, res: Response) => {
        try {
            let status = await PaymentManager.signupForPlan(req.params.id, {
                userID: req.session.userID,
                token: req.body.stripeToken,
            });

            req.session.pending = status != 'ACTIVE' || req.session.emailPending;
            req.session.paymentStatus = status;
            req.session.paid = true;

            res.redirect('/subscription');
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error signing you up for the plan');
                res.redirect(`/payment/signup/${req.params.id}`)
            }
        }
    }

    postCancelSubscription = async (req: Request, res: Response) => {
        try {
            await PaymentManager.cancelSubscription(req.params.id);
            res.redirect('/subscription');
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error cancelling subscription');
                res.redirect('/subscription');
            }
        }
    }

    constructor(){
        this.userRepo = getRepository(User);
    }

}
