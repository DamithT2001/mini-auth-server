import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'a3f1...raw-token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
