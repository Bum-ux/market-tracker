import { Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "src/prisma.service";
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ConflictException } from '@nestjs/common';
import { LoginDto } from "./dto/login.dto";
import { UnauthorizedException } from "@nestjs/common";

@Injectable()
export class AuthService{
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ){}

    async register(dto: RegisterDto){
        const emailExisted = await this.prismaService.user.findUnique({
            where: {email:dto.email}
        })
        if (emailExisted){
            throw new ConflictException('Email đã tồn tại!')
        }

        const harshedPassword = await bcrypt.hash(dto.password, 10)

        const user = await this.prismaService.user.create({
            data: {
                email:dto.email,
                password: harshedPassword
            }
        })
        const {password, ...result} = user
        return result
    }

    async login(dto: LoginDto){
        const userEmail = await this.prismaService.user.findUnique({
            where: {email:dto.email}
        })
        if (!userEmail){
            throw new UnauthorizedException('Email không tồn tại!')
        }

        const isMatch = await bcrypt.compare(dto.password, userEmail.password)
        if (!isMatch) {
            throw new UnauthorizedException('Sai mật khẩu!')
        }

        const token = this.jwtService.sign({
            sub: userEmail.id,
            email: userEmail.email
        })
        return {access_token: token}
    }

}