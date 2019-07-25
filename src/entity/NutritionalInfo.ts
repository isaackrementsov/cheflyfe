import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from 'typeorm';

//TODO: Make defined attributes, not giant JSON
@Entity()
export default class NutritionalInfo {

    @PrimaryGeneratedColumn()
    id : number;

    @Column('simple-json')
    info;

    constructor(nutritionalInfo : Partial<NutritionalInfo>){
        Object.assign(this, nutritionalInfo);
    }

}
