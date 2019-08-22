import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';
import {DBCategory} from '../util/typeDefs';

@Entity()
export default class Record {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    timestamp : Date = new Date();
    @Column()
    category : DBCategory;

    constructor(category: DBCategory){this.category = category}

}
