import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { EmailService } from '../email/email.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { User } from '../users/user.schema.js';

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email уже занят');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = randomUUID();

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      emailVerificationToken,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
    );

    const id = user._id.toString();
    const tokens = this.generateTokens(id);

    return {
      user: this.serializeUser(user),
      message: 'Проверьте вашу почту для подтверждения email',
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Недействительная ссылка подтверждения');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined as any;
    await user.save();

    return { message: 'Email успешно подтверждён' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.isEmailVerified) {
      return { message: 'Email уже подтверждён' };
    }

    const newToken = randomUUID();
    user.emailVerificationToken = newToken;
    await user.save();

    await this.emailService.sendVerificationEmail(user.email, newToken);

    return { message: 'Письмо отправлено повторно' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Если email зарегистрирован, вы получите письмо со ссылкой для сброса пароля' };
    }

    const resetToken = randomUUID();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Если email зарегистрирован, вы получите письмо со ссылкой для сброса пароля' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Ссылка для сброса пароля недействительна или истекла');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined as any;
    user.passwordResetExpires = undefined as any;
    await user.save();

    return { message: 'Пароль успешно изменён' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const id = user._id.toString();
    const tokens = this.generateTokens(id);
    return {
      user: this.serializeUser(user),
      ...tokens,
    };
  }

  getGoogleAuthorizationUrl(state: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new InternalServerErrorException(
        'Google авторизация не настроена',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async loginWithGoogle(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Google авторизация не настроена',
      );
    }

    try {
      const tokenResponse = await axios.post<{
        access_token: string;
      }>(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const userInfoResponse = await axios.get<GoogleUserInfo>(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        },
      );

      const user = await this.findOrCreateGoogleUser(userInfoResponse.data);
      const tokens = this.generateTokens(user._id.toString());

      return {
        user: this.serializeUser(user),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Не удалось выполнить вход через Google');
    }
  }

  generateTokens(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user._id.toString());
    } catch {
      throw new UnauthorizedException('Невалидный refresh token');
    }
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.serializeUser(user);
  }

  buildFrontendUrl(path: string, params?: Record<string, string>) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = new URL(path, frontendUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  private async findOrCreateGoogleUser(profile: GoogleUserInfo) {
    if (!profile.sub || !profile.email || !profile.email_verified) {
      throw new UnauthorizedException(
        'Google не вернул подтверждённый email',
      );
    }

    const email = profile.email.toLowerCase();
    const displayName = profile.name?.trim() || email.split('@')[0] || 'User';

    const existingGoogleUser = await this.usersService.findByGoogleId(
      profile.sub,
    );
    if (existingGoogleUser) {
      return existingGoogleUser;
    }

    const existingEmailUser = await this.usersService.findByEmail(email);
    if (existingEmailUser) {
      let hasChanges = false;

      if (existingEmailUser.googleId !== profile.sub) {
        existingEmailUser.googleId = profile.sub;
        hasChanges = true;
      }

      if (!existingEmailUser.isEmailVerified) {
        existingEmailUser.isEmailVerified = true;
        existingEmailUser.emailVerificationToken = undefined as any;
        hasChanges = true;
      }

      if (hasChanges) {
        await existingEmailUser.save();
      }

      return existingEmailUser;
    }

    return this.usersService.create({
      name: displayName,
      email,
      password: await bcrypt.hash(randomUUID(), 10),
      googleId: profile.sub,
      isEmailVerified: true,
    });
  }

  private serializeUser(user: User) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
    };
  }
}
