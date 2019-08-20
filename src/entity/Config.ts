import {Entity, Column, PrimaryGeneratedColumn, Index} from 'typeorm';

@Entity()
export default class Config {

    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    path : string;

    @Column()
    @Index({unique: true})
    category : 'terms' | 'privacy';

    constructor(config: Partial<Config>){
        Object.assign(this, config);
    }

}
