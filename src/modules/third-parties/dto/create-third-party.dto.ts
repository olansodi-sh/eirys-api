import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DocumentType,
  ThirdPartyType,
} from '../entities/third-party.entity';

export class CreateThirdPartyDto {
  @IsOptional()
  @IsEnum(ThirdPartyType)
  type?: ThirdPartyType;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(DocumentType)
  docType?: DocumentType;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
