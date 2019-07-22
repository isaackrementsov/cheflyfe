import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from 'typeorm';

export default class NutritionalInfo {

    @PrimaryGeneratedColumn()
    id : number;

    constructor(
        @Column('simple-json') public info
    ){}

}
