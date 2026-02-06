/**
 * ClubSpotService - Service for fetching entrant data from ClubSpot
 *
 * Supports both live data fetching via Firebase Cloud Function
 * and demo data fallback for development/offline scenarios.
 */

import type { Competitor } from '../types/noticeBoard';
import { externalUrls } from '../config/externalUrls';

export interface ClubSpotConfig {
  baseUrl: string;
  cacheDuration: number;
  useDemoData: boolean;
  cloudFunctionUrl: string;
}

export interface DataSourceInfo {
  isLive: boolean;
  lastFetched: Date | null;
  source: 'live' | 'cache' | 'demo';
  error?: string;
}

export interface ClubSpotEntrant {
  id: string;
  sailors: string[];
  boatClass: string;
  sailNumber: string;
  boatName: string;
  boatType: string;
  handicapRating?: number;
  club: string;
  country: string;
  registrationStatus: 'pending' | 'confirmed' | 'paid' | 'incomplete';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  entryDate: string;
}

// Bundled initial data - shown immediately while live data loads
// Last updated: 2026-02-06
const BUNDLED_ENTRANTS: Record<string, Competitor[]> = {
  // APAC 2026 - 36 entries bundled from ClubSpot scrape 2026-02-06
  'p75RuY5UZc': [
    { id: 'bundled_1', sailNumber: 'AUS 219', helmName: 'Sandy Anderson', crewNames: ["Susan Parker","Caroline Gibson","Robyn Johnston"], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Blue Marlin', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_2', sailNumber: 'GBR 192', helmName: 'Graham Bailey', crewNames: [], country: 'GBR', club: 'RYS', className: 'Dragon', boatName: 'Bluebottle', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_3', sailNumber: 'NED 449', helmName: 'Huib Bannier', crewNames: [], country: 'NED', club: 'WV Aalsmeer', className: 'Dragon', boatName: 'Felicity Shagwell', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_4', sailNumber: 'NED 440', helmName: 'Marc Blees', crewNames: ["Peter Niekerk van","Felix Jacobsen"], country: 'NED', club: 'NYYC', className: 'Dragon', boatName: 'Lady in red', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_5', sailNumber: 'SUI 5', helmName: 'Andreas Brechbuhl', crewNames: ["Peter Baer","Matthias Wacker"], country: 'SUI', club: '', className: 'Dragon', boatName: 'Sai Mui', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_6', sailNumber: 'HKG TBD', helmName: 'Ida Cheung', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Davinloong', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_7', sailNumber: 'DEN 410', helmName: 'Jens Christensen', crewNames: [], country: 'DEN', club: 'KDY / HS', className: 'Dragon', boatName: 'Out of Bounce', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_8', sailNumber: 'HKG TBD', helmName: 'Martin Cresswell', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Elfje', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_9', sailNumber: 'GER TBD', helmName: 'Jan Eckert', crewNames: ["Torvar Mirsky","Frederico Melo"], country: 'GER', club: 'SNG', className: 'Dragon', boatName: 'Gingko Racing', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_10', sailNumber: 'GER 1207', helmName: 'Nicola Friesen', crewNames: [], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Khaleesi', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_11', sailNumber: 'HUN 63', helmName: 'Lorand Gombos', crewNames: [], country: 'HUN', club: 'Hungária Yacht Club', className: 'Dragon', boatName: 'Nyári Mikulás', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_12', sailNumber: 'GBR 833', helmName: 'Grant Gordon', crewNames: ["Luke Patience","Ruairidh Scott","Faye Chatterton"], country: 'GBR', club: 'Royal Yacht Squadron', className: 'Dragon', boatName: 'Louise Racing', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_13', sailNumber: 'NOR TBD', helmName: 'Karl Johan Grebstad', crewNames: ["Hendrik Penndorf","Claass Barth"], country: 'NOR', club: 'Ålesund\'s Seilforening', className: 'Dragon', boatName: 'Fei Chi (Charter boat)', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_14', sailNumber: 'EST TBD', helmName: 'Margus Haud', crewNames: ["Martin Käerdi","Ilmar Rosme"], country: 'EST', club: 'KJK', className: 'Dragon', boatName: 'LAINE', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_15', sailNumber: 'NED 447', helmName: 'Arne Hubregtse', crewNames: [], country: 'NED', club: 'WV Zierikzee', className: 'Dragon', boatName: 'Flin', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_16', sailNumber: 'DEN TBD', helmName: 'Bo Sejr Johansen', crewNames: ["Theis Palm","Kasper Harsberg"], country: 'DEN', club: 'Hornbaek', className: 'Dragon', boatName: 'Deja Vu ver. 3.0', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_17', sailNumber: 'HUN 57', helmName: 'Ferenc Kis-Szölgyémi', crewNames: ["Károly Vezér","Farkas Litkey"], country: 'HUN', club: 'AMVK', className: 'Dragon', boatName: 'HANNI', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_18', sailNumber: 'UAE 58', helmName: 'Jeroen Leenen', crewNames: [], country: 'UAE', club: 'DOSC', className: 'Dragon', boatName: 'Desert Storm', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_19', sailNumber: 'HKG 19', helmName: 'Patrick Li', crewNames: ["Nick Sin","Felicia Leung","Ke Ying Tan"], country: 'HKG', club: '', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_20', sailNumber: 'AUS TBD', helmName: 'David Lynn', crewNames: [], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Relentless', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_21', sailNumber: 'IRL 232', helmName: 'Jamie McWilliam', crewNames: [], country: 'IRL', club: 'RHKYC', className: 'Dragon', boatName: 'LALALAM', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_22', sailNumber: 'GER 22', helmName: 'Dirk Neukirchen', crewNames: ["Lars Hendriksen","George Leonchuk"], country: 'GER', club: '', className: 'Dragon', boatName: 'Flotter Dreier', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_23', sailNumber: 'GER 1263', helmName: 'Christopher Opielok', crewNames: [], country: 'GER', club: 'RHKYC RORC NRV', className: 'Dragon', boatName: 'Rockall', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_24', sailNumber: 'HKG 8', helmName: 'Victor Pang', crewNames: [], country: 'HKG', club: 'Royal Hong Kong Yacht Club', className: 'Dragon', boatName: 'Kam Loong', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_25', sailNumber: 'AUT 358', helmName: 'Claas Von Thülen', crewNames: ["Michael Lipp","Leo Pilgerstorfer"], country: 'AUT', club: 'ASC, UYCAs, DTYC', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_26', sailNumber: 'SWE 416', helmName: 'Martin Pålsson', crewNames: [], country: 'SWE', club: 'GKSS', className: 'Dragon', boatName: 'Nono', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_27', sailNumber: 'GER 1223', helmName: 'Axel Schulz', crewNames: ["Mario Kühl","Daniel Bauer"], country: 'GER', club: 'VsAW / SCE', className: 'Dragon', boatName: 'Blue Defender', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_28', sailNumber: 'SWE 800', helmName: 'Jan Secher', crewNames: ["Richard Sydenham","Gerard Mitchell"], country: 'SWE', club: 'Marstrands Segelsällskap', className: 'Dragon', boatName: 'Miss Behavior', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_29', sailNumber: 'GER TBD', helmName: 'Christian Seegers', crewNames: ["Daniel Paysen","Jan Maiwald"], country: 'GER', club: 'NRV', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_30', sailNumber: 'USA 325', helmName: 'William Swigart', crewNames: ["David Caesar","Arthur Anosov"], country: 'USA', club: 'Newport Harbor YC / RHKYC', className: 'Dragon', boatName: 'Magic', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_31', sailNumber: 'GBR 832', helmName: 'David Tabb', crewNames: [], country: 'GBR', club: 'Parkstone Yacht Club', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_32', sailNumber: 'GER 11', helmName: 'Christoph Toepfer', crewNames: ["Diego Negri","Markus Koy"], country: 'GER', club: 'Norddeutscher Regatta Verein', className: 'Dragon', boatName: 'Aurora', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_33', sailNumber: 'HKG 12', helmName: 'Christian Low', crewNames: ["Anthony Byrne","Hubert Feng","Katy Tong"], country: 'HKG', club: 'NA', className: 'Dragon', boatName: 'Eaux Vives', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_34', sailNumber: 'SWE 345', helmName: 'Jacob Wallenberg', crewNames: [], country: 'SWE', club: 'Royal Swedish Yacht Club, KSSS', className: 'Dragon', boatName: 'MING', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_35', sailNumber: 'GER 1146', helmName: 'Ferdinand Ziegelmayer', crewNames: ["Peter Eckhardt","Philip Walkenbach"], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Dörte', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_36', sailNumber: 'HKG 59', helmName: 'Abraham van Olphen', crewNames: ["Kevin Denney","Glenn Cooke"], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'DRAGONFLY', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
  ],
  // Worlds 2027 - 79 entries bundled from ClubSpot scrape 2026-02-06
  'zyQIfeVjhb': [
    { id: 'w27_1', sailNumber: 'EST 55', helmName: 'Kristian Allikmaa', crewNames: [], country: 'EST', club: 'Kalev Yacht Club', className: 'Dragon', boatName: 'Tiamat', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_2', sailNumber: 'AUS 219', helmName: 'Sandy Anderson', crewNames: ["Susan Parker","Caroline Gibson","Robyn Johnston"], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Blue Marlin', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_3', sailNumber: 'SWE TBD', helmName: 'Lars Apelqvist', crewNames: ["Bjorn Palmquist"], country: 'SWE', club: 'GKSS', className: 'Dragon', boatName: 'A&A', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_4', sailNumber: 'GBR 192', helmName: 'Graham Bailey', crewNames: [], country: 'GBR', club: 'RYS', className: 'Dragon', boatName: 'Bluebottle', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_5', sailNumber: 'NED 449', helmName: 'Huib Bannier', crewNames: [], country: 'NED', club: 'WV Aalsmeer', className: 'Dragon', boatName: 'Felicity Shagwell', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_6', sailNumber: 'GBR 763', helmName: 'Simon Barter', crewNames: ["Donald Wilks"], country: 'GBR', club: 'Cowes Corinthian Yacht Club', className: 'Dragon', boatName: 'Bertie', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_7', sailNumber: 'TUR 12', helmName: 'Andy Beadsworth', crewNames: ["Simon Fry","Enes Çaylak"], country: 'TUR', club: 'B.A.Y.K', className: 'Dragon', boatName: 'Provezza Dragon', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_8', sailNumber: 'NED 440', helmName: 'Marc Blees', crewNames: ["Felix Jacobsen","Peter van Niekerk"], country: 'NED', club: 'NYYC', className: 'Dragon', boatName: 'Lady in Red', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_9', sailNumber: 'NED 393', helmName: 'Richard Blickman', crewNames: ["Remco Van Den Berg","Koen Desmet"], country: 'NED', club: 'KNZ&RV', className: 'Dragon', boatName: 'Cobweb', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_10', sailNumber: 'ITA 79', helmName: 'Yevgen Braslavets', crewNames: ["Andrea Zaoli","Davide Marrella"], country: 'ITA', club: 'Yacht Club Sanremo', className: 'Dragon', boatName: 'Transbunker', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_11', sailNumber: 'SUI 11', helmName: 'Andreas Brechbuhl', crewNames: ["Peter Baer","Matthias Wacker"], country: 'SUI', club: '', className: 'Dragon', boatName: 'Sai Mui', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_12', sailNumber: 'HKG 12', helmName: 'Christian Low', crewNames: ["Anthony Byrne","Hubert Feng","Katy Tong"], country: 'HKG', club: 'NA', className: 'Dragon', boatName: 'Eaux Vives', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_13', sailNumber: 'IRL 201', helmName: 'Martin Byrne', crewNames: ["Adam Winkelmann"], country: 'IRL', club: 'Royal St George Yacht Club', className: 'Dragon', boatName: 'Jaguar Sailing Team', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_14', sailNumber: 'HKG TBD', helmName: 'Marc CASTAGNET', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Celines', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_15', sailNumber: 'HKG 15', helmName: 'Ur Way', crewNames: ["Lowell Godwin","Chang"], country: 'HKG', club: '', className: 'Dragon', boatName: 'TBA', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_16', sailNumber: 'HKG 16', helmName: 'Phyllis Joy', crewNames: ["Chang"], country: 'HKG', club: '', className: 'Dragon', boatName: 'TBC', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_17', sailNumber: 'HKG TBD', helmName: 'Ida Cheung', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Davinloong', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_18', sailNumber: 'DEN 410', helmName: 'Jens Christensen', crewNames: [], country: 'DEN', club: 'KDY / HS', className: 'Dragon', boatName: 'Out of bounce', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_19', sailNumber: 'HKG TBD', helmName: 'Joseph Chu', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'MEI FEI', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_20', sailNumber: 'IRL 45', helmName: 'Ben Cooke', crewNames: [], country: 'IRL', club: 'Royal St George Yacht Club', className: 'Dragon', boatName: 'Titan', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_21', sailNumber: 'HKG TBD', helmName: 'Martin Cresswell', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Elfje', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_22', sailNumber: 'GER TBD', helmName: 'Jan Eckert', crewNames: ["Frederico Melo","Torvar Mirsky"], country: 'GER', club: 'SNG', className: 'Dragon', boatName: 'Ginkgo Racing', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_23', sailNumber: 'GER 1232', helmName: 'Christian Einfeldt', crewNames: [], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'JAM', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_24', sailNumber: 'GER 1207', helmName: 'Nicola Friesen', crewNames: [], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Khaleesi', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_25', sailNumber: 'HUN 63', helmName: 'Lorand Gombos', crewNames: [], country: 'HUN', club: 'Hungária Yacht Club', className: 'Dragon', boatName: 'Nyári Mikulás', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_26', sailNumber: 'GBR 833', helmName: 'Grant Gordon', crewNames: ["Luke Patience","Ruairidh Scott","Faye Chatterton"], country: 'GBR', club: 'Royal Yacht Squadron', className: 'Dragon', boatName: 'Louise Racing', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_27', sailNumber: 'NOR 27', helmName: 'Karl Johan Grebstad', crewNames: [], country: 'NOR', club: '', className: 'Dragon', boatName: 'TBA', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_28', sailNumber: 'EST TBD', helmName: 'Margus Haud', crewNames: ["Martin Käerdi","Ilmar Rosme"], country: 'EST', club: 'KJK', className: 'Dragon', boatName: 'LAINE', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_29', sailNumber: 'HKG TBD', helmName: 'Mark Ho', crewNames: ["Ming Yip","Johnny Cheung"], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Happy little swallow', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_30', sailNumber: 'NED 447', helmName: 'Arne Hubregtse', crewNames: [], country: 'NED', club: 'WV Zierikzee', className: 'Dragon', boatName: 'Flin', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_31', sailNumber: 'GER 999', helmName: 'Philipp Kadelbach', crewNames: ["Johannes Polgar","Niels Hentschel"], country: 'GER', club: 'Verein Seglerhaus am Wannser', className: 'Dragon', boatName: 'KHUMBAKA', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_32', sailNumber: 'HUN 57', helmName: 'Ferenc Kis-Szölgyémi', crewNames: ["Károly Vezér","Farkas Litkey"], country: 'HUN', club: 'AMVK', className: 'Dragon', boatName: 'HANNI', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_33', sailNumber: 'GER 54', helmName: 'Wolfgang Koehnk', crewNames: ["Rasmus Nielsen","Matthias Grau"], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Jaya', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_34', sailNumber: 'GER 1271', helmName: 'Alexander Kudlich', crewNames: ["Robert Stanjek","Philipp Blinn"], country: 'GER', club: 'VSAW', className: 'Dragon', boatName: 'Teixl', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_35', sailNumber: 'NOR 293', helmName: 'Claus Landmark', crewNames: ["Lars Even Nilsen","Iver Waalen","Lene Havrevold"], country: 'NOR', club: 'Royal Norwegian Yacht Club', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_36', sailNumber: 'UAE 58', helmName: 'Jeroen Leenen', crewNames: [], country: 'UAE', club: 'DOSC', className: 'Dragon', boatName: 'Desert Storm', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_37', sailNumber: 'HKG 37', helmName: 'Chiu Wai Tony Leung', crewNames: [], country: 'HKG', club: '', className: 'Dragon', boatName: 'TBC', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_38', sailNumber: 'HKG 38', helmName: 'Patrick Li', crewNames: ["Ke Yin Tan","Felicia Leung","Nick Sin"], country: 'HKG', club: '', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_39', sailNumber: 'GER 62', helmName: 'Stephan Link', crewNames: ["Frank Butzmann","Ingo Borkowski"], country: 'GER', club: 'BYC', className: 'Dragon', boatName: 'Desert Holly', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_40', sailNumber: 'AUS 191', helmName: 'David Lynn', crewNames: [], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Relentless', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_41', sailNumber: 'AUS 222', helmName: 'Richard Lynn', crewNames: ["Ethan Prieto-Low","Adam Brenz-Verca"], country: 'AUS', club: 'RFBYC', className: 'Dragon', boatName: 'Gordon', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_42', sailNumber: 'GBR 825', helmName: 'James Mansell', crewNames: ["Eric Zon","Paul Bennett"], country: 'GBR', club: 'Cowes Corinthians Yacht Club', className: 'Dragon', boatName: 'Anarchy', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_43', sailNumber: 'IRL 232', helmName: 'Jamie McWilliam', crewNames: [], country: 'IRL', club: 'RHKYC', className: 'Dragon', boatName: 'Lalalam', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_44', sailNumber: 'JPN 52', helmName: 'Daisuke Yasuda', crewNames: ["Takeshi Morita","Keisuke Kushida"], country: 'JPN', club: 'KANSAI YACHT CLUB', className: 'Dragon', boatName: 'LOTUS', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_45', sailNumber: 'GER 45', helmName: 'Dirk Neukirchen', crewNames: ["Lars Hendriksen","George Leonchuk"], country: 'GER', club: '', className: 'Dragon', boatName: 'Flotter Dreier', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_46', sailNumber: 'SUI 334', helmName: 'Anatol Obolensky', crewNames: ["Michael Obolensky","TBA TBA"], country: 'SUI', club: 'KSV / MYC', className: 'Dragon', boatName: 'KISMET', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_47', sailNumber: 'SUI 313', helmName: 'Dirk Oldenburg', crewNames: [], country: 'SUI', club: 'SNST', className: 'Dragon', boatName: 'FREE', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_48', sailNumber: 'GER 1263', helmName: 'Christopher Opielok', crewNames: [], country: 'GER', club: 'RHKYC RORC NRV', className: 'Dragon', boatName: 'Rockall', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_49', sailNumber: 'DEN 49', helmName: 'Bo Sejr Johansen', crewNames: ["Theis Palm","Kasper Harsberg"], country: 'DEN', club: '', className: 'Dragon', boatName: 'Deja Vu ver. 3.0', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_50', sailNumber: 'HKG 8', helmName: 'Victor Pang', crewNames: [], country: 'HKG', club: 'Royal Hong Kong Yacht Club', className: 'Dragon', boatName: 'Kam Loong', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_51', sailNumber: 'AUT 358', helmName: 'Claas Von Thülen', crewNames: ["Michael Lipp","Leo Pilgerstorfer"], country: 'AUT', club: 'ASC, UYCAs, DTYC', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_52', sailNumber: 'GER 16', helmName: 'Dirk Pramann', crewNames: ["Michael Koch","Kilian Weise"], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Ingrid', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_53', sailNumber: 'SWE 416', helmName: 'Martin Pålsson', crewNames: [], country: 'SWE', club: 'GKSS', className: 'Dragon', boatName: 'Nono', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_54', sailNumber: 'EST TBD', helmName: 'Sander Põld', crewNames: [], country: 'EST', club: 'Kalev Yacht Club', className: 'Dragon', boatName: 'Roosi', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_55', sailNumber: 'HUN 60', helmName: 'ISTVÁN SZŰCS', crewNames: ["DR.PÉTER SZŰCS","DR.GÁBOR GYULAI"], country: 'HUN', club: 'Hungarian Dragon Association', className: 'Dragon', boatName: 'CARPE DIEM', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_56', sailNumber: 'JPN TBD', helmName: 'Akira Sawada', crewNames: [], country: 'JPN', club: 'KANSAI YACHT CLUB', className: 'Dragon', boatName: 'FALCO', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_57', sailNumber: 'BEL 79', helmName: 'Bert Schandevyl', crewNames: ["Pim Peters","Dries Van Den Abbeele"], country: 'BEL', club: 'RYCB', className: 'Dragon', boatName: 'Corso', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_58', sailNumber: 'GER 1223', helmName: 'Axel Schulz', crewNames: ["Mario Kühl","Daniel Bauer"], country: 'GER', club: 'VsAW / SCE', className: 'Dragon', boatName: 'Blue Defender', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_59', sailNumber: 'SWE 800', helmName: 'Jan Secher', crewNames: ["Gerard Mitchell","Richard Sydenham"], country: 'SWE', club: 'Marstrands Segelsällskap', className: 'Dragon', boatName: 'Miss Behavior', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_60', sailNumber: 'GER 1143', helmName: 'Christian Seegers', crewNames: ["Jan Maiwald","Daniel Paysen"], country: 'GER', club: 'NRV', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_61', sailNumber: 'JPN 54', helmName: 'Takeshi Suzuki', crewNames: ["Nobuo Fukuzawa","Hiroki Maki","Shunjirou Sano"], country: 'JPN', club: 'Odakyu Yacht Club', className: 'Dragon', boatName: 'Brilliance', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_62', sailNumber: 'USA 325', helmName: 'William Swigart', crewNames: ["David Caesar","Arthur Anosov"], country: 'USA', club: 'Newport Harbor YC / RHKYC', className: 'Dragon', boatName: 'Magic', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_63', sailNumber: 'JPN 60', helmName: 'HIROAKI TAMAE', crewNames: ["TOMONORI NODA","KOICHI TSUTSUMI","NAOTAKA OTA"], country: 'JPN', club: 'KANSAI YACHT CLUB', className: 'Dragon', boatName: 'MART SPIRIT', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_64', sailNumber: 'GER 11', helmName: 'Christoph Toepfer', crewNames: ["Markus Koy","Diego Negri"], country: 'GER', club: 'Norddeutscher Regatta Verein', className: 'Dragon', boatName: 'Aurora', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_65', sailNumber: 'GBR 852', helmName: 'David Tabb', crewNames: [], country: 'GBR', club: 'Parkstone yacht club', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_66', sailNumber: 'EST 19', helmName: 'Rene Treifeldt', crewNames: [], country: 'EST', club: 'Kalev Yacht Club', className: 'Dragon', boatName: 'GUSTL XL', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_67', sailNumber: 'BEL 82', helmName: 'Xavier Vanneste', crewNames: [], country: 'BEL', club: 'Royal North Sea Yacht Club', className: 'Dragon', boatName: 'Herbie', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_68', sailNumber: 'SWE 345', helmName: 'Jacob Wallenberg', crewNames: [], country: 'SWE', club: 'Royal Swedish Yacht Club, KSSS', className: 'Dragon', boatName: 'MING', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_69', sailNumber: 'GER 44', helmName: 'Axel Wilde', crewNames: ["Christof Wieland"], country: 'GER', club: 'YCRE', className: 'Dragon', boatName: 'SMILLA', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_70', sailNumber: 'GBR 816', helmName: 'Glynn Williams', crewNames: ["Phil Taylor","Tom Hartridge"], country: 'GBR', club: 'Royal Yacht Squadron', className: 'Dragon', boatName: 'Dreki', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_71', sailNumber: 'GER 6', helmName: 'Oliver Witte', crewNames: ["Fenja Valentien","Lika Valentien"], country: 'GER', club: 'Berliner Yacht Club', className: 'Dragon', boatName: 'Wiwi', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_72', sailNumber: 'CHN 72', helmName: 'Lijia Xu', crewNames: [], country: 'CHN', club: '', className: 'Dragon', boatName: 'TBC', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_73', sailNumber: 'HKG TBD', helmName: 'Rita Chi', crewNames: ["Han Yau"], country: 'HKG', club: 'Rhkyc', className: 'Dragon', boatName: 'Phyloong II', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_74', sailNumber: 'POR 90', helmName: 'Michael Zankel', crewNames: ["Diogo Peirera","Joao Matos Rosa"], country: 'POR', club: 'Club naval cascais', className: 'Dragon', boatName: 'EASY', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_75', sailNumber: 'GER 1146', helmName: 'Ferdinand Ziegelmayer', crewNames: ["Peter Eckhardt","TBN TBN"], country: 'GER', club: 'Norddeutscher Regatta Verein', className: 'Dragon', boatName: 'Dörte', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_76', sailNumber: 'NED 309', helmName: 'Guus de Groot', crewNames: ["Hay Winters","Richard van Rij"], country: 'NED', club: 'Kwv de Kaag', className: 'Dragon', boatName: 'Furie', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_77', sailNumber: 'FRA 77', helmName: 'Anne du Parc', crewNames: [], country: 'FRA', club: '', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_78', sailNumber: 'HKG 59', helmName: 'Abraham van Olphen', crewNames: ["Glenn Cooke","Kevin Denney"], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'DRAGONFLY', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'w27_79', sailNumber: 'AUT 77', helmName: 'Nikolai von Stempel', crewNames: ["Maximilian Springer"], country: 'AUT', club: 'Royal Hong Kong Yacht Club', className: 'Dragon', boatName: 'Primavera', registrationStatus: 'confirmed', entryDate: '2026-02-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
  ],
};

export class ClubSpotService {
  private config: ClubSpotConfig;
  private cache: Map<string, Competitor[]> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private dataSourceInfo: Map<string, DataSourceInfo> = new Map();

  constructor(config?: Partial<ClubSpotConfig>) {
    this.config = {
      baseUrl: externalUrls.clubSpot.baseUrl || 'https://theclubspot.com',
      cacheDuration: 24 * 60 * 60 * 1000, // 24 hours - entry lists don't change often
      useDemoData: false, // Default to live data
      cloudFunctionUrl: externalUrls.cloudFunctions?.scrapeClubSpot || '',
      ...config
    };

    // Pre-populate cache with bundled data
    for (const [regattaId, entrants] of Object.entries(BUNDLED_ENTRANTS)) {
      if (entrants.length > 0) {
        const cacheKey = `${regattaId}_bundled`;
        this.cache.set(cacheKey, entrants);
        this.dataSourceInfo.set(cacheKey, {
          isLive: false,
          lastFetched: new Date(),
          source: 'cache'
        });
      }
    }
  }

  /**
   * Get bundled entrants for immediate display
   */
  getBundledEntrants(regattaId: string): Competitor[] {
    return BUNDLED_ENTRANTS[regattaId] || [];
  }

  /**
   * Fetch entrants for a specific regatta
   * @param regattaId - ClubSpot regatta ID (e.g., 'KGHzb6NBqO')
   * @param eventId - Internal event ID for context
   * @param forceRefresh - Skip cache and fetch fresh data
   */
  async getEntrants(regattaId: string, eventId: string, forceRefresh = false): Promise<Competitor[]> {

    const cacheKey = `${regattaId}_${eventId}`;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && this.isCacheValid(cacheKey)) {
        const cachedInfo = this.dataSourceInfo.get(cacheKey);
        if (cachedInfo) {
          this.dataSourceInfo.set(cacheKey, { ...cachedInfo, source: 'cache' });
        }
        return this.cache.get(cacheKey) || [];
      }

      let entrants: Competitor[];

      if (this.config.useDemoData) {
        entrants = this.generateDemoEntrants(eventId);
        this.dataSourceInfo.set(cacheKey, {
          isLive: false,
          lastFetched: new Date(),
          source: 'demo'
        });
      } else {
        try {
          entrants = await this.fetchRealEntrants(regattaId);
          this.dataSourceInfo.set(cacheKey, {
            isLive: true,
            lastFetched: new Date(),
            source: 'live'
          });
        } catch (fetchError) {

          // Try to use cached data first
          if (this.cache.has(cacheKey)) {
            const cachedEntrants = this.cache.get(cacheKey) || [];
            this.dataSourceInfo.set(cacheKey, {
              isLive: false,
              lastFetched: this.lastFetchTime.get(cacheKey) ? new Date(this.lastFetchTime.get(cacheKey)!) : null,
              source: 'cache',
              error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            });
            return cachedEntrants;
          }

          // Fall back to demo data
          entrants = this.generateDemoEntrants(eventId);
          this.dataSourceInfo.set(cacheKey, {
            isLive: false,
            lastFetched: new Date(),
            source: 'demo',
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
          });
        }
      }

      // Cache the results
      this.cache.set(cacheKey, entrants);
      this.lastFetchTime.set(cacheKey, Date.now());

      return entrants;
    } catch (error) {
      this.dataSourceInfo.set(cacheKey, {
        isLive: false,
        lastFetched: new Date(),
        source: 'demo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return demo data as fallback
      return this.generateDemoEntrants(eventId);
    }
  }

  /**
   * Get data source information for a regatta
   */
  getDataSourceInfo(regattaId: string, eventId: string): DataSourceInfo | null {
    const cacheKey = `${regattaId}_${eventId}`;
    return this.dataSourceInfo.get(cacheKey) || null;
  }

  /**
   * Fetch real entrants from ClubSpot via Firebase Cloud Function
   */
  private async fetchRealEntrants(regattaId: string): Promise<Competitor[]> {
    const functionUrl = this.config.cloudFunctionUrl;

    if (!functionUrl) {
      throw new Error('Cloud Function URL not configured');
    }


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${functionUrl}?regattaId=${regattaId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Function failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Cloud Function returned unsuccessful response');
      }


      // Transform and validate the response
      const entrants = this.transformCloudFunctionResponse(data.entrants || []);

      return entrants;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - ClubSpot service did not respond in time');
      }

      throw error;
    }
  }

  /**
   * Transform Cloud Function response to Competitor format
   */
  private transformCloudFunctionResponse(entrants: any[]): Competitor[] {
    return entrants.map((entrant, index) => ({
      id: entrant.id || `clubspot_${index}`,
      sailNumber: entrant.sailNumber || '',
      helmName: entrant.helmName || '',
      crewNames: entrant.crewNames || [],
      country: entrant.country || '',
      club: entrant.club || '',
      className: entrant.className || 'Dragon',
      boatName: entrant.boatName || '',
      registrationStatus: this.normalizeRegistrationStatus(entrant.registrationStatus),
      entryDate: entrant.entryDate || new Date().toISOString(),
      paymentStatus: this.normalizePaymentStatus(entrant.paymentStatus),
      documentsSubmitted: entrant.documentsSubmitted || false,
      measurementCompleted: entrant.measurementCompleted || false
    }));
  }

  /**
   * Normalize registration status to valid Competitor status
   */
  private normalizeRegistrationStatus(status: string | undefined): Competitor['registrationStatus'] {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus.includes('confirmed') || normalizedStatus.includes('approved')) {
      return 'confirmed';
    }
    if (normalizedStatus.includes('paid')) {
      return 'paid';
    }
    if (normalizedStatus.includes('incomplete')) {
      return 'incomplete';
    }
    return 'pending';
  }

  /**
   * Normalize payment status to valid Competitor payment status
   */
  private normalizePaymentStatus(status: string | undefined): Competitor['paymentStatus'] {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus.includes('paid') || normalizedStatus.includes('complete')) {
      return 'paid';
    }
    if (normalizedStatus.includes('overdue')) {
      return 'overdue';
    }
    return 'pending';
  }

  /**
   * Generate demo entrants for testing
   */
  private generateDemoEntrants(eventId: string): Competitor[] {
    const competitors: Competitor[] = [];

    // Different data sets for different events
    const isWorldChampionship = eventId.includes('world');
    const entryCount = isWorldChampionship ? 87 : 45;

    const countries = ['HKG', 'AUS', 'GBR', 'USA', 'NZL', 'SIN', 'JPN', 'GER', 'ITA', 'FRA', 'NED', 'ESP', 'CAN', 'DEN', 'SWE'];
    const clubs = [
      'Royal Hong Kong YC',
      'Royal Sydney YS',
      'Royal Yacht Squadron',
      'San Diego YC',
      'Royal NZ YS',
      'Singapore SC',
      'Hayama Marina YC',
      'Hamburger SV',
      'YC Italiano',
      'YC de France',
      'Royal Netherlands YC',
      'Real Club Náutico Barcelona',
      'Royal Canadian YC',
      'Royal Danish YC',
      'GKSS'
    ];

    const helmNames = [
      'John Smith', 'Sarah Chen', 'Michael Wong', 'Emma Thompson', 'David Lee',
      'Sophie Martin', 'James Wilson', 'Olivia Brown', 'Robert Taylor', 'Emily Davis',
      'William Anderson', 'Charlotte Thomas', 'Daniel White', 'Isabella Garcia', 'Matthew Martinez',
      'Amelia Robinson', 'Andrew Clark', 'Sophia Rodriguez', 'Christopher Lewis', 'Mia Walker'
    ];

    const boatNames = [
      'Dragon\'s Breath', 'Sea Serpent', 'Flying Dutchman', 'Wind Dancer', 'Storm Rider',
      'Ocean Spirit', 'Blue Horizon', 'Silver Arrow', 'Golden Dragon', 'Phoenix Rising',
      'Tsunami', 'White Lightning', 'Thunderbolt', 'Sea Wolf', 'Victory',
      'Endeavour', 'Quest', 'Maverick', 'Intrepid', 'Valiant'
    ];

    for (let i = 1; i <= entryCount; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const club = clubs[Math.floor(Math.random() * clubs.length)];
      const helmName = helmNames[Math.floor(Math.random() * helmNames.length)];
      const boatName = boatNames[Math.floor(Math.random() * boatNames.length)];

      // Generate realistic registration statuses
      let registrationStatus: Competitor['registrationStatus'];
      const rand = Math.random();
      if (rand < 0.70) {
        registrationStatus = 'confirmed';
      } else if (rand < 0.85) {
        registrationStatus = 'paid';
      } else if (rand < 0.95) {
        registrationStatus = 'pending';
      } else {
        registrationStatus = 'incomplete';
      }

      competitors.push({
        id: `clubspot_${eventId}_${i}`,
        sailNumber: `${country} ${String(i).padStart(3, '0')}`,
        helmName: `${helmName} (${boatName})`,
        crewNames: [
          `Crew ${String.fromCharCode(65 + (i % 26))} ${i}`,
          `Crew ${String.fromCharCode(66 + (i % 26))} ${i}`
        ],
        country,
        club,
        className: 'Dragon',
        registrationStatus,
        entryDate: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(), // Random date in last 90 days
        paymentStatus: Math.random() > 0.1 ? 'paid' : 'pending',
        documentsSubmitted: Math.random() > 0.15,
        measurementCompleted: Math.random() > 0.2
      });
    }

    // Sort by country then sail number for better UX
    return competitors.sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.sailNumber.localeCompare(b.sailNumber);
    });
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetchTime.get(key);
    if (!lastFetch) return false;

    return (Date.now() - lastFetch) < this.config.cacheDuration;
  }

  /**
   * Clear cache for a specific regatta or all
   */
  clearCache(regattaId?: string): void {
    if (regattaId) {
      // Clear specific regatta cache
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(regattaId));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.lastFetchTime.delete(key);
      });
    } else {
      // Clear all cache
      this.cache.clear();
      this.lastFetchTime.clear();
    }
  }

  /**
   * Toggle between demo and real data
   */
  setUseDemoData(useDemoData: boolean): void {
    this.config.useDemoData = useDemoData;
    this.clearCache();
  }

  /**
   * Get service configuration
   */
  getConfig(): ClubSpotConfig {
    return { ...this.config };
  }

  /**
   * Check health/connectivity of the ClubSpot service
   * Returns status indicating if the service is reachable and functional
   */
  async checkHealth(): Promise<{ isHealthy: boolean; source: string; message?: string }> {
    // If using demo data mode, always report as healthy
    if (this.config.useDemoData) {
      return { isHealthy: true, source: 'demo', message: 'Using demo data mode' };
    }

    // Check if we have bundled data available (always counts as healthy)
    const hasBundledData = Object.keys(BUNDLED_ENTRANTS).length > 0;
    if (hasBundledData) {
      // Check if cloud function is configured
      if (!this.config.cloudFunctionUrl) {
        return { isHealthy: true, source: 'bundled', message: 'Using bundled data' };
      }

      // Try a quick health check to the cloud function
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(this.config.cloudFunctionUrl, {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 405) { // 405 = Method Not Allowed is fine for HEAD
          return { isHealthy: true, source: 'live', message: 'Cloud function reachable' };
        }

        // Cloud function not reachable but we have bundled data
        return { isHealthy: true, source: 'bundled', message: 'Using bundled data (cloud function unavailable)' };
      } catch {
        // Network error but bundled data available
        return { isHealthy: true, source: 'bundled', message: 'Using bundled data (cloud function unavailable)' };
      }
    }

    // No bundled data and no cloud function
    return { isHealthy: false, source: 'none', message: 'No data source available' };
  }
}

// Export singleton instance for convenience
export const clubSpotService = new ClubSpotService();

export default ClubSpotService;
