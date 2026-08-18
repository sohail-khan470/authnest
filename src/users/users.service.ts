import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import {User} from "@prisma/client";

@Injectable()
export class UsersService{
    constructor(private prisma:PrismaService){}

    async findByEmail(email:string){
        return this.prisma.user.findUnique({where:{
            email
        }})
    }

    async createUser(email:string,hashedPassword:string):Promise<User | null>{
        return this.prisma.user.create({
            data:{
                email,
                password:hashedPassword
            }
        })
    }


}