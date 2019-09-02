import * as stripe from 'stripe';
import { getRepository, Repository } from 'typeorm';
import User from '../entity/User';

let config = require('../../config.json');

export default abstract class PaymentManager {
    private static secret = config.APIKey;
    private static stripe = stripe(PaymentManager.secret);
    private static planInfo = [
        {n: 'Entree', icon: 'restaurant_menu', description: 'Yearly payments for a discounted price'},
        {n: 'Appetizer', icon: 'local_pizza', description: '6 month payment intervals'},
        {n: 'Sample', icon: 'adjust', description: 'Pay every 3 months, easy cancellation'},
        {n: 'Event', icon: 'event', description: 'Special pricing deal, available for a limited time only'}
    ];

    private static async getSubscription(params: object) : Promise<object> {
        let subscriptions = await PaymentManager.stripe.subscriptions.list(params);

        return subscriptions.data[0];
    }

    static async cancelSubscription(subscriptionID: string){
        await PaymentManager.stripe.subscriptions.update(subscriptionID, {cancel_at_period_end: true});
    }

    static async getActiveSubscription(paymentKey: string){
        return await PaymentManager.getSubscription({customer: paymentKey, status: 'active'});
    }

    static async getSubscriptionStatus(paymentKey: string) : Promise<string> {
        try {
            return await PaymentManager.getActiveSubscription(paymentKey)['status'].toUpperCase();
        }catch(e){
            return 'MISSING';
        }
    }

    static async getAllPlans(limit: number) : Promise<object[]> {
        let pl = await PaymentManager.stripe.plans.list({limit});
        let plans = pl.data;
        let objs = [];

        for(let i = plans.length - 1; i >= 0; i--){
            let info = PaymentManager.planInfo.find(n => n.n == plans[i].nickname);

            objs.push({
                id: plans[i].id,
                nickname: plans[i].nickname,
                amount: (plans[i].amount/100).toFixed(2),
                ...info
            });
        }

        return objs;
    }

    static async getPlan(id: string) : Promise<object> {
        let plan = await PaymentManager.stripe.plans.retrieve(id);

        return {...plan, ...PaymentManager.planInfo.find(n => n.n == plan.nickname)};
    }

    static async getExistingUser(userID: string, paymentKey?: string) : Promise<object> {
        let user = null;

        if(!paymentKey){
            let user : User = await getRepository(User).findOne(userID);

            paymentKey = user.paymentKey;
        }
        try {
            user = await PaymentManager.stripe.customers.retrieve(paymentKey);
        }catch(e){ user = null; }


        return user;
    }

    static async signupForPlan(planId: string, user: {userID: string, token: string}) : Promise<string> {
        let userRepo : Repository<User> = getRepository(User);
        let u : User = await userRepo.findOne(user.userID);
        let customer;

        if(u.paymentKey != ''){
            customer = await PaymentManager.getExistingUser(user.userID, u.paymentKey);

            if(user.token && customer){
                await PaymentManager.stripe.customers.update(customer.id, {source: user.token});
            }
        }

        if(!customer){
            customer = await PaymentManager.stripe.customers.create({
                email: u.email,
                name: `${u.name.first} ${u.name.last}`,
                source: user.token
            });

            u.paymentKey = customer.id;
            await userRepo.save(u);
        }

        let plan = await PaymentManager.getPlan(planId);

        let subscription = await PaymentManager.stripe.subscriptions.create({
            customer: customer.id,
            items: [{plan: plan['id']}]
        });

        return subscription.status.toUpperCase();
    }
}
