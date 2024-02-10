import { IsDefined, IsString } from 'class-validator';

export class UserCreateDTO {
  @IsString()
  @IsDefined()
  fullName: string;
}
