import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export interface InterviewQuestion {
  id: string
  question: string
  type: 'technical' | 'behavioral' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  expectedAnswer?: string
  followUpQuestions?: string[]
}

export interface InterviewResponse {
  questionId: string
  response: string
  timestamp: Date
  score?: number
  feedback?: string
}

export interface InterviewSession {
  id: string
  candidateId: string
  questions: InterviewQuestion[]
  responses: InterviewResponse[]
  currentQuestionIndex: number
  status: 'started' | 'in_progress' | 'completed'
  aiPersonality: string
  techStack: string[]
}

export class AIInterviewer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  async generateQuestions(
    role: string,
    techStack: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number = 10
  ): Promise<InterviewQuestion[]> {
    const prompt = `
    Generate ${count} interview questions for a ${role} position with the following requirements:
    - Technology stack: ${techStack.join(', ')}
    - Difficulty level: ${difficulty}
    - Mix of technical (60%), behavioral (25%), and situational (15%) questions
    - Each question should test real-world problem-solving skills
    - Include follow-up questions for deeper assessment
    
    Return the questions in the following JSON format:
    {
      "questions": [
        {
          "id": "unique_id",
          "question": "The main question",
          "type": "technical|behavioral|situational",
          "difficulty": "easy|medium|hard",
          "expectedAnswer": "Brief description of ideal answer",
          "followUpQuestions": ["follow-up question 1", "follow-up question 2"]
        }
      ]
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const parsed = JSON.parse(text)
      return parsed.questions.map((q: any, index: number) => ({
        id: q.id || `q_${index}`,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        expectedAnswer: q.expectedAnswer,
        followUpQuestions: q.followUpQuestions || []
      }))
    } catch (error) {
      console.error('Error generating questions:', error)
      return this.getFallbackQuestions(role, techStack)
    }
  }

  async evaluateResponse(
    question: InterviewQuestion,
    response: string,
    context: string = ''
  ): Promise<{ score: number; feedback: string; followUp?: string }> {
    const prompt = `
    Evaluate this interview response:
    
    Question: ${question.question}
    Question Type: ${question.type}
    Difficulty: ${question.difficulty}
    Expected Answer: ${question.expectedAnswer}
    
    Candidate Response: ${response}
    Additional Context: ${context}
    
    Evaluate the response on a scale of 1-10 considering:
    - Technical accuracy (if applicable)
    - Completeness of answer
    - Communication clarity
    - Problem-solving approach
    - Depth of understanding
    
    Return evaluation in JSON format:
    {
      "score": 7.5,
      "feedback": "Detailed feedback explaining the score",
      "followUp": "Optional follow-up question based on the response"
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response_text = await result.response.text()
      const evaluation = JSON.parse(response_text)
      
      return {
        score: Math.max(1, Math.min(10, evaluation.score)),
        feedback: evaluation.feedback,
        followUp: evaluation.followUp
      }
    } catch (error) {
      console.error('Error evaluating response:', error)
      return {
        score: 5,
        feedback: 'Unable to evaluate response automatically. Manual review required.',
      }
    }
  }

  async generateFollowUp(
    previousQuestion: string,
    candidateResponse: string,
    interviewContext: string
  ): Promise<string> {
    const prompt = `
    Based on the candidate's response, generate an intelligent follow-up question:
    
    Previous Question: ${previousQuestion}
    Candidate Response: ${candidateResponse}
    Interview Context: ${interviewContext}
    
    Generate a follow-up question that:
    - Probes deeper into their understanding
    - Tests practical application
    - Explores edge cases or alternative approaches
    - Is natural and conversational
    
    Return only the follow-up question as plain text.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error('Error generating follow-up:', error)
      return "Can you elaborate on that approach and discuss any potential challenges?"
    }
  }

  private getFallbackQuestions(role: string, techStack: string[]): InterviewQuestion[] {
    return [
      {
        id: 'fallback_1',
        question: `Tell me about your experience with ${techStack[0] || 'software development'}.`,
        type: 'technical',
        difficulty: 'medium',
        expectedAnswer: 'Detailed experience with practical examples',
        followUpQuestions: ['What challenges did you face?', 'How did you overcome them?']
      },
      {
        id: 'fallback_2',
        question: 'Describe a challenging project you worked on recently.',
        type: 'behavioral',
        difficulty: 'medium',
        expectedAnswer: 'Specific project with challenges and solutions',
        followUpQuestions: ['What would you do differently?', 'What did you learn?']
      },
      {
        id: 'fallback_3',
        question: 'How do you approach debugging a complex issue?',
        type: 'technical',
        difficulty: 'medium',
        expectedAnswer: 'Systematic debugging methodology',
        followUpQuestions: ['What tools do you use?', 'How do you prevent similar issues?']
      }
    ]
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
      console.error('Error generating summary:', error)
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
}