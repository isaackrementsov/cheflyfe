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
        headers: {'merchant': '7616','Authorization': `Basic kaDGoAMmB1ur15mcmw9m4OhMh14pIV`}
    };

    static getSubscriptionStatus(customerId : string, cb: (status: string) => void, cbErr: (err: Error) => void){
        request({
            url: `https://api.ezypay.com/api/v1/subscriptions?customerId=${customerId}`,
            ...PaymentManager.options
        }, (err, r, b) => {
            console.log(b);
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
    }
}
