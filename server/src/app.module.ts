import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GeminiModule } from './gemini/gemini.module';
import { SurveyModule } from './survey/survey.module';

@Module({
  imports: [PrismaModule, AuthModule, GeminiModule, SurveyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
