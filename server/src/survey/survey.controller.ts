import { Controller, Post, Body, UseGuards, Request, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('survey')
@UseGuards(AuthGuard('jwt'))
export class SurveyController {
  constructor(private surveyService: SurveyService) {}

  @Post('start')
  async startSurvey(@Request() req: any) {
    return this.surveyService.createSession(req.user.userId);
  }

  @Post(':id/submit-symptoms')
  async submitSymptoms(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { symptoms: any, generalDescription: string }
  ) {
    return this.surveyService.submitSymptoms(id, body.symptoms, body.generalDescription);
  }

  @Get(':id/get-symptoms')
  async getSymptoms(@Param('id', ParseIntPipe) id: number) {
    const session = await this.surveyService.getSession(id);
    if (!session) {
      throw new NotFoundException('Сессия не найдена');
    }
    return { symptoms: session.symptoms || [] };
  }

  @Post(':id/submit')
  async submitAnswers(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { answers: any }
  ) {
    return this.surveyService.submitAnswers(id, body.answers);
  }

  @Get(':id')
  async getSession(@Param('id', ParseIntPipe) id: number) {
      return this.surveyService.getSession(id);
  }
}

