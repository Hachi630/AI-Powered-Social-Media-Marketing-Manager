// Question classifier utility
// Classifies questions as 'step' (needs step-by-step format) or 'general' (natural language)

/**
 * Classify question type based on keywords and structure
 * @param question User's question text
 * @returns 'step' for step-by-step questions, 'general' for other questions
 */
export function classifyQuestion(question: string): 'step' | 'general' {
  if (!question || !question.trim()) {
    return 'general';
  }

  const lowerQuestion = question.toLowerCase();
  const trimmedQuestion = question.trim();

  // Step-related keywords (Chinese and English)
  const stepKeywords = [
    // Chinese keywords
    '如何', '怎么', '怎样', '步骤', '流程', '操作', '创建', '设置', 
    '连接', '发布', '编辑', '删除', '管理', '配置', '安装', '使用',
    '制作', '建立', '添加', '修改', '更新', '处理', '完成',
    // English keywords
    'how to', 'how do', 'how can', 'steps', 'step by step', 'process',
    'create', 'setup', 'set up', 'connect', 'publish', 'edit', 'delete',
    'manage', 'configure', 'install', 'use', 'make', 'build', 'add',
    'modify', 'update', 'handle', 'complete', 'do i', 'what are the steps',
  ];

  // Check for explicit format requests
  const explicitStepRequest = lowerQuestion.includes('用步骤') || 
                              lowerQuestion.includes('步骤') ||
                              lowerQuestion.includes('step by step') ||
                              lowerQuestion.includes('step-by-step');
  
  const explicitGeneralRequest = lowerQuestion.includes('简单解释') ||
                                  lowerQuestion.includes('简单说明') ||
                                  lowerQuestion.includes('briefly explain') ||
                                  lowerQuestion.includes('简单回答');

  // If user explicitly requests format, respect it
  if (explicitStepRequest) {
    return 'step';
  }
  if (explicitGeneralRequest) {
    return 'general';
  }

  // Check for step-related keywords
  const hasStepKeyword = stepKeywords.some(keyword => 
    lowerQuestion.includes(keyword.toLowerCase())
  );

  // Check for "how to" question patterns
  const isHowToQuestion = /^(how|如何|怎么|怎样)/i.test(trimmedQuestion) ||
                          /how\s+(to|do|can|will)/i.test(lowerQuestion);

  // Check for question words that suggest steps
  const stepQuestionPatterns = [
    /what.*steps/i,
    /what.*process/i,
    /what.*procedure/i,
    /步骤是什么/i,
    /流程是什么/i,
    /怎么操作/i,
    /如何操作/i,
  ];

  const hasStepPattern = stepQuestionPatterns.some(pattern => 
    pattern.test(lowerQuestion)
  );

  // Check for general question patterns (concept, definition, explanation)
  const generalKeywords = [
    // Chinese
    '是什么', '什么是', '为什么', '哪个', '哪些', '支持', '可以', 
    '功能', '特点', '优势', '安全', '价格', '费用', '介绍',
    // English
    'what is', 'what are', 'why', 'which', 'what does', 'what can',
    'features', 'function', 'support', 'price', 'cost', 'introduction',
    'explain', 'describe', 'tell me about',
  ];

  const hasGeneralKeyword = generalKeywords.some(keyword =>
    lowerQuestion.includes(keyword.toLowerCase())
  );

  // Decision logic
  if (hasStepKeyword || isHowToQuestion || hasStepPattern) {
    return 'step';
  }

  if (hasGeneralKeyword && !hasStepKeyword) {
    return 'general';
  }

  // Default: if question is short and contains action words, treat as step
  if (trimmedQuestion.length < 30 && (hasStepKeyword || isHowToQuestion)) {
    return 'step';
  }

  // Default to general for ambiguous cases
  return 'general';
}

/**
 * Build AI prompt based on question type
 * @param question User's question
 * @param questionType Classified question type
 * @returns System prompt for AI
 */
export function buildPromptForQuestion(question: string, questionType: 'step' | 'general'): string {
  if (questionType === 'step') {
    return `The user asked a question about operational steps. Please answer in a concise, step-by-step format:
1. Keep the answer under 150 words
2. Use numbered format (1. 2. 3. 4.) for steps
3. Each step should be on a new line and be concise
4. Provide direct operational steps, avoid lengthy explanations
5. Focus on actionable instructions

User's question: ${question}`;
  } else {
    return `Please answer the user's question in a concise and clear manner:
1. Keep the answer under 200 words
2. Use natural language, no need for step format
3. Answer the core question directly
4. If there are multiple points, use paragraphs to separate them
5. Be helpful and informative

User's question: ${question}`;
  }
}
