import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class HowTo {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    link : string;
    @Column()
    description : string;

    constructor(howTo: Partial<HowTo>){
        Object.assign(this, howTo);
    }

}
