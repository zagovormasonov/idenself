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
        text: 'You mentioned feeling overwhelmed. Can you describe a specific recent situation where this feeling was most intense?',
        type: 'text'
      },
      {
        id: 'q2',
        text: 'How does your sleep quality correlate with these feelings?',
        type: 'choice',
        options: ['Worse sleep makes it worse', 'No relation', 'I sleep too much']
      },
      {
        id: 'c1',
        text: 'On a scale of 1-10, how would you rate your overall energy levels today?',
        type: 'scale', // treated as text or number
        isConstant: true
      },
      {
        id: 'c2',
        text: 'Have you experienced any changes in appetite recently?',
        type: 'text',
        isConstant: true
      }
    ];
  }

  private getMockPart2() {
    return [
      {
        id: 'q3',
        text: 'Based on your sleep issues, do you have trouble falling asleep or staying asleep?',
        type: 'text'
      },
      {
        id: 'q4',
        text: 'Do you feel these symptoms are affecting your work or relationships?',
        type: 'choice',
        options: ['Yes, significantly', 'Somewhat', 'No']
      }
    ];
  }

  private getMockResults() {
    return {
      personalPlan: `
# Personal Mental Health Plan

Based on your complaints about feeling overwhelmed and sleep issues, here is a tailored plan.

## 1. Immediate Actions
- **Sleep Hygiene**: Establish a fixed sleep schedule. Avoid screens 1 hour before bed.
- **Mindfulness**: Try 5 minutes of box breathing when feeling overwhelmed.

## 2. Lifestyle Adjustments
- Reduce caffeine intake after 12 PM.
- Incorporate a 20-minute daily walk.

## 3. Long-term Goals
- Build a support system.
- Regular self-reflection journaling.
      `,
      psychPrep: `
# Preparation for Psychologist Session

## Key Topics to Discuss
1. The specific situation where you felt most overwhelmed.
2. The correlation between your sleep and mood.
3. Impact on work/relationships.

## Recommended Approach
- Be open about your daily routine.
- Mention the appetite changes.
      `,
      specialistDoc: `
# Specialist Hypothesis Document

## Potential Areas of Concern
- **Generalized Anxiety**: Indicated by "overwhelmed" feeling and sleep disturbance.
- **Burnout**: If work-related stress is high.

## Recommended Tests/Assessments
- **GAD-7**: To assess anxiety levels.
- **PHQ-9**: To screen for depressive symptoms.
- **Cortisol Level Test**: To check physiological stress response.

## Hypotheses
1. Sleep deprivation is exacerbating emotional regulation issues.
2. Environmental stressors are the primary trigger.
      `,
      recommendedTests: [
        { name: 'GAD-7', description: 'Generalized Anxiety Disorder assessment' },
        { name: 'Cortisol Test', description: 'Physiological stress marker check' }
      ]
    };
  }
}

