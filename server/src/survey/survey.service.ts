import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class SurveyService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async createSession(userId: number, complaint: string) {
    // 1. Generate variants for user to select
    const variants = await this.gemini.generateVariants(complaint);

    // 2. Create Session
    const session = await this.prisma.session.create({
      data: {
        userId,
        complaint,
        status: 'VARIANTS_PENDING',
      },
    });

    // 3. Save Variants
    await this.prisma.questionnaire.create({
      data: {
        sessionId: session.id,
        type: 'VARIANTS',
        questions: { variants },
      },
    });

    return { sessionId: session.id, variants };
  }

  async selectVariant(sessionId: number, selectedVariant: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Сессия не найдена');
    if (session.status !== 'VARIANTS_PENDING') {
      throw new NotFoundException('Вариант уже выбран');
    }

    // Update session with selected variant
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { 
        status: 'STARTED',
        complaint: selectedVariant // Update complaint with selected variant
      },
    });

    // Generate Part 1 questions based on selected variant
    const questions = await this.gemini.generatePart1(session.complaint, selectedVariant);

    // Save Part 1 questionnaire
    await this.prisma.questionnaire.create({
      data: {
        sessionId: session.id,
        type: 'PART1',
        questions: questions,
      },
    });

    return { questions };
  }

  async submitAnswers(sessionId: number, answers: any) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { questionnaires: true },
    });

    if (!session) throw new NotFoundException('Сессия не найдена');

    if (session.status === 'STARTED') {
      // Find Part 1 questionnaire and save answers
      const q1 = session.questionnaires.find(q => q.type === 'PART1');
      if (q1) {
        await this.prisma.questionnaire.update({
          where: { id: q1.id },
          data: { answers },
        });
      }

      // Generate Part 2
      const questionsPart2 = await this.gemini.generatePart2(session.complaint, answers);
      
      await this.prisma.questionnaire.create({
        data: {
          sessionId: session.id,
          type: 'PART2',
          questions: questionsPart2,
        },
      });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'PART1_COMPLETED' },
      });

      return { nextStep: 'PART2', questions: questionsPart2 };

    } else if (session.status === 'PART1_COMPLETED') {
       // Find Part 2 questionnaire and save answers
      const q2 = session.questionnaires.find(q => q.type === 'PART2');
      if (q2) {
        await this.prisma.questionnaire.update({
          where: { id: q2.id },
          data: { answers },
        });
      }

      // Generate Results
      // Get Part 1 answers for context
      const q1 = session.questionnaires.find(q => q.type === 'PART1');
      const part1Answers = q1?.answers;

      const results = await this.gemini.generateResults(session.complaint, part1Answers, answers);

      await this.prisma.questionnaire.create({
        data: {
          sessionId: session.id,
          type: 'RESULTS',
          questions: results,
        },
      });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'FINISHED' },
      });

      return { nextStep: 'FINISHED', results };
    }

    return { message: 'Сессия уже завершена' };
  }
  
  async getSession(sessionId: number) {
      return this.prisma.session.findUnique({
          where: { id: sessionId },
          include: { questionnaires: true }
      });
  }
}

