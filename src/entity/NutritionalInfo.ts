import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn} from 'typeorm';
import Ingredient from './Ingredient';

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

    @OneToOne(type => Ingredient, i => i.nutritionalInfo)
    ingredient : Ingredient;

    constructor(nutritionalInfo : Partial<NutritionalInfo>){
        Object.assign(this, nutritionalInfo);
    }

}
