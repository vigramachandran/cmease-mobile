export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  credential: string;
  npi: string;
  specialty: string;
  licenseStates: string[];
  createdAt: string;
}

export interface NPIData {
  npi: string;
  firstName: string;
  lastName: string;
  credential: string;
  specialty: string;
  taxonomyCode: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  phone?: string;
}

export interface TopicStatus {
  topic: string;
  hoursRequired: number;
  hoursCompleted: number;
  completed: boolean;
}

export interface StateCompliance {
  state: string;
  creditsRequired: number;
  creditsEarned: number;
  percentage: number;
  renewalDate: string;
  mandatoryTopics: TopicStatus[];
}

export interface ComplianceStatus {
  overallPercentage: number;
  totalCreditsRequired: number;
  totalCreditsEarned: number;
  states: StateCompliance[];
}

export interface Credit {
  id: string;
  title: string;
  provider: string;
  category: string;
  hours: number;
  completionDate: string;
  certificatePath?: string;
  source: string;
  parseStatus: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  credits: number;
  durationMinutes: number;
  cost: string;
  url: string;
  format: string;
  topics: string[];
  specialty: string;
}

export interface ComplianceGap {
  state: string;
  generalCreditsRemaining: number;
  mandatoryTopics: { topic: string; hoursNeeded: number }[];
}

export interface PlaylistItem {
  order: number;
  courseId: string;
  title: string;
  provider: string;
  credits: number;
  durationMinutes: number;
  efficiencyScore: number;
  cost: string;
  url: string;
  fillsRequirements: string[];
  format: string;
  mandatory: boolean;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface PlaylistSummary {
  totalCourses: number;
  totalDurationHours: number;
  totalCredits: number;
  estimatedCost: string;
  creditsPerHourAverage: number;
}

export interface Playlist {
  id?: string;
  playlist: PlaylistItem[];
  summary: PlaylistSummary;
}

export interface ParseResult {
  title?: string;
  provider?: string;
  credits?: number;
  completionDate?: string;
  confidence: number;
}

export interface ApiError {
  error: string;
  status?: number;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

// Phase 1B: Credential Vault + Player

export interface ProviderConfig {
  name: string;
  loginUrl: string;
  homeUrl: string;
  icon: string;
  color: string;
  estimatedSessionDays: number;
  loginSuccessIndicators: string[];
}

export interface ProviderSession {
  domain: string;
  name: string;
  connected: boolean;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
}

export interface PlayerState {
  playlistId: string;
  currentIndex: number;
  timeOnCourse: number;
  isPaused: boolean;
  isLoading: boolean;
}

export interface UserLicense {
  id: string;
  state: string;
  licenseNumber?: string;
  expirationDate: string; // YYYY-MM-DD
  licenseType?: string;
}
