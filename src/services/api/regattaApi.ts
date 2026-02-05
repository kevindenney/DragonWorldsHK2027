import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Race, Competitor, RaceResult } from '../../stores';

// API-specific types
interface Boat extends Competitor {}
interface Result extends RaceResult {}

const BASE_URL = 'https://api.dragonworlds.hk'; // Replace with actual API endpoint

// Mock API functions - replace with actual API calls
const fetchRaces = async (): Promise<Race[]> => {
  // Replace with actual API call
  return [];
};

const fetchBoats = async (): Promise<Boat[]> => {
  // Replace with actual API call
  return [];
};

const fetchResults = async (raceId: string): Promise<Result[]> => {
  // Replace with actual API call
  return [];
};

const updateRaceResult = async (result: Result): Promise<Result> => {
  // Replace with actual API call
  return result;
};

// Query hooks
export const useRaces = () => {
  return useQuery({
    queryKey: ['races'],
    queryFn: fetchRaces,
  });
};

export const useBoats = () => {
  return useQuery({
    queryKey: ['boats'],
    queryFn: fetchBoats,
  });
};

export const useResults = (raceId: string) => {
  return useQuery({
    queryKey: ['results', raceId],
    queryFn: () => fetchResults(raceId),
    enabled: !!raceId,
  });
};

// Mutation hooks
export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateRaceResult,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
};