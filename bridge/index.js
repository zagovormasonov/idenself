const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate clickable variants based on complaint
app.post('/api/generate-variants', async (req, res) => {
  try {
    const { complaint } = req.body;

    if (!complaint) {
      return res.status(400).json({ error: 'Complaint is required' });
    }

    const prompt = `Ты - профессиональный психолог. Пользователь описал свои жалобы: "${complaint}"

На основе этого описания создай 3-5 кликабельных вариантов ответов, которые наиболее точно отражают возможные состояния пользователя. Каждый вариант должен быть:
- Кратким (1-2 предложения)
- Конкретным и понятным
- Отражать разные аспекты описанной проблемы
- Написан от первого лица (как будто пользователь сам описывает)

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "variants": [
    "Первый вариант ответа от первого лица",
    "Второй вариант ответа от первого лица",
    "Третий вариант ответа от первого лица"
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.status(500).json({ error: 'Failed to parse AI response', details: text });
    }
  } catch (error) {
    console.error('Error generating variants:', error);
    res.status(500).json({ error: 'Failed to generate variants', details: error.message });
  }
});

// Generate Part 1 questionnaire based on complaint
app.post('/api/generate-part1', async (req, res) => {
  try {
    const { complaint, selectedVariant } = req.body;

    if (!complaint && !selectedVariant) {
      return res.status(400).json({ error: 'Complaint or selectedVariant is required' });
    }

    const contextText = selectedVariant || complaint;

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь выбрал следующий вариант, описывающий его состояние: "${contextText}"

На основе этих жалоб создай первую часть опросника для оценки психического здоровья. Опросник должен:
1. Включать 8-12 вопросов
2. Содержать вопросы, связанные с жалобами пользователя
3. Включать обязательные вопросы для выявления неочевидных симптомов (настроение, сон, аппетит, энергия, концентрация)
4. Некоторые вопросы должны требовать текстовых ответов (type: "text")
5. Некоторые вопросы с вариантами выбора (type: "choice")
6. Некоторые вопросы со шкалой от 1 до 10 (type: "scale")

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "questions": [
    {
      "id": "q1",
      "text": "текст вопроса",
      "type": "text",
      "options": []
    },
    {
      "id": "q2",
      "text": "текст вопроса",
      "type": "choice",
      "options": ["вариант 1", "вариант 2", "вариант 3"]
    },
    {
      "id": "q3",
      "text": "текст вопроса",
      "type": "scale",
      "options": []
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.status(500).json({ error: 'Failed to parse AI response', details: text });
    }
  } catch (error) {
    console.error('Error generating part 1:', error);
    res.status(500).json({ error: 'Failed to generate questionnaire', details: error.message });
  }
});

// Generate Part 2 questionnaire based on Part 1 answers
app.post('/api/generate-part2', async (req, res) => {
  try {
    const { complaint, answerspart1 } = req.body;

    if (!complaint || !answerspart1) {
      return res.status(400).json({ error: 'Complaint and answers from part 1 are required' });
    }

    const answersText = Object.entries(answerspart1)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь описал жалобы: "${complaint}"

И ответил на первую часть опросника:
${answersText}

На основе этих ответов создай вторую, углубленную часть опросника. Опросник должен:
1. Включать 6-10 вопросов
2. Углубленно исследовать выявленные проблемы
3. Уточнять важные детали для диагностики
4. Использовать различные типы вопросов (text, choice, scale)

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "questions": [
    {
      "id": "q1",
      "text": "текст вопроса",
      "type": "text",
      "options": []
    },
    {
      "id": "q2",
      "text": "текст вопроса",
      "type": "choice",
      "options": ["вариант 1", "вариант 2", "вариант 3"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.status(500).json({ error: 'Failed to parse AI response', details: text });
    }
  } catch (error) {
    console.error('Error generating part 2:', error);
    res.status(500).json({ error: 'Failed to generate questionnaire', details: error.message });
  }
});

// Generate final results and recommendations
app.post('/api/generate-results', async (req, res) => {
  try {
    const { complaint, answerspart1, answerspart2 } = req.body;

    if (!complaint || !answerspart1 || !answerspart2) {
      return res.status(400).json({ error: 'All data is required' });
    }

    const answers1Text = Object.entries(answerspart1)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const answers2Text = Object.entries(answerspart2)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь прошел полную оценку психического здоровья.

Исходная жалоба: "${complaint}"

Ответы на первую часть:
${answers1Text}

Ответы на вторую часть:
${answers2Text}

Создай три документа и список рекомендуемых тестов:

1. Подробный персональный план (personalPlan): многостраничный детальный план работы над выявленными проблемами, включая конкретные шаги, рекомендации по изменению образа жизни, техники саморегуляции

2. Подготовка к сеансам (psychPrep): отдельно для психолога и психиатра - что сказать на первом приеме, какие вопросы задать, что важно не забыть упомянуть

3. Документ для специалистов (specialistDoc): профессиональное резюме состояния пациента, список гипотез о возможных диагнозах, рекомендации по дополнительному обследованию

4. Рекомендуемые тесты (recommendedTests): массив конкретных психологических и медицинских тестов для уточнения диагноза

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "personalPlan": "Очень подробный текст плана (минимум 500 слов)...",
  "psychPrep": "Детальная подготовка к сеансам...",
  "specialistDoc": "Профессиональный документ для врачей с гипотезами...",
  "recommendedTests": [
    {
      "name": "Название теста",
      "description": "Краткое описание"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.status(500).json({ error: 'Failed to parse AI response', details: text });
    }
  } catch (error) {
    console.error('Error generating results:', error);
    res.status(500).json({ error: 'Failed to generate results', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Bridge API server running on port ${PORT}`);
  console.log(`Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
});


