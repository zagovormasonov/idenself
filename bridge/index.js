const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
      // Validate response structure
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        console.error('Invalid response structure, missing questions array:', parsedResponse);
        res.status(500).json({ error: 'Invalid AI response structure', details: 'Missing or invalid questions array' });
        return;
      }
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

// Survey API endpoints
app.post('/api/survey/start', async (req, res) => {
  try {
    // Get symptoms list first
    const symptoms = await getSymptomsList();

    // Create session
    const result = await pool.query(
      'INSERT INTO sessions (status, symptoms) VALUES ($1, $2) RETURNING id',
      ['SYMPTOMS_PENDING', JSON.stringify(symptoms)]
    );

    res.json({ sessionId: result.rows[0].id, symptoms });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/survey/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get questionnaires
    const questionnairesResult = await pool.query(
      'SELECT * FROM questionnaires WHERE session_id = $1 ORDER BY created_at',
      [id]
    );

    session.questionnaires = questionnairesResult.rows;

    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

app.post('/api/survey/:id/submit-symptoms', async (req, res) => {
  try {
    const { id } = req.params;
    const { symptoms, generalDescription } = req.body;

    // Check session exists and is in correct state
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessionResult.rows[0].status !== 'SYMPTOMS_PENDING') {
      return res.status(400).json({ error: 'Symptoms already submitted' });
    }

    // Generate Part 1 questions
    const questions = await generatePart1(symptoms, generalDescription);

    // Update session
    await pool.query(
      'UPDATE sessions SET status = $1, symptoms = $2, complaint = $3 WHERE id = $4',
      ['PART1_STARTED', JSON.stringify(symptoms), generalDescription || null, id]
    );

    // Create questionnaire
    await pool.query(
      'INSERT INTO questionnaires (session_id, type, questions) VALUES ($1, $2, $3)',
      [id, 'PART1', JSON.stringify(questions)]
    );

    res.json({ questions });
  } catch (error) {
    console.error('Error submitting symptoms:', error);
    res.status(500).json({ error: 'Failed to submit symptoms' });
  }
});

app.post('/api/survey/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get last questionnaire
    const questionnaireResult = await pool.query(
      'SELECT * FROM questionnaires WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    const lastQ = questionnaireResult.rows[0];

    if (session.status === 'PART1_STARTED') {
      // Update Part 1 answers
      await pool.query(
        'UPDATE questionnaires SET answers = $1 WHERE id = $2',
        [JSON.stringify(answers), lastQ.id]
      );

      // Generate Part 2
      const questionsPart2 = await generatePart2(session.symptoms, session.complaint, answers);

      await pool.query(
        'INSERT INTO questionnaires (session_id, type, questions) VALUES ($1, $2, $3)',
        [id, 'PART2', JSON.stringify(questionsPart2)]
      );

      await pool.query(
        'UPDATE sessions SET status = $1 WHERE id = $2',
        ['PART2_STARTED', id]
      );

      res.json({ nextStep: 'PART2', questions: questionsPart2 });

    } else if (session.status === 'PART2_STARTED') {
      // Update Part 2 answers
      await pool.query(
        'UPDATE questionnaires SET answers = $1 WHERE id = $2',
        [JSON.stringify(answers), lastQ.id]
      );

      // Get Part 1 answers
      const part1Result = await pool.query(
        'SELECT answers FROM questionnaires WHERE session_id = $1 AND type = $2',
        [id, 'PART1']
      );
      const part1Answers = part1Result.rows[0]?.answers;

      // Generate Part 3 or Results
      const questionsPart3 = await generatePart3(session.symptoms, session.complaint, part1Answers, answers);

      if (questionsPart3 && questionsPart3.length > 0) {
        await pool.query(
          'INSERT INTO questionnaires (session_id, type, questions) VALUES ($1, $2, $3)',
          [id, 'PART3', JSON.stringify(questionsPart3)]
        );

        await pool.query(
          'UPDATE sessions SET status = $1 WHERE id = $2',
          ['PART3_STARTED', id]
        );

        res.json({ nextStep: 'PART3', questions: questionsPart3 });
      } else {
        // Generate Results
        const results = await generateResults(session.symptoms, session.complaint, part1Answers, answers, null);

        await pool.query(
          'INSERT INTO questionnaires (session_id, type, questions) VALUES ($1, $2, $3)',
          [id, 'RESULTS', JSON.stringify(results)]
        );

        await pool.query(
          'UPDATE sessions SET status = $1 WHERE id = $2',
          ['FINISHED', id]
        );

        res.json({ nextStep: 'FINISHED', results });
      }

    } else if (session.status === 'PART3_STARTED') {
      // Update Part 3 answers and generate Results
      await pool.query(
        'UPDATE questionnaires SET answers = $1 WHERE id = $2',
        [JSON.stringify(answers), lastQ.id]
      );

      // Get all previous answers
      const part1Result = await pool.query(
        'SELECT answers FROM questionnaires WHERE session_id = $1 AND type = $2',
        [id, 'PART1']
      );
      const part2Result = await pool.query(
        'SELECT answers FROM questionnaires WHERE session_id = $1 AND type = $2',
        [id, 'PART2']
      );

      const part1Answers = part1Result.rows[0]?.answers;
      const part2Answers = part2Result.rows[0]?.answers;

      const results = await generateResults(session.symptoms, session.complaint, part1Answers, part2Answers, answers);

      await pool.query(
        'INSERT INTO questionnaires (session_id, type, questions) VALUES ($1, $2, $3)',
        [id, 'RESULTS', JSON.stringify(results)]
      );

      await pool.query(
        'UPDATE sessions SET status = $1 WHERE id = $2',
        ['FINISHED', id]
      );

      res.json({ nextStep: 'FINISHED', results });
    }

  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ error: 'Failed to submit answers' });
  }
});

