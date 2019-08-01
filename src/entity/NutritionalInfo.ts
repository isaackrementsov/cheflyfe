import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from 'typeorm';

//TODO: Make defined attributes, not giant JSON
@Entity()
export default class NutritionalInfo {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    cholesterol : number;
    @Column()
    sodium : number;
    @Column()
    protein : number;
    @Column('simple-json')
    carbohydrates : {total: number, fiber: number, sugar: number};
    @Column('simple-json')
    calories : {total: number, fromFat: number};
    @Column('simple-json')
    fat : {total: number, saturated: number, trans: number};

    constructor(nutritionalInfo : Partial<NutritionalInfo>){
        Object.assign(this, nutritionalInfo);
    }

}
