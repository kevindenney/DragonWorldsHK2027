import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useAuth } from '../../auth/useAuth';
import { LoadingScreen } from '../shared/LoadingSpinner';
// import { LoginForm } from './AuthForm'; // Temporarily disabled
import { UserRole } from '../../types/auth';
import { UserStatus } from '../../auth/authTypes';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { AlertTriangle, Mail, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react-native';

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
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  // Track if we've completed initial auth check - use isInitialized as primary indicator
  const [hasCheckedAuth, setHasCheckedAuth] = useState(isInitialized);

  useEffect(() => {
    // Once auth is initialized, we've checked auth
    if (isInitialized) {
      setHasCheckedAuth(true);
    }
  }, [isInitialized]);

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

  // Show loading only during initial auth check, not during subsequent operations
  // Once isInitialized is true, auth is ready - don't show loading for other operations
  if (!isInitialized || (!hasCheckedAuth && isLoading)) {
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
  const { isAuthenticated, isInitialized } = useAuth();

  // Only show loading during initial auth check
  if (!isInitialized) {
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
  const { logout, resendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const handleContactSupport = async () => {
    const supportEmail = 'support@regattaflow.com';
    const subject = `Account Support - ${user.status}`;
    const body = `Hello RegattaFlow Support,\n\nI need assistance with my account.\n\nAccount Email: ${user.email}\nAccount Status: ${user.status}\nUser ID: ${user.uid}\n\nIssue Description:\n[Please describe your issue here]\n\nThank you for your assistance.`;

    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback - show alert with support email
        Alert.alert(
          'Contact Support',
          `Please email us at: ${supportEmail}\n\nInclude your account email (${user.email}) and describe the issue you're experiencing.`,
          [
            { text: 'Copy Email', onPress: () => /* Copy to clipboard if available */ {} },
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please contact support@regattaflow.com directly.');
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmailVerification) {
      Alert.alert('Error', 'Email verification not available. Please contact support.');
      return;
    }

    setIsResending(true);
    try {
      await resendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link. You may need to check your spam folder.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const getStatusInfo = () => {
    switch (user.status) {
      case UserStatus.PENDING_VERIFICATION:
        return {
          title: 'Verify Your Email',
          message: 'We sent a verification link to your email address. Please click the link to activate your account and access all features.',
          icon: <Mail size={48} color={colors.warning} />,
          primaryAction: {
            label: isResending ? 'Sending...' : 'Resend Email',
            handler: handleResendVerification,
            disabled: isResending,
            icon: <RefreshCw size={16} color={colors.background} />
          },
          helpText: 'Check your spam folder if you don\'t see the email.'
        };
      case UserStatus.SUSPENDED:
        return {
          title: 'Account Temporarily Suspended',
          message: 'Your account access has been temporarily restricted. This may be due to a violation of our terms of service or suspicious activity.',
          icon: <AlertTriangle size={48} color={colors.error} />,
          primaryAction: {
            label: 'Contact Support',
            handler: handleContactSupport,
            disabled: false,
            icon: <HelpCircle size={16} color={colors.background} />
          },
          helpText: 'Our support team will review your case and respond within 24 hours.'
        };
      case UserStatus.INACTIVE:
        return {
          title: 'Account Inactive',
          message: 'Your account has been deactivated due to prolonged inactivity. Contact support to reactivate your account and restore access.',
          icon: <AlertTriangle size={48} color={colors.warning} />,
          primaryAction: {
            label: 'Reactivate Account',
            handler: handleContactSupport,
            disabled: false,
            icon: <RefreshCw size={16} color={colors.background} />
          },
          helpText: 'Reactivation typically takes 1-2 business days.'
        };
      default:
        return {
          title: 'Account Access Issue',
          message: 'There appears to be an issue with your account that requires attention. Please contact our support team for assistance.',
          icon: <AlertTriangle size={48} color={colors.error} />,
          primaryAction: {
            label: 'Get Help',
            handler: handleContactSupport,
            disabled: false,
            icon: <HelpCircle size={16} color={colors.background} />
          },
          helpText: 'Include your account details when contacting support.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.statusContainer} testID={testID}>
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          {statusInfo.icon}
        </View>

        <Text style={styles.statusTitle}>{statusInfo.title}</Text>
        <Text style={styles.statusMessage}>{statusInfo.message}</Text>

        {statusInfo.helpText && (
          <Text style={styles.helpText}>{statusInfo.helpText}</Text>
        )}

        <View style={styles.statusActions}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              statusInfo.primaryAction.disabled && styles.primaryButtonDisabled
            ]}
            onPress={statusInfo.primaryAction.handler}
            disabled={statusInfo.primaryAction.disabled}
          >
            <View style={styles.buttonContent}>
              {statusInfo.primaryAction.icon}
              <Text style={[
                styles.primaryButtonText,
                statusInfo.primaryAction.disabled && styles.primaryButtonTextDisabled
              ]}>
                {statusInfo.primaryAction.label}
              </Text>
            </View>
          </TouchableOpacity>

          {onBackToApp && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBackToApp}
            >
              <View style={styles.buttonContent}>
                <ArrowLeft size={16} color={colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>Back to App</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: logout }
                ]
              );
            }}
          >
            <Text style={styles.tertiaryButtonText}>Sign Out</Text>
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
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();

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
    // Use isInitialized as the primary check for auth readiness
    if (!isInitialized) return false;

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
    isInitialized,
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
    padding: spacing.xl,
  },
  statusCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...shadows.card,
  },
  statusIcon: {
    marginBottom: spacing.lg,
  },
  statusTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  helpText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  statusActions: {
    width: '100%',
    gap: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.background,
  },
  primaryButtonTextDisabled: {
    color: colors.textMuted,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  tertiaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});