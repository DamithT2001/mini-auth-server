import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'a3f1c2d4e5f60789a1b2c3d4e5f60789a3f1c2d4e5f60789a1b2c3d4e5f60789',
    description: '64-character hexadecimal verification token',
  })
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[0-9a-f]{64}$/i, {
    message: 'token must be a 64-character hexadecimal string',
  })
  token: string;
}
