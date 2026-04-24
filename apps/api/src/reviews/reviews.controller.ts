import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { VerifiedEmailGuard } from '../auth/verified-email.guard.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    if (req.user) {
      return this.reviewsService.create(req.user.id, req.user.name, dto);
    }

    return this.reviewsService.createGuest(dto);
  }

  @Post('reactions')
  @UseGuards(JwtAuthGuard, VerifiedEmailGuard)
  toggleReaction(@Req() req: any, @Body() dto: ToggleReactionDto) {
    return this.reviewsService.toggleReaction(req.user.id, dto);
  }

  @Get('stats')
  @SkipThrottle()
  getPublicStats() {
    return this.reviewsService.getPublicStats();
  }

  @Get('ratings')
  @SkipThrottle()
  getAverageRatings(@Query('movieIds') movieIds: string) {
    const ids = movieIds ? movieIds.split(',').filter(Boolean) : [];
    if (ids.length === 0) return {};
    return this.reviewsService.getAverageRatings(ids);
  }

  @Get('latest')
  @SkipThrottle()
  findLatest(@Query('limit') limit?: string) {
    return this.reviewsService.findLatest(limit ? parseInt(limit, 10) : 20);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findByUser(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.reviewsService.findByUser(req.user.id, query.page, query.limit);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard, VerifiedEmailGuard)
  createComment(@Req() req: any, @Body() dto: CreateCommentDto) {
    return this.reviewsService.createComment(req.user.id, req.user.name, dto);
  }

  @Get('comments/:reviewId')
  @SkipThrottle()
  getCommentsByReview(@Param('reviewId') reviewId: string) {
    return this.reviewsService.getCommentsByReview(reviewId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Req() req: any, @Param('commentId') commentId: string) {
    return this.reviewsService.deleteComment(commentId, req.user.id);
  }

  @Get('movie/:movieId')
  @SkipThrottle()
  @UseGuards(OptionalJwtAuthGuard)
  findByMovie(@Req() req: any, @Param('movieId') movieId: string) {
    return this.reviewsService.findByMovie(movieId, req.user?.id);
  }
}
