import { Controller, Post, Body, UseGuards, Request, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('survey')
@UseGuards(AuthGuard('jwt'))
export class SurveyController {
  constructor(private surveyService: SurveyService) {}

  @Post('start')
  async startSurvey(@Request() req, @Body() body: { complaint: string }) {
    return this.surveyService.createSession(req.user.userId, body.complaint);
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

