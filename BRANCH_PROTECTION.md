# Branch Protection Rules Configuration

This document outlines the recommended branch protection rules for the Dragon Worlds HK 2027 repository to ensure code quality, security, and proper release management.

## 🛡️ Main Branch Protection (`main`)

The `main` branch should be protected with the following rules:

### Required Status Checks
```
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging

Required status checks:
- ci/tests (Jest unit tests)
- ci/typescript (TypeScript compilation)
- ci/lint (ESLint checks)
- ci/build-ios (iOS build verification)
- ci/build-android (Android build verification)
- ci/accessibility-tests (Accessibility compliance)
- ci/security-scan (Security vulnerability scan)
```

### Pull Request Reviews
```
✅ Require pull request reviews before merging
- Required approving reviews: 2
- Dismiss stale reviews when new commits are pushed
- Require review from code owners
- Restrict pushes that create pull requests
```

### Additional Restrictions
```
✅ Restrict pushes that create pull requests
✅ Require signed commits
✅ Include administrators (rules apply to admins too)
✅ Allow force pushes: ❌ (Never)
✅ Allow deletions: ❌ (Never)
```

## 🚀 Develop Branch Protection (`develop`)

The `develop` branch should have slightly relaxed rules for active development:

### Required Status Checks
```
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging

Required status checks:
- ci/tests (Jest unit tests)
- ci/typescript (TypeScript compilation)
- ci/lint (ESLint checks)
- ci/build-test (Basic build verification)
```

### Pull Request Reviews
```
✅ Require pull request reviews before merging
- Required approving reviews: 1
- Dismiss stale reviews when new commits are pushed
- Require review from code owners (for critical areas only)
```

### Additional Restrictions
```
✅ Include administrators
✅ Allow force pushes: ❌ (Never)
✅ Allow deletions: ❌ (Never)
```

## 🔧 GitHub Actions Workflows

### Continuous Integration Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage --watchAll=false
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  typescript:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: TypeScript check
        run: npm run typecheck

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run accessibility tests
        run: npm run test:accessibility

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - name: Audit dependencies
        run: npm audit --audit-level moderate

  build-ios:
    name: Build iOS
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build for iOS
        run: npx expo export:embed --platform ios

  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build for Android
        run: npx expo export:embed --platform android
```

## 👥 Code Owners Configuration (`.github/CODEOWNERS`)

```
# Global owners
* @maintainer-team @lead-developer

# Core app code
/src/ @frontend-team @maintainer-team

# Firebase backend
/firebase-backend/ @backend-team @maintainer-team

# Configuration files
*.json @maintainer-team
*.js @frontend-team
*.ts @frontend-team

# Documentation
*.md @documentation-team @maintainer-team

# GitHub configuration
/.github/ @maintainer-team

# Security-sensitive files
.env* @security-team @maintainer-team
/firebase-backend/firestore.rules @security-team @backend-team
/firebase-backend/storage.rules @security-team @backend-team

# Build and deployment
/scripts/ @devops-team @maintainer-team
eas.json @devops-team @maintainer-team
app.json @devops-team @frontend-team
```

## 🔒 Repository Settings

### General Settings
```
Repository name: DragonWorldsHK2027
Description: Official mobile app for Dragon World Championships 2027 in Hong Kong
Website: https://dragonworlds.com
Topics: sailing, dragon-class, regatta, weather, react-native, expo, firebase

Visibility: Public (or Private if preferred)
Include in GitHub Archive Program: ✅
Restrict pushes that create files larger than 100 MB: ✅
```

### Features
```
✅ Wikis (for additional documentation)
✅ Issues (for bug tracking and feature requests)
✅ Sponsorships (if accepting sponsorship)
✅ Preserve this repository (for long-term archival)
✅ Discussions (for community Q&A)
✅ Projects (for project management)
✅ Security advisories (for vulnerability reporting)

❌ Allow merge commits (use squash and rebase only)
✅ Allow squash merging (default)
✅ Allow rebase merging
✅ Always suggest updating pull request branches
✅ Allow auto-merge
✅ Automatically delete head branches
```

## 🚨 Security Settings

### Vulnerability Alerts
```
✅ Dependency graph
✅ Dependabot alerts
✅ Dependabot security updates
✅ Dependabot version updates
✅ Code scanning alerts
✅ Secret scanning alerts
```

### Dependabot Configuration (`.github/dependabot.yml`)
```yaml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "maintainer-team"
    assignees:
      - "lead-developer"
    commit-message:
      prefix: "deps"
      include: "scope"

  # Enable version updates for Firebase Functions
  - package-ecosystem: "npm"
    directory: "/firebase-backend/functions"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 3
    reviewers:
      - "backend-team"

  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "devops-team"
```

## 📋 Setting Up Branch Protection

### Via GitHub Web Interface

1. **Navigate to Settings** → **Branches**
2. **Add rule** for `main` branch
3. **Configure protection settings** as outlined above
4. **Repeat for `develop`** branch with appropriate settings

### Via GitHub CLI

```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --input - <<< '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["ci/tests", "ci/typescript", "ci/lint", "ci/build-ios", "ci/build-android", "ci/accessibility-tests", "ci/security-scan"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 2,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_linear_history": false,
    "required_conversation_resolution": true
  }'

# Protect develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --input - <<< '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["ci/tests", "ci/typescript", "ci/lint", "ci/build-test"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'
```

## 🔄 Release Branch Strategy

### Release Branches (`release/*`)
- Created from `develop` when preparing for release
- Only bug fixes and documentation updates allowed
- Merged to both `main` and `develop` when complete
- No special protection rules (temporary branches)

### Hotfix Branches (`hotfix/*`)
- Created from `main` for critical fixes
- Minimal changes only
- Merged to both `main` and `develop`
- Fast-track review process for critical issues

## 📊 Monitoring and Compliance

### Required Integrations
- **Codecov**: Test coverage reporting
- **Snyk**: Security vulnerability scanning
- **SonarCloud**: Code quality analysis
- **Sentry**: Runtime error monitoring

### Branch Protection Compliance
- Regular audits of protection rules
- Monitor for bypass attempts
- Review protection rule effectiveness
- Update rules as project evolves

## 🚀 Emergency Procedures

### Hotfix Process
1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track review (single approver)
4. Deploy immediately after merge
5. Create post-mortem documentation

### Protection Rule Override
- Only for critical production issues
- Requires approval from at least 2 maintainers
- Must be documented and reversed immediately
- Follow-up review of the emergency change

This branch protection strategy ensures:
- **Code Quality**: All changes are reviewed and tested
- **Security**: Signed commits and vulnerability scanning
- **Stability**: Protected main branch with comprehensive checks
- **Collaboration**: Proper review processes and code ownership
- **Emergency Response**: Clear procedures for critical fixes