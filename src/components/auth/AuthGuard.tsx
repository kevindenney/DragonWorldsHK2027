import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../auth/useAuth';
import { LoadingScreen } from '../shared/LoadingSpinner';
// import { LoginForm } from './AuthForm'; // Temporarily disabled
import { UserRole, UserStatus } from '../../types/auth';
import { colors } from '../../constants/theme';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  fallbackComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  redirectPath?: string;
  showLoginForm?: boolean;
  onAuthRequired?: () => void;
  onInsufficientPermissions?: (userRole?: UserRole) => void;
  onBackToApp?: () => void;
  testID?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRoles = [],
  fallbackComponent: FallbackComponent,
  loadingComponent: LoadingComponent,
  redirectPath,
  showLoginForm = true,
  onAuthRequired,
  onInsufficientPermissions,
  onBackToApp,
  testID,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasCheckedAuth(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (hasCheckedAuth && requireAuth && !isAuthenticated) {
      onAuthRequired?.();
    }
  }, [hasCheckedAuth, requireAuth, isAuthenticated, onAuthRequired]);

  useEffect(() => {
    if (hasCheckedAuth && isAuthenticated && user && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        onInsufficientPermissions?.(user.role);
      }
    }
  }, [hasCheckedAuth, isAuthenticated, user, requiredRoles, onInsufficientPermissions]);

  // Show loading while authentication state is being determined
  if (isLoading || !hasCheckedAuth) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    return (
      <LoadingScreen 
        message="Authenticating..." 
        testID={`${testID}-loading`}
      />
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated
  if (!isAuthenticated || !user) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    
    if (showLoginForm) {
      return (
        <View style={styles.container} testID={`${testID}-login-required`}>
          <Text>Authentication Required (LoginForm temporarily disabled)</Text>
        </View>
      );
    }
    
    return null;
  }

  // Check if user account is active
  if (user.status !== UserStatus.ACTIVE) {
    return (
      <AccountStatusGuard 
        user={user} 
        onBackToApp={onBackToApp}
        testID={`${testID}-account-status`}
      />
    );
  }

  // Check role-based permissions
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <PermissionDenied 
        userRole={user.role}
        requiredRoles={requiredRoles}
        testID={`${testID}-permission-denied`}
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

export interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoginForm?: boolean;
  onBackToApp?: () => void;
  testID?: string;
}

export function RequireAuth({ 
  children, 
  fallback, 
  showLoginForm = true,
  onBackToApp,
  testID 
}: RequireAuthProps) {
  return (
    <AuthGuard
      requireAuth={true}
      showLoginForm={showLoginForm}
      onBackToApp={onBackToApp}
      fallbackComponent={fallback ? () => <>{fallback}</> : undefined}
      testID={testID}
    >
      {children}
    </AuthGuard>
  );
}

export interface RequireRoleProps {
  children: React.ReactNode;
  roles: UserRole | UserRole[];
  fallback?: React.ReactNode;
  testID?: string;
}

export function RequireRole({ 
  children, 
  roles, 
  fallback,
  testID 
}: RequireRoleProps) {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (
    <AuthGuard
      requireAuth={true}
      requiredRoles={roleArray}
      fallbackComponent={fallback ? () => <>{fallback}</> : undefined}
      testID={testID}
    >
      {children}
    </AuthGuard>
  );
}

export interface RequireAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  testID?: string;
}

export function RequireAdmin({ children, fallback, testID }: RequireAdminProps) {
  return (
    <RequireRole 
      roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      fallback={fallback}
      testID={testID}
    >
      {children}
    </RequireRole>
  );
}

export interface GuestOnlyProps {
  children: React.ReactNode;
  redirectTo?: React.ReactNode;
  testID?: string;
}

export function GuestOnly({ children, redirectTo, testID }: GuestOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading..." testID={`${testID}-loading`} />;
  }

  if (isAuthenticated) {
    if (redirectTo) {
      return <>{redirectTo}</>;
    }
    return null;
  }

  return <>{children}</>;
}

interface AccountStatusGuardProps {
  user: any;
  testID?: string;
  onBackToApp?: () => void;
}

function AccountStatusGuard({ user, testID, onBackToApp }: AccountStatusGuardProps) {
  const { logout } = useAuth();

  const getStatusMessage = () => {
    switch (user.status) {
      case UserStatus.PENDING_VERIFICATION:
        return {
          title: 'Account Verification Required',
          message: 'Please verify your email address to continue using the app.',
          action: 'Resend Verification Email',
        };
      case UserStatus.SUSPENDED:
        return {
          title: 'Account Suspended',
          message: 'Your account has been suspended. Please contact support for assistance.',
          action: 'Contact Support',
        };
      case UserStatus.INACTIVE:
        return {
          title: 'Account Inactive',
          message: 'Your account is inactive. Please contact support to reactivate.',
          action: 'Contact Support',
        };
      default:
        return {
          title: 'Account Issue',
          message: 'There is an issue with your account. Please contact support.',
          action: 'Contact Support',
        };
    }
  };

  const status = getStatusMessage();

  return (
    <View style={styles.statusContainer} testID={testID}>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text style={styles.statusMessage}>{status.message}</Text>
        
        <View style={styles.statusActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              // Handle primary action based on status
            }}
          >
            <Text style={styles.primaryButtonText}>{status.action}</Text>
          </TouchableOpacity>
          
          {onBackToApp && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onBackToApp}
            >
              <Text style={styles.secondaryButtonText}>Back to App</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={logout}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface PermissionDeniedProps {
  userRole: UserRole;
  requiredRoles: UserRole[];
  testID?: string;
}

function PermissionDenied({ userRole, requiredRoles, testID }: PermissionDeniedProps) {
  const { logout } = useAuth();

  return (
    <View style={styles.statusContainer} testID={testID}>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Access Denied</Text>
        <Text style={styles.statusMessage}>
          You don't have permission to access this resource. 
          {'\n\n'}Your role: {userRole}
          {'\n'}Required roles: {requiredRoles.join(', ')}
        </Text>
        
        <View style={styles.statusActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              // Navigate back or to a safe screen
            }}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={logout}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Hook for conditional rendering based on authentication state
export function useAuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    // Implement permission checking logic based on your needs
    return true;
  };

  const isAdmin = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  };

  const canAccess = (requiredRoles?: UserRole[], requiredAuth: boolean = true): boolean => {
    if (isLoading) return false;
    
    if (requiredAuth && !isAuthenticated) return false;
    
    if (requiredRoles && requiredRoles.length > 0) {
      return hasRole(requiredRoles);
    }
    
    return true;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    isAdmin,
    canAccess,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusActions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});