import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from 'typeorm';

//TODO: Make defined attributes, not giant JSON
@Entity()
export default class NutritionalInfo {

    @PrimaryGeneratedColumn()
    id : number;

    constructor(
        @Column('simple-json') public info
    ){}

}
