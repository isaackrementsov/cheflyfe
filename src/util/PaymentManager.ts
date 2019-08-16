import { PaymentInfo } from "./typeDefs";

export default class PaymentManager {

    static instance : PaymentManager;

    createNewPaymentAccount(info : PaymentInfo){

    }

    getSubscriptionStatus(paymentId : string) : string {
        return 'pending';
    }

    constructor(){
        PaymentManager.instance = this;
    }
}
