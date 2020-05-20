import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';
import PaymentManager from '../managers/PaymentManager';

export default class PaymentController {

    userRepo : Repository<User>;

    getPayment = async (req: Request, res: Response) => {
        let plans = [];

        try {
            plans = await PaymentManager.getAllPlans(4);
        }catch(e){
            req.flash('error', 'There was an error getting payment plans');
        }

        if(req.session.emailPending){
            req.flash('error', 'Verify your email before selecting payment');
            res.redirect('/pending');
        }else{
            res.render('payment', {session: req.session, plans: [], error: req.flash('error'), payment: true});
        }
    }

    getSignup = async (req: Request, res: Response) => {
        try {
            let plan = await PaymentManager.getPlan(req.params.id);
            let existing = await PaymentManager.getExistingUser(req.session.userID);

            if(req.session.emailPending){
                req.flash('error', 'Verify your email before selecting payment');
                res.redirect('/pending');
            }else{
                res.render(plan ? 'paymentSignup' : 'notFound', {plan, existing, session: req.session, error: req.flash('error'), payment: true});
            }
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
            let customer = await PaymentManager.getExistingUser('', user.paymentKey);

            res.render('subscription', {subscription, customer, session: req.session, error: req.flash('error')});
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
                freeTrial: !req.session.hasUsedFreeTrial,
                userID: req.session.userID,
                token: req.body.stripeToken,
                code: req.body.couponCodeOpt,
                country: req.body.country
            });

            if(status == 'TRIALING') status = 'ACTIVE';

            req.session.hasUsedFreeTrial = true;
            req.session.paymentStatus = status;
            req.session.pending = status != 'ACTIVE' || req.session.emailPending;
            req.session.paid = true;

            res.redirect('/subscription');
        }catch(e){
            console.log(e);
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
