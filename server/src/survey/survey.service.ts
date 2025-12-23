import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class SurveyService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async createSession(userId: number) {
    // 1. Get symptoms list
    const symptoms = await this.gemini.getSymptomsList();

    // 2. Create Session
    const session = await this.prisma.session.create({
      data: {
        userId,
        status: 'SYMPTOMS_PENDING',
        symptoms: symptoms,
      },
    });

    return { sessionId: session.id, symptoms };
  }

  async submitSymptoms(sessionId: number, symptomsData: any, generalDescription: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Сессия не найдена');
    if (session.status !== 'SYMPTOMS_PENDING') {
      throw new NotFoundException('Симптомы уже отправлены');
    }

    // Update session with symptoms data
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { 
        status: 'PART1_PENDING',
        symptoms: symptomsData,
        complaint: generalDescription || null,
      },
    });

    // Generate Part 1 questions based on symptoms
    let questions = await this.gemini.generatePart1(symptomsData, generalDescription);

    // Проверяем, что вопросы были сгенерированы
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('Не удалось сгенерировать вопросы. Пожалуйста, попробуйте еще раз.');
    }

    // Нормализуем вопросы: добавляем недостающие поля и исправляем типы
    questions = questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      text: q.text || 'Вопрос без текста',
      type: q.type || 'text', // По умолчанию text, если тип не указан
      options: q.type === 'choice' ? (Array.isArray(q.options) ? q.options : []) : (q.options || [])
    }));

    // Save Part 1 questionnaire
    await this.prisma.questionnaire.create({
      data: {
        sessionId: session.id,
        type: 'PART1',
        questions: questions,
      },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'PART1_STARTED' },
    });

    return { questions };
  }

  async submitAnswers(sessionId: number, answers: any) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { questionnaires: true },
    });

    if (!session) throw new NotFoundException('Сессия не найдена');

    const symptoms = session.symptoms as any;
    const generalDescription = session.complaint || '';

    if (session.status === 'PART1_STARTED') {
      // Save Part 1 answers
      const q1 = session.questionnaires.find((q: any) => q.type === 'PART1');
      if (q1) {
        await this.prisma.questionnaire.update({
          where: { id: q1.id },
          data: { answers },
        });
      }

      // Generate Part 2
      let questionsPart2 = await this.gemini.generatePart2(symptoms, generalDescription, answers);
      
      // Проверяем, что вопросы были сгенерированы
      if (!questionsPart2 || !Array.isArray(questionsPart2) || questionsPart2.length === 0) {
        throw new Error('Не удалось сгенерировать вопросы для второй части. Пожалуйста, попробуйте еще раз.');
      }

      // Нормализуем вопросы: добавляем недостающие поля и исправляем типы
      questionsPart2 = questionsPart2.map((q: any, index: number) => ({
        id: q.id || `q2_${index + 1}`,
        text: q.text || 'Вопрос без текста',
        type: q.type || 'text', // По умолчанию text, если тип не указан
        options: q.type === 'choice' ? (Array.isArray(q.options) ? q.options : []) : (q.options || [])
      }));
      
      await this.prisma.questionnaire.create({
        data: {
          sessionId: session.id,
          type: 'PART2',
          questions: questionsPart2,
        },
      });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'PART2_STARTED' },
      });

      return { nextStep: 'PART2', questions: questionsPart2 };

    } else if (session.status === 'PART2_STARTED') {
      // Save Part 2 answers
      const q2 = session.questionnaires.find((q: any) => q.type === 'PART2');
      if (q2) {
        await this.prisma.questionnaire.update({
          where: { id: q2.id },
          data: { answers },
        });
      }

      // Get Part 1 answers for context
      const q1 = session.questionnaires.find((q: any) => q.type === 'PART1');
      const part1Answers = q1?.answers;

      // Generate Part 3 (Additional Tests)
      let questionsPart3 = await this.gemini.generatePart3(symptoms, generalDescription, part1Answers, answers);
      
      if (questionsPart3 && Array.isArray(questionsPart3) && questionsPart3.length > 0) {
        // Нормализуем вопросы: добавляем недостающие поля и исправляем типы
        questionsPart3 = questionsPart3.map((q: any, index: number) => ({
          id: q.id || `q3_${index + 1}`,
          text: q.text || 'Вопрос без текста',
          type: q.type || 'text', // По умолчанию text, если тип не указан
          options: q.type === 'choice' ? (Array.isArray(q.options) ? q.options : []) : (q.options || [])
        }));
        await this.prisma.questionnaire.create({
          data: {
            sessionId: session.id,
            type: 'PART3',
            questions: questionsPart3,
          },
        });

        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'PART3_STARTED' },
        });

        return { nextStep: 'PART3', questions: questionsPart3 };
      } else {
        // No Part 3, generate results directly
        const results = await this.gemini.generateResults(symptoms, generalDescription, part1Answers, answers, undefined);
        
        // Проверяем, что результаты были сгенерированы
        if (!results || typeof results !== 'object') {
          throw new Error('Не удалось сгенерировать результаты. Пожалуйста, попробуйте еще раз.');
        }

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

    } else if (session.status === 'PART3_STARTED') {
      // Save Part 3 answers
      const q3 = session.questionnaires.find((q: any) => q.type === 'PART3');
      if (q3) {
        await this.prisma.questionnaire.update({
          where: { id: q3.id },
          data: { answers },
        });
      }

      // Get all previous answers
      const q1 = session.questionnaires.find((q: any) => q.type === 'PART1');
      const q2 = session.questionnaires.find((q: any) => q.type === 'PART2');
      const part1Answers = q1?.answers;
      const part2Answers = q2?.answers;

      // Generate Results
      const results = await this.gemini.generateResults(symptoms, generalDescription, part1Answers, part2Answers, answers);
      
      // Проверяем, что результаты были сгенерированы
      if (!results || typeof results !== 'object') {
        throw new Error('Не удалось сгенерировать результаты. Пожалуйста, попробуйте еще раз.');
      }

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

