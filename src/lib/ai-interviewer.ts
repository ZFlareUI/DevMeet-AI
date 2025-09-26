import { GoogleGenerativeAI } from '@google/generative-ai'
import { Logger } from './error-handler'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export interface InterviewQuestion {
  id: string
  question: string
  type: 'technical' | 'behavioral' | 'situational' | 'coding' | 'system_design'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  expectedAnswer?: string
  keyPoints?: string[]
  followUpQuestions?: string[]
  codeSnippet?: string
  timeLimit?: number // in minutes
  rubric?: EvaluationRubric
}

export interface EvaluationRubric {
  technical_accuracy: { weight: number; description: string }
  problem_solving: { weight: number; description: string }
  communication: { weight: number; description: string }
  code_quality?: { weight: number; description: string }
  system_thinking?: { weight: number; description: string }
}

export interface InterviewResponse {
  questionId: string
  response: string
  timestamp: Date
  duration?: number // in seconds
  score?: number
  feedback?: string
  detailedScores?: {
    technical_accuracy: number
    problem_solving: number
    communication: number
    code_quality?: number
    system_thinking?: number
  }
}

export interface InterviewSession {
  id: string
  candidateId: string
  questions: InterviewQuestion[]
  responses: InterviewResponse[]
  currentQuestionIndex: number
  status: 'started' | 'in_progress' | 'completed' | 'paused'
  aiPersonality: string
  techStack: string[]
  overallScore?: number
  strengths?: string[]
  weaknesses?: string[]
  recommendation?: string
}

export interface CandidateProfile {
  name: string
  experience: string
  skills: string[]
  position: string
  resume?: string
  githubProfile?: Record<string, unknown>
}

