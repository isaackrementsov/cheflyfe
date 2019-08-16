import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export default class Visit {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    timestamp : Date = new Date();

    constructor(){}
    
}
