import * as request from 'request';

export default class PaymentManager {
    static account = {
        u: 'Administrator',
        p: 'ProjectPassword1!',
        i: 'Anne Ah Gee',
        s: 'kaDGoAMmB1ur15mcmw9m4OhMh14pIV',
    };
    static token : {value: string, generated: Date};
    static options = {
        method: 'GET',
        headers: {'merchant': '7616', 'Authorization': `Bearer kaDGoAMmB1ur15mcmw9m4OhMh14pIV`}
    };

    static generateToken(cb){
        let a = PaymentManager.account;
        let type = 'password';
        request({
            url: `https://identity.ezypay.com/token`,
            method: 'POST',
            body: `grant_type=${type}&username=${a.u}&password=${a.p}&client_id=${a.i}&client_secret=${a.s}&scope=integrator%20billing_profile%20create_payment_method%20offline_access`,
            headers: {'Authorization': `application/x-www-form-urlencoded`, 'Content-Type': 'application/x-www-form-urlencoded'}
        }, (err, r, b) => {
            let fail = true;

            cb();
        });
    }

    static getSubscriptionStatus(customerId : string, cb: (status: string) => void, cbErr: (err: Error) => void){
        PaymentManager.generateToken(() => {
            request({
                url: `https://api-global.ezypay.com/v2/subscriptions?customerId=${customerId}`,
                ...PaymentManager.options
            }, (err, r, b) => {
                if(err) cbErr(err);
                else {
                    try {
                        if(b.data){
                            let st = b.data[0].status;
                            cb(st);
                        }else{
                            cb('MISSING');
                        }
                    }catch(e){
                        cbErr(e);
                    }
                }
            });
        });
    }
}