// Helper functions
async function getSymptomsList() {
  // Use existing get-symptoms logic
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
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const parsedResponse = JSON.parse(text);
  return parsedResponse.symptoms || [];
}

async function generatePart1(symptoms, generalDescription) {
  const symptomsText = Object.entries(symptoms || {}).map(([symptomId, data]) => {
    const symptomName = symptomId;
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
5. Некоторые вопросы должны требовать текстовых ответов (type: "text")
6. Некоторые вопросы с вариантами выбора (type: "choice")
7. Некоторые вопросы со шкалой от 1 до 10 (type: "scale")

Верни ТОЛЬКО валидный JSON в следующем формате (без дополнительного текста, без markdown):
{
  "questions": [
    {
      "id": "q1",
      "text": "текст вопроса",
      "type": "text",
      "options": []
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const parsedResponse = JSON.parse(text);
  if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
    throw new Error('Invalid AI response structure');
  }

  return parsedResponse.questions;
}

async function generatePart2(symptoms, generalDescription, answers) {
  const answersText = Object.entries(answers || {})
    .map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`)
    .join('\n');

  const prompt = `Ты - профессиональный психолог и психиатр. На основе первой части опросника создай вторую, углубленную часть.

Ответы на первую часть:
${answersText}

Создай вторую часть опросника:
1. Включать 6-10 вопросов
2. Углубленно исследовать выявленные проблемы
3. Уточнять важные детали для диагностики
4. Использовать различные типы вопросов (text, choice, scale)

Верни ТОЛЬКО валидный JSON с массивом questions.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const parsedResponse = JSON.parse(text);
  return parsedResponse.questions || [];
}

async function generatePart3(symptoms, generalDescription, answersPart1, answersPart2) {
  const answersText = [
    ...Object.entries(answersPart1 || {}),
    ...Object.entries(answersPart2 || {})
  ].map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`).join('\n');

  const prompt = `На основе всех предыдущих ответов определи конкретные проблемы и диагнозы.

Ответы:
${answersText}

Создай дополнительные тесты для конкретных проблем. Верни массив questions или пустой массив если тесты не нужны.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsedResponse = JSON.parse(text);
    return parsedResponse.questions || [];
  } catch (error) {
    return [];
  }
}

async function generateResults(symptoms, generalDescription, answersPart1, answersPart2, answersPart3) {
  const allAnswers = [
    ...Object.entries(answersPart1 || {}),
    ...Object.entries(answersPart2 || {}),
    ...(answersPart3 ? Object.entries(answersPart3) : [])
  ].map(([qId, answer]) => `${qId}: ${JSON.stringify(answer)}`).join('\n');

  const prompt = `Создай персональный план и рекомендации на основе всех ответов.

Ответы:
${allAnswers}

Верни JSON с personalPlan, psychPrep, specialistDoc, recommendedTests.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      personalPlan: "Не удалось сгенерировать план",
      psychPrep: "Не удалось сгенерировать рекомендации",
      specialistDoc: "Не удалось сгенерировать документ",
      recommendedTests: []
    };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Bridge API server running on port ${PORT}`);
  console.log(`Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`Database configured: ${!!process.env.DATABASE_URL}`);
});


