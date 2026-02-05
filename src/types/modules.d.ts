// Type declarations for optional modules that may not be installed

declare module 'expo-media-library' {
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function saveToLibraryAsync(uri: string): Promise<void>;
  export function createAssetAsync(uri: string): Promise<any>;
  export function getPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-calendar' {
  export function requestCalendarPermissionsAsync(): Promise<{ status: string }>;
  export function getCalendarsAsync(entityType?: string): Promise<any[]>;
  export function createEventAsync(calendarId: string, eventDetails: any): Promise<string>;
  export function deleteEventAsync(eventId: string): Promise<void>;
  export const EntityTypes: {
    EVENT: string;
    REMINDER: string;
  };
}

declare module '@invertase/react-native-apple-authentication' {
  export const appleAuth: {
    performRequest: (options: any) => Promise<any>;
    getCredentialStateForUser: (userId: string) => Promise<any>;
  };
  export const AppleAuthenticationScope: {
    EMAIL: number;
    FULL_NAME: number;
  };
  export const AppleAuthenticationOperation: {
    LOGIN: number;
    REFRESH: number;
    LOGOUT: number;
  };
  export const AppleButton: any;
}

declare module '@stripe/stripe-react-native' {
  export function useStripe(): {
    initPaymentSheet: (params: any) => Promise<{ error?: any }>;
    presentPaymentSheet: () => Promise<{ error?: any }>;
    confirmPayment: (clientSecret: string, params?: any) => Promise<{ error?: any; paymentIntent?: any }>;
    createToken: (params: any) => Promise<{ error?: any; token?: any }>;
    retrievePaymentIntent: (clientSecret: string) => Promise<{ error?: any; paymentIntent?: any }>;
    handleCardAction: (clientSecret: string) => Promise<{ error?: any; paymentIntent?: any }>;
  };

  export function StripeProvider(props: { publishableKey: string; merchantIdentifier?: string; children: any }): any;

  export interface PaymentIntent {
    id: string;
    status: string;
    amount: number;
    currency: string;
  }

  export interface PaymentMethod {
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expiryMonth: number;
      expiryYear: number;
    };
  }
}
