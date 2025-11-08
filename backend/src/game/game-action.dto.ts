import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class GameActionDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsObject()
  @IsNotEmpty()
  action: {
    id: string;
    method: string;
    parameters?: any;
  };
}
