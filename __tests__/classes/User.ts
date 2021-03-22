import { IsString, MinLength } from 'class-validator'

export class User {
  @MinLength(5)
  @IsString()
  firstName: string;
}