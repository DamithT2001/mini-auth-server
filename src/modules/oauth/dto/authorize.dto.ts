import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AuthorizeDto {
  @ApiProperty({ example: 'code' })
  @IsIn(['code'])
  response_type: string;

  @ApiProperty({ example: 'mobile-app-prod' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ example: 'https://app.example.com/callback' })
  @IsUrl()
  redirect_uri: string;

  @ApiProperty({ required: false, example: 'openid profile' })
  @IsString()
  scope?: string;

  @ApiProperty({ required: false })
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: 'PKCE code challenge' })
  @IsString()
  code_challenge?: string;

  @ApiProperty({ required: false, example: 'S256' })
  @IsIn(['S256', 'plain'])
  code_challenge_method?: string;
}
