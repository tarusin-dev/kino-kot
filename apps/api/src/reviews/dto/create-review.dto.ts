import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(movie|series|cartoon)-\d+$/, {
    message: 'movieId должен быть в формате movie-123, series-123 или cartoon-123',
  })
  movieId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  guestName?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(120)
  guestToken?: string;
}
