# Contributing to Dragon Worlds HK 2027

Thank you for your interest in contributing to the Dragon Worlds HK 2027 mobile app! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions from the sailing community and developers alike. Here are several ways you can help:

- **Bug Reports**: Found a bug? Let us know!
- **Feature Requests**: Have an idea for improvement? Share it!
- **Code Contributions**: Fix bugs, add features, improve performance
- **Documentation**: Help improve our docs
- **Testing**: Help test the app on different devices and scenarios
- **Translations**: Help localize the app for different regions

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- Git configured with your name and email
- Expo CLI installed globally (`npm install -g @expo/cli`)
- A code editor (VS Code recommended)
- iOS Simulator (Mac) or Android Studio/emulator

### Setting Up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/DragonWorldsHK2027.git
   cd DragonWorldsHK2027
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with appropriate values (see README.md)
   ```
5. **Start the development server**:
   ```bash
   npm start
   ```

## 📋 Development Workflow

### Branch Strategy

We follow a Git Flow branching strategy:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features (branch from `develop`)
- **`bugfix/*`**: Bug fixes (branch from `develop`)
- **`hotfix/*`**: Critical fixes (branch from `main`)

### Making Changes

1. **Create a branch** from the appropriate base branch:
   ```bash
   # For features
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   
   # For bug fixes
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/issue-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm test                    # Run all tests
   npm run typecheck          # Check TypeScript types
   npm run lint               # Check code style
   npm run test:accessibility # Test accessibility
   ```

4. **Commit your changes** using conventional commits:
   ```bash
   git add .
   git commit -m "feat: add weather alerts notification system"
   ```

5. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

Examples:
```
feat: add race results push notifications
fix: resolve weather data caching issue
docs: update API documentation
test: add unit tests for weather service
```

## 🏗️ Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper types for all data structures
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes
- Use type unions for specific value sets

```typescript
// Good
interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  timestamp: Date;
}

// Bad
const weatherData: any = { ... };
```

### React/React Native

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement accessibility features
- Use StyleSheet for component styling

```typescript
// Good
interface Props {
  weather: WeatherData;
  onRefresh: () => void;
}

export const WeatherCard: React.FC<Props> = ({ weather, onRefresh }) => {
  // Component implementation
};
```

### Code Organization

- Keep components focused and single-purpose
- Use custom hooks for reusable logic
- Group related files in directories
- Use absolute imports for cleaner code structure

```typescript
// Use absolute imports
import { WeatherService } from '@/services/weather';
import { useWeatherStore } from '@/stores/weatherStore';

// Instead of relative imports
import { WeatherService } from '../../../services/weather';
```

### Styling

- Use React Native's StyleSheet API
- Follow consistent naming conventions
- Use theme constants for colors and spacing
- Ensure responsive design for different screen sizes

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
});
```

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Ensure app is accessible
4. **Manual Testing**: Test on real devices

### Writing Tests

- Use React Native Testing Library for component tests
- Mock external dependencies
- Test user interactions, not implementation details
- Maintain good test coverage (>80%)

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { WeatherCard } from '../WeatherCard';

describe('WeatherCard', () => {
  it('displays weather information correctly', () => {
    const mockWeather = {
      temperature: 25,
      windSpeed: 10,
      windDirection: 180,
      timestamp: new Date(),
    };

    const { getByText } = render(
      <WeatherCard weather={mockWeather} onRefresh={jest.fn()} />
    );

    expect(getByText('25°C')).toBeTruthy();
    expect(getByText('10 kts')).toBeTruthy();
  });
});
```

## 🎨 UI/UX Guidelines

### Design Principles

- **Sailing-focused**: Design with sailors' needs in mind
- **Glanceable**: Important info should be quickly readable
- **Weather-aware**: Consider outdoor usage conditions
- **Accessible**: Support users with different abilities
- **Cross-platform**: Consistent experience across platforms

### Component Design

- Follow platform-specific design guidelines
- Use consistent spacing and typography
- Implement proper touch targets (minimum 44x44 points)
- Support both light and dark themes
- Test on different screen sizes and orientations

## 🚨 Reporting Issues

### Bug Reports

When reporting bugs, please include:
- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Screenshots or videos** if helpful
- **Device information** (OS version, device model)
- **App version** and build number

Use our bug report template when creating issues.

### Feature Requests

For feature requests, please include:
- **Clear description** of the proposed feature
- **Use case** and problem it solves
- **Mockups or sketches** if applicable
- **Priority level** from sailing perspective

## 🔍 Code Review Process

### Pull Request Requirements

Before submitting a PR, ensure:
- [ ] Code follows our style guidelines
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] No ESLint errors or warnings
- [ ] Accessibility guidelines followed
- [ ] Documentation updated if needed
- [ ] Screenshots included for UI changes

### Review Criteria

We review PRs for:
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it clean, readable, and maintainable?
- **Performance**: Does it impact app performance?
- **Security**: Are there any security considerations?
- **Accessibility**: Is it accessible to all users?
- **Testing**: Are there appropriate tests?

## 🏆 Recognition

Contributors will be recognized in several ways:
- **GitHub contributors list**
- **App credits** for significant contributions
- **Community Discord** recognition
- **Early access** to beta features

## 📞 Getting Help

If you need help:
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: [Dragon Worlds Community](https://discord.gg/dragonworlds)
- **Email**: developers@dragonworlds.com

## 📄 Legal

By contributing to this project, you agree that:
- Your contributions will be licensed under the same license as the project
- You have the right to contribute the code/documentation
- Your contributions don't violate any third-party rights

## 🙏 Thank You

Your contributions help make the Dragon Worlds HK 2027 app better for the entire sailing community. Whether you're fixing typos, adding features, or reporting bugs, every contribution is valuable!

---

**Happy sailing and coding!** ⛵️💻