import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private bridgeApiUrl: string | undefined;
  private useBridge: boolean;

  constructor() {
    this.bridgeApiUrl = process.env.BRIDGE_API_URL;
    this.useBridge = !!this.bridgeApiUrl;
  }

  async getSymptomsList(): Promise<any[]> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock symptoms');
      return [
        { id: 's1', name: 'Тревожность', clarifications: ['Постоянная тревога', 'Панические атаки', 'Беспокойство без причины'] },
        { id: 's2', name: 'Депрессия', clarifications: ['Плохое настроение', 'Потеря интереса', 'Чувство безнадежности'] },
        { id: 's3', name: 'Проблемы со сном', clarifications: ['Бессонница', 'Частые пробуждения', 'Слишком долгий сон'] },
        { id: 's4', name: 'Усталость', clarifications: ['Постоянная усталость', 'Нет энергии', 'Сложно вставать утром'] },
        { id: 's5', name: 'Проблемы с концентрацией', clarifications: ['Трудно сосредоточиться', 'Забывчивость', 'Рассеянность'] },
        { id: 's6', name: 'Изменения аппетита', clarifications: ['Потеря аппетита', 'Переедание', 'Изменение веса'] },
        { id: 's7', name: 'Раздражительность', clarifications: ['Вспышки гнева', 'Нетерпимость', 'Агрессивность'] },
        { id: 's8', name: 'Социальная изоляция', clarifications: ['Избегание общения', 'Одиночество', 'Трудности в отношениях'] }
      ];
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/get-symptoms`;
      const response = await axios.get(url, { timeout: 30000 });
      return response.data.symptoms || [];
    } catch (error: any) {
      console.error('Error getting symptoms list:', error.message);
      return [
        { id: 's1', name: 'Тревожность', clarifications: ['Постоянная тревога', 'Панические атаки', 'Беспокойство без причины'] },
        { id: 's2', name: 'Депрессия', clarifications: ['Плохое настроение', 'Потеря интереса', 'Чувство безнадежности'] },
        { id: 's3', name: 'Проблемы со сном', clarifications: ['Бессонница', 'Частые пробуждения', 'Слишком долгий сон'] }
      ];
    }
  }

  async generateVariants(complaint: string): Promise<string[]> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock variants');
      return [
        'Я чувствую постоянную усталость и сонливость',
        'У меня проблемы со сном и настроением',
        'Меня беспокоит тревожность и стресс'
      ];
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/generate-variants`;
      const payload = { complaint };
      
      console.log('=== Calling Bridge API for Variants ===');
      console.log('URL:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bridge API Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data.variants || [];
    } catch (error: any) {
      console.error('=== Error calling bridge API for variants ===');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('Falling back to mock variants');
      return [
        'Я чувствую постоянную усталость и сонливость',
        'У меня проблемы со сном и настроением',
        'Меня беспокоит тревожность и стресс'
      ];
    }
  }

  async generatePart1(symptoms: any, generalDescription: string): Promise<any> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock data');
      return this.getMockPart1();
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/generate-part1`;
      const payload = { 
        symptoms,
        generalDescription
      };
      
      console.log('=== Calling Bridge API for Part 1 ===');
      console.log('URL:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bridge API Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data.questions;
    } catch (error: any) {
      console.error('=== Error calling bridge API for part1 ===');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('Falling back to mock data');
      return this.getMockPart1();
    }
  }

  async generatePart2(symptoms: any, generalDescription: string, part1Answers: any): Promise<any> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock data');
      return this.getMockPart2();
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/generate-part2`;
      const payload = { symptoms, generalDescription, answersPart1: part1Answers };
      
      console.log('=== Calling Bridge API for Part 2 ===');
      console.log('URL:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bridge API Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data.questions;
    } catch (error: any) {
      console.error('=== Error calling bridge API for part2 ===');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      }
      console.log('Falling back to mock data');
      return this.getMockPart2();
    }
  }

  async generatePart3(symptoms: any, generalDescription: string, part1Answers: any, part2Answers: any): Promise<any> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock data');
      return [];
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/generate-part3`;
      const payload = { symptoms, generalDescription, answersPart1: part1Answers, answersPart2: part2Answers };
      
      console.log('=== Calling Bridge API for Part 3 (Additional Tests) ===');
      console.log('URL:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bridge API Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data.questions || [];
    } catch (error: any) {
      console.error('=== Error calling bridge API for part3 ===');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('Falling back to empty array');
      return [];
    }
  }

  async generateResults(symptoms: any, generalDescription: string, part1Answers: any, part2Answers: any, part3Answers?: any): Promise<any> {
    if (!this.useBridge) {
      console.log('Bridge API URL not configured, using mock data');
      return this.getMockResults();
    }
    
    try {
      const url = `${this.bridgeApiUrl}/api/generate-results`;
      const payload = { symptoms, generalDescription, answersPart1: part1Answers, answersPart2: part2Answers, answersPart3: part3Answers };
      
      console.log('=== Calling Bridge API for Results ===');
      console.log('URL:', url);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(url, payload, {
        timeout: 120000, // 2 minutes for complex generation
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bridge API Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('=== Error calling bridge API for results ===');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      }
      console.log('Falling back to mock data');
      return this.getMockResults();
    }
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

