import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schemas/review.schema.js';
import { ReviewReaction } from './schemas/review-reaction.schema.js';
import { ReviewComment } from './schemas/review-comment.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { MoviesService } from '../movies/movies.service.js';
import { ModerationService } from '../moderation/moderation.service.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewReaction.name)
    private reactionModel: Model<ReviewReaction>,
    @InjectModel(ReviewComment.name)
    private commentModel: Model<ReviewComment>,
    private readonly moviesService: MoviesService,
    private readonly moderationService: ModerationService,
  ) {}

  async create(
    userId: string,
    userName: string,
    dto: CreateReviewDto,
  ): Promise<Review> {
    const existing = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      movieId: dto.movieId,
    });

    if (existing) {
      if (existing.status === 'rejected') {
        await existing.deleteOne();
      } else {
        throw new ConflictException('Вы уже оставили отзыв на этот фильм');
      }
    }

    // Ensure a movie exists in MongoDB for $lookup in findLatest/findByUser
    await this.moviesService.ensureMovieInDb(dto.movieId);

    const modResult = this.moderationService.moderateText(dto.text);

    return this.reviewModel.create({
      userId: new Types.ObjectId(userId),
      movieId: dto.movieId,
      rating: dto.rating,
      text: dto.text,
      userName,
      status: modResult.status,
      moderationReason: modResult.reason,
    });
  }

  async createGuest(dto: CreateReviewDto): Promise<Review> {
    const guestName = dto.guestName?.trim();
    const guestToken = dto.guestToken?.trim();

    if (!guestName) {
      throw new BadRequestException('Укажите имя для публикации отзыва');
    }

    if (!guestToken) {
      throw new BadRequestException('Не удалось создать гостевую сессию');
    }

    const existing = await this.reviewModel.findOne({
      guestToken,
      movieId: dto.movieId,
    });

    if (existing) {
      throw new ConflictException('Вы уже оставили гостевой отзыв на этот фильм');
    }

    await this.moviesService.ensureMovieInDb(dto.movieId);

    const modResult = this.moderationService.moderateText(dto.text);

    return this.reviewModel.create({
      guestToken,
      isGuest: true,
      movieId: dto.movieId,
      rating: dto.rating,
      text: dto.text,
      userName: guestName,
      status: 'pending',
      moderationReason:
        modResult.reason || 'Гостевой отзыв отправлен на ручную модерацию',
    });
  }

  async toggleReaction(userId: string, dto: ToggleReactionDto) {
    const userOid = new Types.ObjectId(userId);
    const reviewOid = new Types.ObjectId(dto.reviewId);

    const review = await this.reviewModel.findById(reviewOid);
    if (review?.userId && review.userId.toString() === userId) {
      throw new ForbiddenException(
        'Нельзя ставить реакции на собственные отзывы',
      );
    }

    const existing = await this.reactionModel.findOne({
      userId: userOid,
      reviewId: reviewOid,
    });

    if (existing) {
      if (existing.type === dto.type) {
        await existing.deleteOne();
      } else {
        existing.type = dto.type;
        await existing.save();
      }
    } else {
      await this.reactionModel.create({
        userId: userOid,
        reviewId: reviewOid,
        type: dto.type,
      });
    }

    const [likesCount, dislikesCount] = await Promise.all([
      this.reactionModel.countDocuments({ reviewId: reviewOid, type: 'like' }),
      this.reactionModel.countDocuments({
        reviewId: reviewOid,
        type: 'dislike',
      }),
    ]);

    const current = await this.reactionModel.findOne({
      userId: userOid,
      reviewId: reviewOid,
    });

    return {
      likesCount,
      dislikesCount,
      userReaction: current?.type || null,
    };
  }

  async findByUser(userId: string, page: number, limit: number) {
    const userOid = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const result = await this.reviewModel.aggregate([
      { $match: { userId: userOid } },
      { $sort: { createdAt: -1 as const } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          reviews: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'movies',
                localField: 'movieId',
                foreignField: 'compositeId',
                as: 'movie',
              },
            },
            { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                rating: 1,
                text: 1,
                userName: 1,
                createdAt: 1,
                movieId: 1,
                status: 1,
                moderationReason: 1,
                movie: {
                  _id: { $ifNull: ['$movie.compositeId', '$movieId'] },
                  title: { $ifNull: ['$movie.title', 'Неизвестный фильм'] },
                  posterPath: '$movie.posterPath',
                },
              },
            },
          ],
        },
      },
    ]);

    const { metadata, reviews } = result[0];
    const total = metadata[0]?.total || 0;

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicStats() {
    const [totalReviews, userAuthors, guestAuthors] = await Promise.all([
      this.reviewModel.countDocuments({ status: 'approved' }),
      this.reviewModel
        .distinct('userId', { status: 'approved', userId: { $exists: true } })
        .then((ids) => ids.length),
      this.reviewModel
        .distinct('guestToken', {
          status: 'approved',
          guestToken: { $exists: true },
        })
        .then((tokens) => tokens.length),
    ]);
    const totalAuthors = userAuthors + guestAuthors;
    return { totalReviews, totalAuthors };
  }

  async getAverageRatings(movieIds: string[]): Promise<Record<string, number>> {
    const result = await this.reviewModel.aggregate([
      { $match: { movieId: { $in: movieIds }, status: 'approved' } },
      { $group: { _id: '$movieId', avg: { $avg: '$rating' } } },
    ]);

    const ratings: Record<string, number> = {};
    for (const item of result) {
      ratings[item._id.toString()] = Math.round(item.avg * 10) / 10;
    }
    return ratings;
  }

  async findLatest(limit = 20) {
    return this.reviewModel.aggregate([
      { $match: { status: 'approved' } },
      { $sort: { createdAt: -1 as const } },
      { $limit: limit },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: 'compositeId',
          as: 'movie',
        },
      },
      { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          rating: 1,
          text: 1,
          userName: 1,
          createdAt: 1,
          movieId: 1,
          movie: {
            _id: { $ifNull: ['$movie.compositeId', '$movieId'] },
            title: { $ifNull: ['$movie.title', 'Неизвестный фильм'] },
            posterPath: '$movie.posterPath',
          },
        },
      },
    ]);
  }

  async findByMovie(movieId: string, userId?: string) {
    const matchStage: any = { movieId };
    if (userId) {
      matchStage.$or = [
        { status: 'approved' },
        { userId: new Types.ObjectId(userId), status: 'pending' },
      ];
    } else {
      matchStage.status = 'approved';
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sort: { createdAt: -1 as const } },
      {
        $lookup: {
          from: 'reviewreactions',
          localField: '_id',
          foreignField: 'reviewId',
          as: 'reactions',
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.type', 'like'] },
              },
            },
          },
          dislikesCount: {
            $size: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.type', 'dislike'] },
              },
            },
          },
        },
      },
    ];

    if (userId) {
      const userOid = new Types.ObjectId(userId);
      pipeline.push({
        $addFields: {
          userReaction: {
            $let: {
              vars: {
                match: {
                  $filter: {
                    input: '$reactions',
                    cond: { $eq: ['$$this.userId', userOid] },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$match' }, 0] },
                  then: { $arrayElemAt: ['$$match.type', 0] },
                  else: null,
                },
              },
            },
          },
        },
      });
    } else {
      pipeline.push({ $addFields: { userReaction: null } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'reviewcomments',
          localField: '_id',
          foreignField: 'reviewId',
          as: 'comments',
        },
      },
      {
        $addFields: {
          commentsCount: {
            $size: {
              $filter: {
                input: '$comments',
                cond: { $eq: ['$$this.status', 'approved'] },
              },
            },
          },
        },
      },
      {
        $project: {
          reactions: 0,
          comments: 0,
        },
      },
    );

    return this.reviewModel.aggregate(pipeline);
  }

  async createComment(
    userId: string,
    userName: string,
    dto: CreateCommentDto,
  ): Promise<ReviewComment> {
    const review = await this.reviewModel.findById(dto.reviewId);
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    const modResult = this.moderationService.moderateText(dto.text);

    return this.commentModel.create({
      userId: new Types.ObjectId(userId),
      reviewId: new Types.ObjectId(dto.reviewId),
      text: dto.text,
      userName,
      status: modResult.status,
      moderationReason: modResult.reason,
    });
  }

  async getCommentsByReview(reviewId: string) {
    return this.commentModel
      .find({
        reviewId: new Types.ObjectId(reviewId),
        status: 'approved',
      })
      .sort({ createdAt: 1 });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    }
    await comment.deleteOne();
    return { deleted: true };
  }
}
