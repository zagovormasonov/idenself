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

// Get symptoms list
app.get('/api/get-symptoms', async (req, res) => {
  try {
    const prompt = `Ты - профессиональный психолог. Создай список основных симптомов и проблем психического здоровья, которые могут беспокоить людей.

Для каждого симптома создай:
- id (уникальный идентификатор)
- name (название симптома на русском языке)
- clarifications (массив из 3-5 уточнений для этого симптома)

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "symptoms": [
    {
      "id": "s1",
      "name": "Тревожность",
      "clarifications": ["Постоянная тревога", "Панические атаки", "Беспокойство без причины", "Страх перед будущим"]
    },
    {
      "id": "s2",
      "name": "Депрессия",
      "clarifications": ["Плохое настроение", "Потеря интереса", "Чувство безнадежности", "Отсутствие энергии"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback to default symptoms
      res.json({
        symptoms: [
          { id: 's1', name: 'Тревожность', clarifications: ['Постоянная тревога', 'Панические атаки', 'Беспокойство без причины'] },
          { id: 's2', name: 'Депрессия', clarifications: ['Плохое настроение', 'Потеря интереса', 'Чувство безнадежности'] },
          { id: 's3', name: 'Проблемы со сном', clarifications: ['Бессонница', 'Частые пробуждения', 'Слишком долгий сон'] },
          { id: 's4', name: 'Усталость', clarifications: ['Постоянная усталость', 'Нет энергии', 'Сложно вставать утром'] },
          { id: 's5', name: 'Проблемы с концентрацией', clarifications: ['Трудно сосредоточиться', 'Забывчивость', 'Рассеянность'] },
          { id: 's6', name: 'Изменения аппетита', clarifications: ['Потеря аппетита', 'Переедание', 'Изменение веса'] },
          { id: 's7', name: 'Раздражительность', clarifications: ['Вспышки гнева', 'Нетерпимость', 'Агрессивность'] },
          { id: 's8', name: 'Социальная изоляция', clarifications: ['Избегание общения', 'Одиночество', 'Трудности в отношениях'] }
        ]
      });
    }
  } catch (error) {
    console.error('Error getting symptoms:', error);
    res.status(500).json({ error: 'Failed to get symptoms', details: error.message });
  }
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

// Generate Part 1 questionnaire based on symptoms
app.post('/api/generate-part1', async (req, res) => {
  try {
    const { symptoms, generalDescription } = req.body;

    if (!symptoms && !generalDescription) {
      return res.status(400).json({ error: 'Symptoms or generalDescription is required' });
    }

    // Format symptoms data for prompt
    const symptomsText = Object.entries(symptoms || {}).map(([symptomId, data]: [string, any]) => {
      const symptomName = symptomId; // You might want to get actual name from symptoms list
      const clarifications = data.clarifications?.join(', ') || '';
      const customText = data.customText || '';
      return `- ${symptomName}: ${clarifications ? `уточнения: ${clarifications}` : ''} ${customText ? `описание: ${customText}` : ''}`;
    }).join('\n');

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь выбрал следующие симптомы и описал свое состояние:

Симптомы:
${symptomsText || 'Не указаны'}

Общее описание проблем:
${generalDescription || 'Не указано'}

На основе выбранных симптомов и описания создай первую часть опросника для оценки психического здоровья. Опросник должен:
        1. Включать 8-12 вопросов
        2. Содержать вопросы, связанные с выбранными симптомами пользователя
        3. Включать обязательные вопросы для выявления неочевидных проблем, которые могут быть не связаны напрямую с выбранными симптомами (настроение, сон, аппетит, энергия, концентрация, социальные отношения)
        4. Сканировать все возможные проблемы, даже если пользователь их не упомянул
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
    const { symptoms, generalDescription, answersPart1 } = req.body;

    if (!answersPart1) {
      return res.status(400).json({ error: 'Answers from part 1 are required' });
    }

    const answersText = Object.entries(answersPart1)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const symptomsText = symptoms ? Object.keys(symptoms).join(', ') : '';

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь выбрал симптомы: ${symptomsText}
Общее описание: ${generalDescription || 'Не указано'}

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

// Generate Part 3 (Additional Tests) based on previous answers
app.post('/api/generate-part3', async (req, res) => {
  try {
    const { symptoms, generalDescription, answersPart1, answersPart2 } = req.body;

    if (!answersPart1 || !answersPart2) {
      return res.status(400).json({ error: 'Answers from part 1 and part 2 are required' });
    }

    const answersText1 = Object.entries(answersPart1).map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`).join('\n');
    const answersText2 = Object.entries(answersPart2).map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`).join('\n');

    const prompt = `Ты - профессиональный психолог и психиатр. На основе предыдущих ответов пользователя определи конкретные проблемы и диагнозы, которые требуют дополнительного тестирования.

Ответы на первую часть:
${answersText1}

Ответы на вторую часть:
${answersText2}

Создай дополнительные тесты для конкретных проблем/диагнозов. Каждый тест должен быть направлен на подтверждение или опровержение конкретной гипотезы.

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "questions": [
    {
      "id": "q_p3_1",
      "text": "текст вопроса для конкретной проблемы",
      "type": "text" или "choice" или "scale",
      "options": [] или ["вариант 1", "вариант 2"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsedResponse = JSON.parse(text);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.json({ questions: [] });
    }
  } catch (error) {
    console.error('Error generating part 3:', error);
    res.json({ questions: [] });
  }
});

// Generate final results and recommendations
app.post('/api/generate-results', async (req, res) => {
  try {
    const { symptoms, generalDescription, answersPart1, answersPart2, answersPart3 } = req.body;

    if (!answersPart1 || !answersPart2) {
      return res.status(400).json({ error: 'Answers from part 1 and part 2 are required' });
    }

    const answers1Text = Object.entries(answersPart1)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const answers2Text = Object.entries(answersPart2)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n');

    const answers3Text = answersPart3 ? Object.entries(answersPart3)
      .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
      .join('\n') : '';

    const symptomsText = symptoms ? Object.entries(symptoms).map(([id, data]: [string, any]) => {
      return `${id}: ${data.clarifications?.join(', ') || ''} ${data.customText || ''}`;
    }).join('\n') : '';

    const prompt = `Ты - профессиональный психолог и психиатр. Пользователь прошел полную оценку психического здоровья.

Выбранные симптомы:
${symptomsText || 'Не указаны'}

Общее описание проблем:
${generalDescription || 'Не указано'}

Ответы на первую часть:
${answers1Text}

Ответы на вторую часть:
${answers2Text}
${answers3Text ? `Ответы на третью часть (дополнительные тесты):\n${answers3Text}` : ''}

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


