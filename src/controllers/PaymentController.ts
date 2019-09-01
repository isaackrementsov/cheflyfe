import {Request, Response} from 'express';
import {Repository, getRepository} from 'typeorm';
import User from '../entity/User';
import * as request from 'request';
import PaymentManager from '../managers/PaymentManager';

export default class PaymentController {

    userRepo : Repository<User>;

    getPayment = async (req: Request, res: Response) => {
        res.render('payment', {session: req.session, error: req.flash('error')});
    }

    getPostPayment = async (req: Request, res: Response) => {
        try {
            let toUpdate : User = await this.userRepo.findOne(req.session.userID);
            console.log({
                url: `https://api.ezypay.com/api/v1/customers?firstname=${toUpdate.name.first}&surname=${toUpdate.name.last}`,
                ...PaymentManager.options
            });
            if(toUpdate){
                request({
                    url: `https://api.ezypay.com/api/v1/customers?firstname=${toUpdate.name.first}&surname=${toUpdate.name.last}`,
                    ...PaymentManager.options
                }, async (err, r, b) => {
                    console.log(b);
                    try {
                        if(err) throw new Error(err);
                        let users = b.data;

                        if(users.constructor == Array){
                            let user = users.find(u => u.address == toUpdate.email);

                            if(user){
                                PaymentManager.getSubscriptionStatus(user.id, async status => {
                                    if(status == 'ACTIVE'){
                                        toUpdate.paymentStatus = status;
                                        toUpdate.paymentKey = user.id;
                                        req.session.pending = toUpdate.paymentStatus != 'ACTIVE' || toUpdate.emailPending;

                                        try {
                                            await this.userRepo.save(toUpdate);
                                            res.redirect(`/users/${req.session.userID}`);
                                        }catch(e){
                                            if(!res.headersSent){
                                                req.flash('error', 'There was an error saving changes');
                                                res.redirect('/pending');
                                            }
                                        }
                                    }else{
                                        req.flash('error', 'Your subscription is pending or cancelled');
                                        res.redirect('/pending');
                                    }
                                }, err => {
                                    if(!res.headersSent){
                                        req.flash('error', 'There was an error getting payment status');
                                        res.redirect('/pending');
                                    }
                                });
                            }else{
                                req.flash('error', 'There was an error finding your payment account');
                                res.redirect('/pending');
                            }
                        }else{
                            throw new Error('Authorization failed');
                        }
                    }catch(e){
                        if(!res.headersSent){
                            req.flash('error', 'There was an error saving changes');
                            res.redirect('/pending');
                        }
                    }
                });
            }
        }catch(e){
            if(!res.headersSent){
                req.flash('error', 'There was an error verifying payment');
                res.redirect('/pending');
            }
        }
    }

    constructor(){
        this.userRepo = getRepository(User);
    }

}
