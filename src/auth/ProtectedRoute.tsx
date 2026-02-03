import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth, isAuthenticated } from './useAuth';
import { User, UserRole, UserStatus } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  requireEmailVerification?: boolean;
  requiredRoles?: UserRole[];
  requiredStatus?: UserStatus[];
  onAuthRequired?: () => void;
  redirectToLogin?: boolean;
}

/**
 * ProtectedRoute component that conditionally renders children based on authentication status
 * 
 * @param children - Content to render when user is authenticated and meets requirements
 * @param fallback - Content to render when user is not authenticated (defaults to built-in login prompt)
 * @param loadingComponent - Content to render while authentication is loading
 * @param requireEmailVerification - Whether email verification is required
 * @param requiredRoles - Array of roles user must have (user must have at least one)
 * @param requiredStatus - Array of statuses user must have (user must have one of these)
 * @param onAuthRequired - Callback when authentication is required
 * @param redirectToLogin - Whether to trigger login redirect (calls onAuthRequired)
 * 
 * @example
 * ```tsx
 * // Basic protection
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // With email verification required
 * <ProtectedRoute requireEmailVerification>
 *   <EmailProtectedContent />
 * </ProtectedRoute>
 * 
 * // Admin only content
 * <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Custom fallback
 * <ProtectedRoute
 *   fallback={<CustomLoginScreen />}
 *   onAuthRequired={() => navigation.navigate('Login')}
 * >
 *   <ProtectedContent />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  loadingComponent,
  requireEmailVerification = false,
  requiredRoles = [],
  requiredStatus = ['active'],
  onAuthRequired,
  redirectToLogin = false,
}) => {
  const auth = useAuth();

  // Show loading state
  if (auth.isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Check if user is authenticated
  if (!isAuthenticated(auth)) {
    // Trigger auth required callback
    if (redirectToLogin && onAuthRequired) {
      onAuthRequired();
      return loadingComponent || <DefaultLoadingComponent />;
    }

    return fallback || <DefaultAuthRequiredComponent onAuthRequired={onAuthRequired} />;
  }

  const { user } = auth;

  // Check email verification requirement
  if (requireEmailVerification && !user.emailVerified) {
    return <EmailVerificationRequiredComponent user={user} />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <InsufficientPermissionsComponent requiredRoles={requiredRoles} userRole={user.role} />;
  }

  // Check status requirements
  if (requiredStatus.length > 0 && !requiredStatus.includes(user.status)) {
    return <AccountStatusRequiredComponent requiredStatus={requiredStatus} userStatus={user.status} />;
  }

  // All checks passed, render protected content
  return <>{children}</>;
};

/**
 * Higher-order component version of ProtectedRoute
 * 
 * @param Component - Component to wrap with protection
 * @param options - Protection options
 * @returns Protected component
 * 
 * @example
 * ```tsx
 * const ProtectedDashboard = withAuth(Dashboard, {
 *   requireEmailVerification: true,
 *   requiredRoles: [UserRole.USER]
 * });
 * 
 * // Usage
 * <ProtectedDashboard />
 * ```
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook to check if current user meets specific requirements
 * 
 * @param requirements - Requirements to check
 * @returns Object with requirement check results
 * 
 * @example
 * ```tsx
 * function ConditionalFeature() {
 *   const { canAccess, reasons } = useAuthRequirements({
 *     requireEmailVerification: true,
 *     requiredRoles: [UserRole.ADMIN]
 *   });
 *   
 *   if (!canAccess) {
 *     return <Text>Access denied: {reasons.join(', ')}</Text>;
 *   }
 *   
 *   return <AdminFeature />;
 * }
 * ```
 */
export const useAuthRequirements = (requirements: {
  requireEmailVerification?: boolean;
  requiredRoles?: UserRole[];
  requiredStatus?: UserStatus[];
}) => {
  const auth = useAuth();
  const reasons: string[] = [];
  
  if (!isAuthenticated(auth)) {
    reasons.push('Authentication required');
    return { canAccess: false, reasons };
  }

  const { user } = auth;

  if (requirements.requireEmailVerification && !user.emailVerified) {
    reasons.push('Email verification required');
  }

  if (requirements.requiredRoles?.length && !requirements.requiredRoles.includes(user.role)) {
    reasons.push(`Required role: ${requirements.requiredRoles.join(' or ')}`);
  }

  if (requirements.requiredStatus?.length && !requirements.requiredStatus.includes(user.status)) {
    reasons.push(`Required status: ${requirements.requiredStatus.join(' or ')}`);
  }

  return {
    canAccess: reasons.length === 0,
    reasons,
  };
};

// Default component implementations

const DefaultLoadingComponent: React.FC = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

interface DefaultAuthRequiredProps {
  onAuthRequired?: () => void;
}

const DefaultAuthRequiredComponent: React.FC<DefaultAuthRequiredProps> = ({ onAuthRequired }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Authentication Required</Text>
    <Text style={styles.message}>
      You need to sign in to access this content.
    </Text>
    {onAuthRequired && (
      <TouchableOpacity style={styles.button} onPress={onAuthRequired}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface EmailVerificationRequiredProps {
  user: User;
}

const EmailVerificationRequiredComponent: React.FC<EmailVerificationRequiredProps> = ({ user }) => {
  const { sendEmailVerification } = useAuth();
  
  const handleResendVerification = async () => {
    try {
      await sendEmailVerification();
      // Could show a toast or alert here
    } catch (error) {
    }
  };

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Email Verification Required</Text>
      <Text style={styles.message}>
        Please verify your email address ({user.email}) to continue.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleResendVerification}>
        <Text style={styles.buttonText}>Resend Verification Email</Text>
      </TouchableOpacity>
    </View>
  );
};

interface InsufficientPermissionsProps {
  requiredRoles: UserRole[];
  userRole: UserRole;
}

const InsufficientPermissionsComponent: React.FC<InsufficientPermissionsProps> = ({ 
  requiredRoles, 
  userRole 
}) => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Insufficient Permissions</Text>
    <Text style={styles.message}>
      This content requires {requiredRoles.join(' or ')} role.
      {'\n'}Your current role: {userRole}
    </Text>
  </View>
);

interface AccountStatusRequiredProps {
  requiredStatus: UserStatus[];
  userStatus: UserStatus;
}

const AccountStatusRequiredComponent: React.FC<AccountStatusRequiredProps> = ({ 
  requiredStatus, 
  userStatus 
}) => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>Account Status Issue</Text>
    <Text style={styles.message}>
      Your account status ({userStatus}) doesn't meet the requirements.
      {'\n'}Required status: {requiredStatus.join(' or ')}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProtectedRoute;