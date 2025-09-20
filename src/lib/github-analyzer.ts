import { Octokit } from '@octokit/rest'

export interface GitHubProfile {
  login: string
  name: string
  bio: string
  location: string
  company: string
  blog: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  avatar_url: string
}

export interface Repository {
  id: number
  name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  size: number
  created_at: string
  updated_at: string
  pushed_at: string
  topics: string[]
  is_fork: boolean
}

export interface GitHubAnalysis {
  profile: GitHubProfile
  repositories: Repository[]
  languageStats: Record<string, number>
  activityMetrics: {
    commitsLastYear: number
    activeDays: number
    averageCommitsPerDay: number
    consistencyScore: number
  }
  codeQualityMetrics: {
    averageRepoSize: number
    documentationScore: number
    testCoverage: number
    codeComplexity: number
  }
  collaborationMetrics: {
    forksCreated: number
    issuesOpened: number
    pullRequestsContributed: number
    contributionsToOthers: number
  }
  overallScores: {
    activity: number
    codeQuality: number
    collaboration: number
    consistency: number
    overall: number
  }
  insights: string[]
  recommendations: string[]
}

export class GitHubAnalyzer {
  private octokit: Octokit

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    })
  }

  async analyzeCandidate(username: string): Promise<GitHubAnalysis> {
    try {
      const profile = await this.getProfile(username)
      const repositories = await this.getRepositories(username)
      const languageStats = await this.getLanguageStatistics(repositories)
      const activityMetrics = await this.getActivityMetrics(username, repositories)
      const codeQualityMetrics = this.analyzeCodeQuality(repositories)
      const collaborationMetrics = await this.getCollaborationMetrics(username, repositories)
      
      const overallScores = this.calculateOverallScores(
        activityMetrics,
        codeQualityMetrics,
        collaborationMetrics
      )

      const insights = this.generateInsights(
        profile,
        repositories,
        languageStats,
        overallScores
      )

      const recommendations = this.generateRecommendations(overallScores, insights)

      return {
        profile,
        repositories,
        languageStats,
        activityMetrics,
        codeQualityMetrics,
        collaborationMetrics,
        overallScores,
        insights,
        recommendations
      }
    } catch (error) {
      console.error('Error analyzing GitHub profile:', error)
      throw new Error(`Failed to analyze GitHub profile for ${username}`)
    }
  }

  private async getProfile(username: string): Promise<GitHubProfile> {
    const { data } = await this.octokit.rest.users.getByUsername({ username })
    return {
      login: data.login,
      name: data.name || '',
      bio: data.bio || '',
      location: data.location || '',
      company: data.company || '',
      blog: data.blog || '',
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      created_at: data.created_at,
      avatar_url: data.avatar_url
    }
  }

  private async getRepositories(username: string): Promise<Repository[]> {
    const { data } = await this.octokit.rest.repos.listForUser({
      username,
      type: 'all',
      sort: 'updated',
      per_page: 100
    })

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      size: repo.size || 0,
      created_at: repo.created_at || '',
      updated_at: repo.updated_at || '',
      pushed_at: repo.pushed_at || '',
      topics: repo.topics || [],
      is_fork: repo.fork || false
    }))
  }

  private async getLanguageStatistics(repositories: Repository[]): Promise<Record<string, number>> {
    const languageStats: Record<string, number> = {}
    
    for (const repo of repositories.slice(0, 20)) { // Limit to top 20 repos
      if (repo.language && repo.language !== 'Unknown') {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + repo.size
      }
    }

    return languageStats
  }

  private async getActivityMetrics(username: string, repositories: Repository[]): Promise<{
    commitsLastYear: number
    activeDays: number
    averageCommitsPerDay: number
    consistencyScore: number
  }> {
    try {
      // Get contribution activity for the last year
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      // Analyze recent repository activity
      const recentRepos = repositories.filter(repo => 
        new Date(repo.pushed_at) > oneYearAgo
      )

      const commitsLastYear = recentRepos.length * 10 // Estimate based on recent repos
      const activeDays = recentRepos.length * 5 // Estimate active days
      const averageCommitsPerDay = commitsLastYear / 365

      // Calculate consistency based on regular commits
      const consistencyScore = Math.min(10, (activeDays / 365) * 10)

      return {
        commitsLastYear,
        activeDays,
        averageCommitsPerDay,
        consistencyScore
      }
    } catch (error) {
      console.error('Error getting activity metrics:', error)
      return {
        commitsLastYear: 0,
        activeDays: 0,
        averageCommitsPerDay: 0,
        consistencyScore: 0
      }
    }
  }

  private analyzeCodeQuality(repositories: Repository[]): {
    averageRepoSize: number
    documentationScore: number
    testCoverage: number
    codeComplexity: number
  } {
    const totalSize = repositories.reduce((sum, repo) => sum + repo.size, 0)
    const averageRepoSize = repositories.length > 0 ? totalSize / repositories.length : 0

    // Estimate documentation score based on repository descriptions and topics
    const reposWithDescription = repositories.filter(repo => repo.description).length
    const documentationScore = repositories.length > 0 ? 
      (reposWithDescription / repositories.length) * 10 : 0

    // Estimate test coverage based on repository names and topics
    const testingRepos = repositories.filter(repo => 
      repo.topics.some(topic => topic.includes('test')) ||
      repo.name.toLowerCase().includes('test')
    ).length
    const testCoverage = repositories.length > 0 ? 
      (testingRepos / repositories.length) * 10 : 0

    // Estimate complexity based on repository size and language diversity
    const languageCount = new Set(repositories.map(repo => repo.language)).size
    const codeComplexity = Math.min(10, languageCount * 1.5)

    return {
      averageRepoSize,
      documentationScore,
      testCoverage,
      codeComplexity
    }
  }

  private async getCollaborationMetrics(username: string, repositories: Repository[]): Promise<{
    forksCreated: number
    issuesOpened: number
    pullRequestsContributed: number
    contributionsToOthers: number
  }> {
    const forksCreated = repositories.filter(repo => repo.is_fork).length
    const contributionsToOthers = forksCreated // Simplified metric

    return {
      forksCreated,
      issuesOpened: 0, // Would need additional API calls
      pullRequestsContributed: 0, // Would need additional API calls
      contributionsToOthers
    }
  }

  private calculateOverallScores(
    activityMetrics: any,
    codeQualityMetrics: any,
    collaborationMetrics: any
  ): {
    activity: number
    codeQuality: number
    collaboration: number
    consistency: number
    overall: number
  } {
    const activity = Math.min(10, activityMetrics.consistencyScore)
    const codeQuality = (
      codeQualityMetrics.documentationScore * 0.4 +
      codeQualityMetrics.testCoverage * 0.3 +
      codeQualityMetrics.codeComplexity * 0.3
    )
    const collaboration = Math.min(10, collaborationMetrics.contributionsToOthers * 2)
    const consistency = activityMetrics.consistencyScore
    const overall = (activity * 0.3 + codeQuality * 0.4 + collaboration * 0.2 + consistency * 0.1)

    return {
      activity,
      codeQuality,
      collaboration,
      consistency,
      overall
    }
  }

  private generateInsights(
    profile: GitHubProfile,
    repositories: Repository[],
    languageStats: Record<string, number>,
    scores: any
  ): string[] {
    const insights: string[] = []

    // Language expertise insights
    const topLanguages = Object.entries(languageStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang)

    if (topLanguages.length > 0) {
      insights.push(`Primary expertise in ${topLanguages.join(', ')}`)
    }

    // Activity insights
    if (scores.activity > 7) {
      insights.push('Highly active developer with consistent contributions')
    } else if (scores.activity > 4) {
      insights.push('Moderately active with regular contributions')
    } else {
      insights.push('Limited recent activity or newer to GitHub')
    }

    // Repository insights
    const publicRepos = repositories.filter(repo => !repo.is_fork)
    if (publicRepos.length > 10) {
      insights.push('Extensive portfolio of original projects')
    }

    // Experience insights
    const accountAge = new Date().getFullYear() - new Date(profile.created_at).getFullYear()
    if (accountAge > 3) {
      insights.push(`${accountAge} years of experience on GitHub`)
    }

    return insights
  }

  private generateRecommendations(scores: any, insights: string[]): string[] {
    const recommendations: string[] = []

    if (scores.overall > 7) {
      recommendations.push('Strong candidate with excellent GitHub presence')
    } else if (scores.overall > 5) {
      recommendations.push('Good candidate with solid development background')
    } else {
      recommendations.push('Consider additional assessment beyond GitHub activity')
    }

    if (scores.codeQuality < 5) {
      recommendations.push('May benefit from code review and documentation practices')
    }

    if (scores.collaboration < 5) {
      recommendations.push('Limited open source collaboration - assess team skills in interview')
    }

    return recommendations
  }
}