import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async generatePart1(complaint: string): Promise<any> {
    if (!this.model) {
      return this.getMockPart1();
    }
    
    // Stub for real AI call
    // In real implementation: prompt engineering to return JSON
    // const result = await this.model.generateContent(`Generate survey part 1 for complaint: ${complaint}`);
    // return JSON.parse(result.response.text());
    
    return this.getMockPart1();
  }

  async generatePart2(complaint: string, part1Answers: any): Promise<any> {
    if (!this.model) {
      return this.getMockPart2();
    }
    return this.getMockPart2();
  }

  async generateResults(complaint: string, part1Answers: any, part2Answers: any): Promise<any> {
    if (!this.model) {
      return this.getMockResults();
    }
    return this.getMockResults();
  }

  private getMockPart1() {
    return [
      {
        id: 'q1',
        text: 'Вы упомянули о чувстве подавленности. Можете ли вы описать конкретную недавнюю ситуацию, когда это чувство было наиболее интенсивным?',
        type: 'text'
      },
      {
        id: 'q2',
        text: 'Как качество вашего сна связано с этими чувствами?',
        type: 'choice',
        options: ['Плохой сон усугубляет ситуацию', 'Нет связи', 'Я сплю слишком много']
      },
      {
        id: 'c1',
        text: 'По шкале от 1 до 10, как бы вы оценили свой общий уровень энергии сегодня?',
        type: 'scale',
        isConstant: true
      },
      {
        id: 'c2',
        text: 'Замечали ли вы какие-либо изменения в аппетите в последнее время?',
        type: 'text',
        isConstant: true
      }
    ];
  }

  private getMockPart2() {
    return [
      {
        id: 'q3',
        text: 'Учитывая проблемы со сном, у вас проблемы с засыпанием или с поддержанием сна?',
        type: 'text'
      },
      {
        id: 'q4',
        text: 'Чувствуете ли вы, что эти симптомы влияют на вашу работу или отношения?',
        type: 'choice',
        options: ['Да, значительно', 'В некоторой степени', 'Нет']
      }
    ];
  }

  private getMockResults() {
    return {
      personalPlan: `
# Личный план ментального здоровья

На основе ваших жалоб о чувстве подавленности и проблемах со сном, вот индивидуальный план.

## 1. Немедленные действия
- **Гигиена сна**: Установите фиксированный режим сна. Избегайте экранов за 1 час до сна.
- **Осознанность**: Попробуйте 5 минут коробочного дыхания при чувстве подавленности.

## 2. Корректировка образа жизни
- Снизьте потребление кофеина после 12 дня.
- Включите 20-минутную ежедневную прогулку.

## 3. Долгосрочные цели
- Постройте систему поддержки.
- Регулярное ведение дневника саморефлексии.
      `,
      psychPrep: `
# Подготовка к сеансу с психологом

## Ключевые темы для обсуждения
1. Конкретная ситуация, в которой вы чувствовали себя наиболее подавленно.
2. Корреляция между вашим сном и настроением.
3. Влияние на работу/отношения.

## Рекомендуемый подход
- Будьте открыты относительно своего распорядка дня.
- Упомяните изменения в аппетите.
      `,
      specialistDoc: `
# Документ гипотез для специалиста

## Потенциальные области беспокойства
- **Генерализованная тревожность**: Указывается чувством "подавленности" и нарушениями сна.
- **Выгорание**: Если рабочий стресс высок.

## Рекомендуемые тесты/оценки
- **GAD-7**: Для оценки уровня тревожности.
- **PHQ-9**: Для скрининга депрессивных симптомов.
- **Тест уровня кортизола**: Для проверки физиологической реакции на стресс.

## Гипотезы
1. Недосып усугубляет проблемы с эмоциональной регуляцией.
2. Факторы окружающей среды являются основным триггером.
      `,
      recommendedTests: [
        { name: 'GAD-7', description: 'Оценка генерализованного тревожного расстройства' },
        { name: 'Тест на кортизол', description: 'Проверка физиологического маркера стресса' }
      ]
    };
  }
}

