import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SimplifiedResultsScreen } from '../../screens/tabs/SimplifiedResultsScreen';
import { CompetitorDetailScreen } from '../../screens/CompetitorDetailScreen';

type ResultsStackParamList = {
  ResultsHome: undefined;
  CompetitorDetail: {
    sailNumber: string;
    competitorData: any;
    standings: any;
  };
};

const Stack = createStackNavigator<ResultsStackParamList>();

export function ResultsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResultsHome" component={SimplifiedResultsScreen} />
      <Stack.Screen name="CompetitorDetail" component={CompetitorDetailScreen} />
    </Stack.Navigator>
  );
}


