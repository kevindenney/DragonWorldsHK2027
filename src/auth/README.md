# Firebase Authentication System

A comprehensive authentication system for DragonWorldsHK2027 with support for multiple authentication providers and advanced user management.

## Features

- **Multiple Authentication Providers**:
  - Email/Password authentication
  - Google Sign-In (popup and redirect methods for web, native for mobile)
  - Apple Sign-In (web and native support)
  - Password reset and email verification

- **Advanced User Management**:
  - User profiles with customizable fields
  - Role-based access control (USER, ADMIN, SUPER_ADMIN)
  - Account status management (ACTIVE, INACTIVE, SUSPENDED, etc.)
  - Multiple provider linking
  - Account deletion

- **Security & Validation**:
  - Strong password validation
  - Email format validation
  - Input sanitization
  - Error handling with user-friendly messages

- **State Management**:
  - React Context for global auth state
  - Persistent authentication with AsyncStorage
  - Loading states and error handling
  - Activity tracking

- **Route Protection**:
  - Protected route components
  - Role-based route protection
  - Email verification requirements
  - HOC pattern support

## Setup

1. **Install Dependencies** (already installed):
   ```bash
   npm install firebase @react-native-google-signin/google-signin @invertase/react-native-apple-authentication
   ```

2. **Configure Environment Variables**:
   Add these to your `.env` file:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
   ```

3. **Wrap Your App with AuthProvider**:
   ```tsx
   import { AuthProvider } from './src/auth';
   
   export default function App() {
     return (
       <AuthProvider>
         <YourApp />
       </AuthProvider>
     );
   }
   ```

## Usage Examples

### Basic Authentication

```tsx
import { useAuth } from '../auth';

function LoginScreen() {
  const { signIn, signUp, isLoading, error, clearError } = useAuth();
  
  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn({ email, password });
      // User is now authenticated
    } catch (error) {
      // Error is automatically set in context
      console.error('Sign in failed:', error);
    }
  };
  
  const handleSignUp = async (email: string, password: string, displayName: string) => {
    try {
      await signUp({ 
        email, 
        password, 
        displayName, 
        acceptTerms: true 
      });
      // User created and signed in
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  return (
    <View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss" onPress={clearError} />
        </View>
      )}
      
      <Button 
        title={isLoading ? "Signing In..." : "Sign In"} 
        onPress={() => handleSignIn('user@example.com', 'password')}
        disabled={isLoading}
      />
      
      <Button 
        title="Sign Up" 
        onPress={() => handleSignUp('new@example.com', 'password', 'John Doe')}
      />
    </View>
  );
}
```

### Social Authentication

```tsx
import { useAuth } from '../auth';

function SocialLoginScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle('popup'); // or 'redirect' for web
      // User signed in with Google
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };
  
  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      // User signed in with Apple
    } catch (error) {
      console.error('Apple sign in failed:', error);
    }
  };

  return (
    <View>
      <Button title="Sign In with Google" onPress={handleGoogleSignIn} />
      <Button title="Sign In with Apple" onPress={handleAppleSignIn} />
    </View>
  );
}
```

### Protected Routes

```tsx
import { ProtectedRoute, UserRole } from '../auth';

function App() {
  return (
    <NavigationContainer>
      {/* Public routes */}
      <Stack.Screen name="Login" component={LoginScreen} />
      
      {/* Protected routes */}
      <Stack.Screen name="Dashboard">
        {() => (
          <ProtectedRoute>
            <DashboardScreen />
          </ProtectedRoute>
        )}
      </Stack.Screen>
      
      {/* Admin only routes */}
      <Stack.Screen name="AdminPanel">
        {() => (
          <ProtectedRoute 
            requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
            requireEmailVerification={true}
          >
            <AdminPanelScreen />
          </ProtectedRoute>
        )}
      </Stack.Screen>
    </NavigationContainer>
  );
}
```

### Using Authentication State

```tsx
import { useAuth, isAuthenticated } from '../auth';

