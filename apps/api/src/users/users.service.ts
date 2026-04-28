import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './user.schema.js';
import { Review } from '../reviews/schemas/review.schema.js';
import { ReviewReaction } from '../reviews/schemas/review-reaction.schema.js';
import { ReviewComment } from '../reviews/schemas/review-comment.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(ReviewReaction.name)
    private reactionModel: Model<ReviewReaction>,
    @InjectModel(ReviewComment.name)
    private commentModel: Model<ReviewComment>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    googleId?: string;
    isEmailVerified?: boolean;
    emailVerificationToken?: string;
  }): Promise<User> {
    return this.userModel.create(data);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userModel.findOne({ emailVerificationToken: token });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(id).select('+password');
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async deleteAccount(id: string): Promise<void> {
    const userOid = new Types.ObjectId(id);

    const userReviews = await this.reviewModel.find({ userId: userOid }).select('_id');
    const reviewIds = userReviews.map((r) => r._id);

    await Promise.all([
      this.reviewModel.deleteMany({ userId: userOid }),
      this.reactionModel.deleteMany({
        $or: [{ userId: userOid }, { reviewId: { $in: reviewIds } }],
      }),
      this.commentModel.deleteMany({
        $or: [{ userId: userOid }, { reviewId: { $in: reviewIds } }],
      }),
    ]);

    await this.userModel.findByIdAndDelete(id);
  }
}
