import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ example: 'authorization_code' })
  @IsIn(['authorization_code', 'refresh_token'])
  grant_type: string;

  @ApiProperty({ required: false })
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsString()
  redirect_uri?: string;

  @ApiProperty({ example: 'mobile-app-prod' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ required: false, description: 'PKCE code verifier' })
  @IsString()
  code_verifier?: string;

  @ApiProperty({ required: false })
  @IsString()
  refresh_token?: string;
}