export class AIInterviewer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  // Question templates for different categories
  private questionTemplates = {
    javascript: {
      technical: [
        "Explain the concept of closures in JavaScript with a practical example.",
        "What are the differences between `var`, `let`, and `const`?",
        "How does prototypal inheritance work in JavaScript?",
        "Explain event bubbling and event delegation.",
        "What is the difference between `==` and `===`?"
      ],
      coding: [
        "Write a function to debounce API calls.",
        "Implement a deep clone function for objects.",
        "Create a function that flattens a nested array.",
        "Write a promise-based function with proper error handling."
      ]
    },
    react: {
      technical: [
        "Explain the React component lifecycle and how hooks changed it.",
        "What is the virtual DOM and how does React use it?",
        "How do you optimize React performance?",
        "Explain state management patterns in React."
      ],
      coding: [
        "Create a custom hook for API calls with loading states.",
        "Implement a higher-order component for authentication.",
        "Build a reusable modal component with proper accessibility."
      ]
    },
    nodejs: {
      technical: [
        "Explain the Node.js event loop and how it handles asynchronous operations.",
        "What are streams in Node.js and when would you use them?",
        "How do you handle memory leaks in Node.js applications?",
        "Explain middleware in Express.js."
      ],
      coding: [
        "Create a rate limiting middleware.",
        "Implement file upload with validation.",
        "Build a simple JWT authentication system."
      ]
    },
    behavioral: [
      "Tell me about a challenging technical problem you solved.",
      "Describe a time when you had to learn a new technology quickly.",
      "How do you handle code reviews and feedback?",
      "Describe your approach to debugging complex issues.",
      "Tell me about a time you had to work with a difficult team member."
    ],
    system_design: [
      "Design a URL shortening service like bit.ly.",
      "How would you design a chat application?",
      "Design a notification system for a social media platform.",
      "How would you handle scaling a web application for millions of users?"
    ]
  }
  
  async generateQuestions(
    candidateProfile: CandidateProfile,
    interviewType: 'technical' | 'behavioral' | 'full',
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number = 10
  ): Promise<InterviewQuestion[]> {
    try {
      Logger.info('Generating interview questions', {
        candidate: candidateProfile.name,
        position: candidateProfile.position,
        skills: candidateProfile.skills,
        difficulty,
        count
      })

      const prompt = this.buildQuestionGenerationPrompt(
        candidateProfile,
        interviewType,
        difficulty,
        count
      )

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const parsed = JSON.parse(text)
      const questions = this.processGeneratedQuestions(parsed.questions, candidateProfile.skills)
      
      Logger.info('Successfully generated questions', { count: questions.length })
      return questions
      
    } catch (error) {
      Logger.error('Error generating questions', error)
      return this.getFallbackQuestions(candidateProfile, interviewType, difficulty, count)
    }
  }

  private buildQuestionGenerationPrompt(
    profile: CandidateProfile,
    type: string,
    difficulty: string,
    count: number
  ): string {
    return `
    You are an expert technical interviewer. Generate ${count} high-quality interview questions for the following candidate profile:

    Position: ${profile.position}
    Experience Level: ${profile.experience}
    Technical Skills: ${profile.skills.join(', ')}
    Interview Type: ${type}
    Difficulty: ${difficulty}

    Requirements:
    1. Questions should be relevant to the candidate's skills and experience level
    2. Include a mix of conceptual, practical, and problem-solving questions
    3. For coding questions, provide clear requirements and constraints
    4. Include proper evaluation criteria
    5. Questions should test real-world knowledge, not just theoretical concepts

    For technical questions, focus on:
    - Practical application of concepts
    - Best practices and patterns
    - Performance and optimization
    - Error handling and edge cases
    - Real-world scenarios

    For behavioral questions, focus on:
    - Problem-solving approach
    - Communication skills
    - Team collaboration
    - Learning and adaptation
    - Technical leadership

    Return the response in this exact JSON format:
    {
      "questions": [
        {
          "id": "unique_id",
          "question": "The main question text",
          "type": "technical|behavioral|situational|coding|system_design",
          "difficulty": "easy|medium|hard",
          "category": "specific technology or skill area",
          "expectedAnswer": "Brief description of ideal answer",
          "keyPoints": ["key point 1", "key point 2", "key point 3"],
          "followUpQuestions": ["follow-up 1", "follow-up 2"],
          "timeLimit": 10,
          "rubric": {
            "technical_accuracy": {"weight": 0.4, "description": "Understanding of concepts"},
            "problem_solving": {"weight": 0.3, "description": "Approach to solving problems"},
            "communication": {"weight": 0.3, "description": "Clarity of explanation"}
          }
        }
      ]
    }
    `
  }

  private processGeneratedQuestions(
    questions: unknown[],
    skills: string[]
  ): InterviewQuestion[] {
    return questions.map((q: unknown, index: number) => ({
      id: (q as any).id || `q_${Date.now()}_${index}`,
      question: (q as any).question,
      type: (q as any).type || 'technical',
      difficulty: (q as any).difficulty || 'medium',
      category: (q as any).category || 'general',
      expectedAnswer: (q as any).expectedAnswer,
      keyPoints: (q as any).keyPoints || [],
      followUpQuestions: (q as any).followUpQuestions || [],
      codeSnippet: (q as any).codeSnippet,
      timeLimit: (q as any).timeLimit || 10,
      rubric: (q as any).rubric || this.getDefaultRubric((q as any).type)
    }))
  }

  private getDefaultRubric(type: string): EvaluationRubric {
    const baseRubric = {
      technical_accuracy: { weight: 0.4, description: "Technical correctness and understanding" },
      problem_solving: { weight: 0.3, description: "Problem-solving approach and methodology" },
      communication: { weight: 0.3, description: "Clarity and effectiveness of communication" }
    }

    if (type === 'coding') {
      return {
        ...baseRubric,
        code_quality: { weight: 0.2, description: "Code structure, readability, and best practices" },
        technical_accuracy: { weight: 0.3, description: baseRubric.technical_accuracy.description },
        problem_solving: { weight: 0.3, description: baseRubric.problem_solving.description },
        communication: { weight: 0.2, description: baseRubric.communication.description }
      }
    }

    if (type === 'system_design') {
      return {
        ...baseRubric,
        system_thinking: { weight: 0.3, description: "System architecture and scalability considerations" },
        technical_accuracy: { weight: 0.3, description: baseRubric.technical_accuracy.description },
        problem_solving: { weight: 0.2, description: baseRubric.problem_solving.description },
        communication: { weight: 0.2, description: baseRubric.communication.description }
      }
    }

    return baseRubric
  }

  async evaluateResponse(
    question: InterviewQuestion,
    response: string,
    context: string = ''
  ): Promise<{ 
    score: number
    feedback: string
    detailedScores: Record<string, number>
    followUp?: string 
  }> {
    const prompt = `
    Evaluate this interview response using the provided rubric:
    
    Question: ${question.question}
    Question Type: ${question.type}
    Category: ${question.category}
    Difficulty: ${question.difficulty}
    Expected Answer: ${question.expectedAnswer}
    Key Points to Look For: ${question.keyPoints?.join(', ')}
    
    Candidate Response: ${response}
    Additional Context: ${context}
    
    Evaluation Rubric:
    ${JSON.stringify(question.rubric, null, 2)}
    
    Please evaluate the response and provide:
    1. Detailed scores for each rubric criterion (0-10 scale)
    2. Overall score (weighted average of detailed scores)
    3. Specific, constructive feedback
    4. A relevant follow-up question if the response needs clarification
    
    Return response in this JSON format:
    {
      "detailedScores": {
        "technical_accuracy": 7.5,
        "problem_solving": 8.0,
        "communication": 6.5
      },
      "overallScore": 7.3,
      "feedback": "Detailed constructive feedback highlighting strengths and areas for improvement",
      "followUp": "Optional follow-up question for clarification"
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = await result.response.text()
      const evaluation = JSON.parse(responseText)
      
      Logger.info('Response evaluated', {
        questionId: question.id,
        score: evaluation.overallScore,
        responseLength: response.length
      })
      
      return {
        score: evaluation.overallScore,
        feedback: evaluation.feedback,
        detailedScores: evaluation.detailedScores,
        followUp: evaluation.followUp
      }
    } catch (error) {
      Logger.error('Error evaluating response', error)
      
      // Fallback evaluation
      const basicScore = this.calculateBasicScore(response, question)
      return {
        score: basicScore,
        feedback: `Response received. ${response.length > 50 ? 'Comprehensive answer provided.' : 'Consider providing more detail.'}`,
        detailedScores: this.getBasicDetailedScores(basicScore, question.rubric!),
        followUp: question.followUpQuestions?.[0]
      }
    }
  }

  private calculateBasicScore(response: string, question: InterviewQuestion): number {
    // Basic scoring algorithm as fallback
    let score = 5 // Base score
    
    // Length bonus
    if (response.length > 100) score += 1
    if (response.length > 300) score += 1
    
    // Keyword matching
    const keywords = question.keyPoints || []
    const responseWords = response.toLowerCase().split(/\s+/)
    const keywordMatches = keywords.filter(keyword => 
      responseWords.some(word => word.includes(keyword.toLowerCase()))
    ).length
    
    score += (keywordMatches / Math.max(keywords.length, 1)) * 2
    
    // Question type specific adjustments
    if (question.type === 'coding' && response.includes('function')) score += 0.5
    if (question.type === 'technical' && (response.includes('because') || response.includes('reason'))) score += 0.5
    
    return Math.min(Math.max(score, 1), 10)
  }

  private getBasicDetailedScores(overallScore: number, rubric: EvaluationRubric): Record<string, number> {
    const scores: Record<string, number> = {}
    const variance = 0.5
    
    Object.keys(rubric).forEach(criterion => {
      scores[criterion] = Math.min(
        Math.max(
          overallScore + (Math.random() - 0.5) * variance * 2,
          1
        ),
        10
      )
    })
    
    return scores
  }

  async generateFollowUpQuestion(
    originalQuestion: InterviewQuestion,
    response: string,
    context: string = ''
  ): Promise<string> {
    // If predefined follow-ups exist, use them first
    if (originalQuestion.followUpQuestions && originalQuestion.followUpQuestions.length > 0) {
      return originalQuestion.followUpQuestions[0]
    }

    const prompt = `
    Based on this interview exchange, generate a relevant follow-up question:
    
    Original Question: ${originalQuestion.question}
    Candidate Response: ${response}
    Context: ${context}
    
    Generate a follow-up question that:
    1. Digs deeper into the candidate's response
    2. Tests practical application or edge cases
    3. Reveals more about their problem-solving approach
    4. Is appropriate for the question type and difficulty level
    
    Return only the follow-up question, no additional text.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = await result.response
      return responseText.text().trim()
    } catch (error) {
      Logger.error('Error generating follow-up', error)
      return "Can you elaborate on that approach and discuss any potential challenges?"
    }
  }

  async generateInterviewSummary(
    questions: InterviewQuestion[],
    responses: InterviewResponse[]
  ): Promise<{
    overallScore: number
    strengths: string[]
    weaknesses: string[]
    recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire'
    summary: string
  }> {
    const conversationHistory = questions.map((q, index) => ({
      question: q.question,
      response: responses[index]?.response || 'No response',
      score: responses[index]?.score || 0
    }))

    const prompt = `
    Analyze this complete interview session and provide a comprehensive evaluation:
    
    Interview Data: ${JSON.stringify(conversationHistory, null, 2)}
    
    Provide analysis in the following JSON format:
    {
      "overallScore": 7.5,
      "strengths": ["Strong technical knowledge", "Good communication skills"],
      "weaknesses": ["Limited experience with scalability", "Could improve testing practices"],
      "recommendation": "hire",
      "summary": "Detailed summary of the candidate's performance and fit for the role"
    }
    
    Base recommendation on:
    - Technical competency
    - Communication skills
    - Problem-solving ability
    - Cultural fit indicators
    - Growth potential
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const analysis = JSON.parse(response.text())
      
      return {
        overallScore: Math.max(1, Math.min(10, analysis.overallScore)),
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        recommendation: analysis.recommendation || 'no_hire',
        summary: analysis.summary || 'Analysis completed successfully.'
      }
    } catch (error) {
      Logger.error('Error generating summary', error)
      const avgScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length
      
      return {
        overallScore: avgScore || 5,
        strengths: ['Completed interview session'],
        weaknesses: ['Requires manual review'],
        recommendation: avgScore > 7 ? 'hire' : 'no_hire',
        summary: 'Automated analysis failed. Manual review recommended.'
      }
    }
  }

  private getFallbackQuestions(
    candidateProfile: CandidateProfile,
    interviewType: string,
    difficulty: string,
    count: number
  ): InterviewQuestion[] {
    const baseQuestions: InterviewQuestion[] = [
      {
        id: 'fallback_1',
        question: `Tell me about your experience with ${candidateProfile.skills[0] || 'software development'}.`,
        type: 'technical',
        difficulty: 'medium',
        category: candidateProfile.skills[0] || 'general',
        expectedAnswer: 'Detailed experience with practical examples',
        keyPoints: ['Experience level', 'Practical applications', 'Challenges faced'],
        followUpQuestions: ['What challenges did you face?', 'How did you overcome them?'],
        timeLimit: 10,
        rubric: this.getDefaultRubric('technical')
      },
      {
        id: 'fallback_2',
        question: 'Describe a challenging project you worked on recently.',
        type: 'behavioral',
        difficulty: 'medium',
        category: 'problem-solving',
        expectedAnswer: 'Specific project with challenges and solutions',
        keyPoints: ['Project complexity', 'Problem-solving approach', 'Results achieved'],
        followUpQuestions: ['What would you do differently?', 'What did you learn?'],
        timeLimit: 15,
        rubric: this.getDefaultRubric('behavioral')
      },
      {
        id: 'fallback_3',
        question: 'How do you approach debugging a complex issue?',
        type: 'technical',
        difficulty: 'medium',
        category: 'debugging',
        expectedAnswer: 'Systematic debugging methodology',
        keyPoints: ['Debugging process', 'Tools and techniques', 'Prevention strategies'],
        followUpQuestions: ['What tools do you use?', 'How do you prevent similar issues?'],
        timeLimit: 10,
        rubric: this.getDefaultRubric('technical')
      },
      {
        id: 'fallback_4',
        question: 'Explain how you would optimize the performance of a web application.',
        type: 'technical',
        difficulty: 'medium',
        category: 'performance',
        expectedAnswer: 'Comprehensive performance optimization strategies',
        keyPoints: ['Performance analysis', 'Optimization techniques', 'Monitoring'],
        followUpQuestions: ['How do you measure performance?', 'What are common bottlenecks?'],
        timeLimit: 15,
        rubric: this.getDefaultRubric('technical')
      },
      {
        id: 'fallback_5',
        question: 'How do you handle working with difficult team members or conflicting requirements?',
        type: 'behavioral',
        difficulty: 'medium',
        category: 'teamwork',
        expectedAnswer: 'Conflict resolution and communication strategies',
        keyPoints: ['Communication skills', 'Conflict resolution', 'Team collaboration'],
        followUpQuestions: ['Can you give a specific example?', 'How did you resolve the situation?'],
        timeLimit: 10,
        rubric: this.getDefaultRubric('behavioral')
      }
    ]

    return baseQuestions.slice(0, Math.min(count, baseQuestions.length))
  }
}