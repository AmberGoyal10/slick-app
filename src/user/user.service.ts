import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { UserCreateDTO } from './user-create.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getUser(id: string) {
    return { fullName: 'Amber', id };
  }

  async createUser(userDto: UserCreateDTO) {
    return await this.userModel.create(userDto);
  }
}
