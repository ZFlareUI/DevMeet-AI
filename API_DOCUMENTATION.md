# DevMeet-AI API Documentation

## Overview

DevMeet-AI provides a comprehensive REST API for managing candidates, interviews, assessments, and analytics. All API endpoints require authentication unless otherwise specified.

## Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication

DevMeet-AI uses NextAuth.js for authentication with session-based auth and JWT tokens.

### Headers Required

```http
Cookie: next-auth.session-token=your-session-token
Content-Type: application/json
```

### Authentication Flow

1. **Register User**
   ```http
   POST /api/auth/register
   Content-Type: application/json
   
   {
     "name": "John Doe",
     "email": "john@example.com", 
     "password": "SecurePassword123!",
     "role": "INTERVIEWER"
   }
   ```

2. **Sign In**
   ```http
   POST /api/auth/signin
   Content-Type: application/json
   
   {
     "email": "john@example.com",
     "password": "SecurePassword123!"
   }
   ```

## Rate Limiting

API endpoints have different rate limits:
- Authentication endpoints: 5 requests/minute
- Upload endpoints: 10 requests/minute  
- Analytics endpoints: 3 requests/minute
- General API endpoints: 100 requests/minute

Rate limit exceeded responses:
```json
{
  "error": "Too many requests. Please try again later."
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## API Endpoints

### Candidates

#### Get All Candidates

```http
GET /api/candidates
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by candidate status
- `position` (string): Filter by position
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "candidates": [
    {
      "id": "clx123456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "position": "Software Engineer",
      "experience": "3-5",
      "skills": ["JavaScript", "React", "Node.js"],
      "status": "APPLIED",
      "resume": "/api/files/resume123",
      "githubUrl": "https://github.com/janesmith",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Create Candidate

```http
POST /api/candidates
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "position": "Software Engineer",
  "experience": "3-5",
  "skills": ["JavaScript", "React", "Node.js"],
  "githubUrl": "https://github.com/janesmith",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "expectedSalary": 80000,
  "availability": "within-2-weeks",
  "notes": "Strong React experience"
}
```

**Response:**
```json
{
  "success": true,
  "candidate": {
    "id": "clx123456",
    "name": "Jane Smith",
    "email": "jane@example.com",
    // ... full candidate object
  }
}
```

#### Get Candidate by ID

```http
GET /api/candidates/{id}
```

**Response:**
```json
{
  "success": true,
  "candidate": {
    "id": "clx123456",
    "name": "Jane Smith",
    // ... full candidate object with relations
    "interviews": [],
    "assessments": [],
    "githubAnalysis": [],
    "uploadedFiles": []
  }
}
```

#### Update Candidate

```http
PUT /api/candidates/{id}
Content-Type: application/json
```

**Request Body:** (Partial candidate object)
```json
{
  "status": "INTERVIEWING",
  "notes": "Updated notes"
}
```

#### Delete Candidate

```http
DELETE /api/candidates/{id}
```

#### GitHub Analysis

```http
POST /api/candidates/{id}/github-analysis
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "janesmith",
  "repositoryLimit": 10,
  "includePrivate": false
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis123",
    "username": "janesmith",
    "activityScore": 8.5,
    "codeQualityScore": 7.8,
    "collaborationScore": 9.2,
    "consistencyScore": 8.1,
    "overallScore": 8.4,
    "insights": {
      "topLanguages": ["JavaScript", "TypeScript", "Python"],
      "totalCommits": 1250,
      "activeProjects": 15
    }
  }
}
```

### Interviews

#### Get All Interviews

```http
GET /api/interviews
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `candidateId`: Filter by candidate
- `status`: Filter by interview status
- `type`: Filter by interview type
- `from`, `to`: Date range filter (ISO 8601)

**Response:**
```json
{
  "success": true,
  "interviews": [
    {
      "id": "int123456",
      "title": "Technical Interview - React",
      "candidateId": "clx123456",
      "interviewerId": "usr789012",
      "type": "TECHNICAL",
      "status": "SCHEDULED",
      "scheduledAt": "2024-01-20T14:00:00Z",
      "duration": 60,
      "candidate": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "interviewer": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Create Interview

```http
POST /api/interviews
Content-Type: application/json
```

**Request Body:**
```json
{
  "candidateId": "clx123456",
  "interviewerId": "usr789012",
  "title": "Technical Interview - React",
  "type": "TECHNICAL",
  "scheduledAt": "2024-01-20T14:00:00Z",
  "duration": 60,
  "notes": "Focus on React and state management",
  "questions": [
    "Explain React hooks",
    "Implement a custom hook",
    "Optimize component performance"
  ],
  "aiPersonality": "technical",
  "techStack": ["React", "TypeScript", "Node.js"],
  "difficultyLevel": "intermediate"
}
```

#### Update Interview

```http
PUT /api/interviews/{id}
Content-Type: application/json
```

#### Delete Interview

```http
DELETE /api/interviews/{id}
```

#### Interview Management

```http
POST /api/interviews/{id}/manage
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "start" | "pause" | "resume" | "complete" | "cancel",
  "notes": "Additional notes"
}
```

#### Submit Interview Response

```http
POST /api/interviews/{id}/response
Content-Type: application/json
```

**Request Body:**
```json
{
  "responses": [
    {
      "question": "Explain React hooks",
      "answer": "React hooks are functions that...",
      "rating": 8
    }
  ],
  "overallFeedback": "Strong technical knowledge",
  "recommendation": "HIRE"
}
```

### Assessments

#### Get All Assessments

```http
GET /api/assessments
```

#### Create Assessment

```http
POST /api/assessments
Content-Type: application/json
```

**Request Body:**
```json
{
  "interviewId": "int123456",
  "candidateId": "clx123456",
  "technicalScore": 8,
  "communicationScore": 9,
  "problemSolvingScore": 8,
  "cultureScore": 9,
  "overallScore": 8.5,
  "feedback": "Excellent candidate with strong technical skills...",
  "recommendation": "HIRE",
  "strengths": ["React expertise", "Problem solving", "Communication"],
  "improvements": ["System design", "Testing practices"]
}
```

### File Uploads

#### Upload File

```http
POST /api/uploads
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `type`: "resume" | "document" | "avatar"
- `candidateId`: Associated candidate ID (optional)

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file123456",
    "filename": "secure_filename.pdf",
    "originalName": "resume.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "/api/files/file123456"
  }
}
```

#### Get Uploaded Files

```http
GET /api/uploads
```

**Query Parameters:**
- `type`: Filter by upload type
- `candidateId`: Filter by candidate
- `page`, `limit`: Pagination

#### Delete File

```http
DELETE /api/uploads?id={fileId}
```

#### Serve File

```http
GET /api/files/{id}
```

Returns the actual file content with appropriate headers.

### Analytics

#### Get Dashboard Analytics

```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCandidates": 150,
    "totalInterviews": 89,
    "completedInterviews": 67,
    "averageScore": 7.8,
    "topSkills": [
      { "skill": "JavaScript", "count": 45 },
      { "skill": "React", "count": 38 }
    ],
    "candidatesByStatus": {
      "APPLIED": 25,
      "INTERVIEWING": 15,
      "HIRED": 8
    },
    "monthlyTrends": [
      { "month": "2024-01", "candidates": 20, "interviews": 15 }
    ]
  }
}
```

#### Get Performance Metrics

```http
GET /api/analytics/performance
```

#### Get Error Logs

```http
GET /api/analytics/errors
```

**Query Parameters:**
- `from`, `to`: Date range
- `level`: Error level filter
- `page`, `limit`: Pagination

#### Get Health Status

```http
GET /api/analytics/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "storage": "healthy",
    "memory": "healthy",
    "uptime": 86400
  }
}
```

## Webhooks

### Interview Status Changes

When interview status changes, you can receive webhook notifications:

```json
{
  "event": "interview.status_changed",
  "data": {
    "interviewId": "int123456",
    "status": "COMPLETED",
    "candidateId": "clx123456",
    "timestamp": "2024-01-20T15:00:00Z"
  }
}
```

### Assessment Submitted

```json
{
  "event": "assessment.submitted",
  "data": {
    "assessmentId": "ass123456",
    "interviewId": "int123456",
    "candidateId": "clx123456",
    "overallScore": 8.5,
    "recommendation": "HIRE"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class DevMeetAIClient {
  constructor(private baseUrl: string, private authToken: string) {}

  async getCandidates(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const url = new URL(`${this.baseUrl}/candidates`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value.toString());
      });
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }

  async createCandidate(candidate: CreateCandidateRequest) {
    const response = await fetch(`${this.baseUrl}/candidates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(candidate)
    });

    return response.json();
  }
}

// Usage
const client = new DevMeetAIClient('https://api.devmeet-ai.com', 'your-token');
const candidates = await client.getCandidates({ status: 'APPLIED' });
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class DevMeetAIClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }

    def get_candidates(self, page: Optional[int] = None, 
                      limit: Optional[int] = None,
                      status: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if page: params['page'] = page
        if limit: params['limit'] = limit
        if status: params['status'] = status

        response = requests.get(
            f'{self.base_url}/candidates',
            params=params,
            headers=self.headers
        )
        return response.json()

    def create_candidate(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f'{self.base_url}/candidates',
            json=candidate_data,
            headers=self.headers
        )
        return response.json()

# Usage
client = DevMeetAIClient('https://api.devmeet-ai.com', 'your-token')
candidates = client.get_candidates(status='APPLIED')
```

## Testing

### Postman Collection

A comprehensive Postman collection is available with all API endpoints pre-configured. Import the collection:

```json
{
  "info": {
    "name": "DevMeet-AI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    }
  ]
}
```

### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test candidate creation
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"name":"Test User","email":"test@example.com","position":"Developer"}'
```

## Rate Limits and Quotas

| Endpoint Type | Rate Limit | Quota |
|---------------|------------|-------|
| Authentication | 5 req/min | - |
| File Uploads | 10 req/min | 100MB/day |
| Analytics | 3 req/min | - |
| General API | 100 req/min | 10,000 req/day |

## API Versioning

Current API version: `v1`

Future versions will be accessible via:
```
/api/v2/candidates
```

## Support

For API support:
- Check status page: https://status.devmeet-ai.com
- Documentation: https://docs.devmeet-ai.com
- Contact: api-support@devmeet-ai.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Candidate management
- Interview scheduling
- Assessment creation
- File upload system
- Analytics dashboard
- Security middleware