function UserProfile() {
  const auth = useAuth();
  
  if (!isAuthenticated(auth)) {
    return <Text>Please sign in to view your profile</Text>;
  }
  
  // TypeScript now knows auth.user is not null
  const { user } = auth;
  
  return (
    <View>
      <Text>Welcome, {user.displayName}!</Text>
      <Text>Email: {user.email}</Text>
      <Text>Verified: {user.emailVerified ? 'Yes' : 'No'}</Text>
      <Text>Role: {user.role}</Text>
    </View>
  );
}
```

### Form Validation

```tsx
import { validateEmail, validatePassword, validateRegistrationData } from '../auth';

function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleSubmit = () => {
    const validation = validateRegistrationData({
      email,
      password,
      displayName,
      acceptTerms
    });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Proceed with registration
    setErrors([]);
    // ... sign up logic
  };
  
  return (
    <View>
      <TextInput 
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      
      <TextInput 
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      
      <TextInput 
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Display Name"
      />
      
      <Switch 
        value={acceptTerms}
        onValueChange={setAcceptTerms}
      />
      <Text>Accept Terms & Conditions</Text>
      
      {errors.length > 0 && (
        <View>
          {errors.map((error, index) => (
            <Text key={index} style={styles.error}>{error}</Text>
          ))}
        </View>
      )}
      
      <Button title="Sign Up" onPress={handleSubmit} />
    </View>
  );
}
```

### Password Reset

```tsx
import { useAuth } from '../auth';

function ForgotPasswordScreen() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  
  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email');
    }
  };
  
  return (
    <View>
      <TextInput 
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
      />
      <Button title="Reset Password" onPress={handlePasswordReset} />
    </View>
  );
}
```

### Higher Order Component Pattern

```tsx
import { withAuth, UserRole } from '../auth';

// Protect a component
const ProtectedDashboard = withAuth(Dashboard, {
  requireEmailVerification: true,
  requiredRoles: [UserRole.USER, UserRole.ADMIN]
});

// Usage
function App() {
  return <ProtectedDashboard />;
}
```

### Custom Hooks

```tsx
import { 
  useAuthUser, 
  useAuthLoading, 
  useAuthError, 
  useAuthActions,
  useHasProvider 
} from '../auth';

function CustomAuthComponent() {
  const user = useAuthUser();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const { signOut } = useAuthActions();
  const hasGoogle = useHasProvider('google');
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <View>
      {user && <Text>Hello, {user.displayName}!</Text>}
      {hasGoogle && <Text>Google account linked</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## API Reference

### AuthService
- `signInWithEmailAndPassword(credentials)` - Email/password sign in
- `createUserWithEmailAndPassword(data)` - Create new user account
- `signInWithGoogle(method)` - Google authentication
- `signInWithApple()` - Apple authentication
- `sendPasswordResetEmail(email)` - Send password reset email
- `sendEmailVerification()` - Send email verification
- `updateUserProfile(data)` - Update user profile
- `signOut()` - Sign out user
- `deleteAccount()` - Delete user account

### Context & Hooks
- `useAuth()` - Main authentication hook
- `useAuthUser()` - Get current user
- `useAuthLoading()` - Get loading state
- `useAuthError()` - Get error state
- `useAuthActions()` - Get authentication actions
- `isAuthenticated(authState)` - Type guard for authentication

### Components
- `<ProtectedRoute>` - Protect routes with authentication
- `<AuthProvider>` - Authentication context provider

### Utilities
- `validateEmail(email)` - Email validation
- `validatePassword(password)` - Password validation
- `validateRegistrationData(data)` - Full registration validation
- `getAuthErrorMessage(error)` - Get user-friendly error messages
- `formatUserDisplayName(user)` - Format display names
- `getUserInitials(user)` - Get user initials for avatars

## Error Handling

The system provides comprehensive error handling with user-friendly messages:

```tsx
import { getAuthErrorMessage } from '../auth';

try {
  await signIn(credentials);
} catch (error) {
  const message = getAuthErrorMessage(error);
  // Display user-friendly error message
  Alert.alert('Sign In Failed', message);
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

- `User` - Complete user interface
- `AuthState` - Authentication state
- `AuthError` - Error interface
- `ValidationResult` - Validation results
- `LoginCredentials` - Login form data
- `RegistrationData` - Registration form data

## Security Considerations

- Passwords are validated for strength requirements
- Email addresses are properly validated
- Input sanitization is performed
- Error messages don't expose sensitive information
- Tokens are automatically managed and refreshed
- User sessions are persisted securely