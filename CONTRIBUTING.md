# Contributing to DevMeet-AI

Thank you for your interest in contributing to DevMeet-AI! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community and Support](#community-and-support)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your feature or bugfix
5. Make your changes
6. Test your changes thoroughly
7. Submit a pull request

## How to Contribute

### Types of Contributions Welcome

- **Bug Reports**: Help us identify and fix bugs
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve or add documentation
- **Testing**: Help improve test coverage
- **Design**: UI/UX improvements and suggestions

### Before You Start

1. Check existing issues and pull requests to avoid duplicates
2. For major changes, open an issue first to discuss your approach
3. Ensure your contribution aligns with the project goals

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- PostgreSQL (for production) or SQLite (for development)

### Local Setup

1. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/DevMeet-AI.git
   cd DevMeet-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

### Development Workflow

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards
3. Test your changes locally
4. Commit your changes with clear messages
5. Push to your fork and create a pull request

## Pull Request Process

### Before Submitting

1. **Update documentation** if your changes affect user-facing functionality
2. **Add tests** for new features or bug fixes
3. **Run the full test suite** to ensure nothing is broken
4. **Update the changelog** if your changes are user-facing

### Pull Request Checklist

- [ ] Branch is up to date with `main`
- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive
- [ ] No sensitive information (API keys, passwords) is committed

### Pull Request Template

When creating a pull request, please use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information reviewers should know.
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Prefer functional components with hooks
- Use proper TypeScript types, avoid `any`

### Code Style

```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

const UserComponent: React.FC<UserProps> = ({ id, name, email }) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  return (
    <div className="user-component">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
};

// Bad
const UserComponent = (props: any) => {
  return <div>{props.name}</div>;
};
```

### File Organization

- Use kebab-case for file names: `user-profile.tsx`
- Group related functionality in folders
- Keep components small and focused
- Separate business logic from UI components

### API Routes

```typescript
// Good
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic here
    const result = await someService();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Guidelines

### Test Structure

We use Jest and React Testing Library for testing. Follow these patterns:

```typescript
describe('UserComponent', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should render user information correctly', () => {
    const props = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    render(<UserComponent {...props} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('should handle loading state', async () => {
    // Test implementation
  });
});
```

### Testing Requirements

- **Unit Tests**: All utility functions and components
- **Integration Tests**: API routes and complex user flows
- **E2E Tests**: Critical user journeys
- **Minimum Coverage**: 80% for new code

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Documentation

### Code Documentation

- Use JSDoc for function documentation
- Comment complex business logic
- Keep README files updated
- Document API endpoints

### Example Documentation

```typescript
/**
 * Calculates the interview score based on multiple criteria
 * @param assessment - The assessment data from the interview
 * @param weights - Optional weights for different criteria
 * @returns Promise<number> - The calculated score (0-100)
 * @throws Error if assessment data is invalid
 */
async function calculateInterviewScore(
  assessment: AssessmentData,
  weights?: ScoreWeights
): Promise<number> {
  // Implementation here
}
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Environment Details**: OS, browser, Node.js version
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots/Logs**: If applicable
6. **Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

1. **Problem Description**: What problem does this solve?
2. **Proposed Solution**: Your suggested approach
3. **Alternative Solutions**: Other approaches considered
4. **Use Cases**: Real-world scenarios where this would be helpful
5. **Priority Level**: How important is this feature?

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high/medium/low`: Issue priority

## Community and Support

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussions
- **Pull Request Reviews**: Code review and technical discussions

### Getting Help

1. Check existing documentation
2. Search existing issues and discussions
3. Ask questions in GitHub Discussions
4. Join our community chat (if available)

### Recognition

Contributors will be recognized in:
- Contributors section of README
- Release notes for significant contributions
- Annual contributor spotlight

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Schedule

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly for new features
- **Major releases**: Quarterly or as needed for breaking changes

## Development Guidelines

### Performance Considerations

- Optimize database queries
- Use proper caching strategies
- Minimize bundle sizes
- Implement proper lazy loading
- Monitor and measure performance impacts

### Security Guidelines

- Never commit sensitive data
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP security guidelines
- Regular dependency updates

### Accessibility

- Follow WCAG 2.1 AA guidelines
- Test with screen readers
- Ensure keyboard navigation
- Maintain proper contrast ratios
- Use semantic HTML elements

## License

By contributing to DevMeet-AI, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing, please:
1. Check this document first
2. Search existing issues and discussions
3. Open a new discussion if needed
4. Contact the maintainers if necessary

Thank you for contributing to DevMeet-AI!