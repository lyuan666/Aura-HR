export interface ClientCandidateProfile {
  displayName: string;
  currentTitle?: string;
  currentCompany?: string;
  totalYears?: number;
  degree?: string;
  school?: string;
  skills?: string[];
  workExperiencesSummary?: Array<Record<string, unknown>>;
  projectExperiencesSummary?: Array<Record<string, unknown>>;
}

export interface ClientRecommendation {
  id: string;
  status: string;
  matchScore?: number;
  aiAnalysis?: {
    highlights?: string[];
    risks?: string[];
    interviewSuggestions?: string[];
    conclusion?: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  job?: {
    id: string;
    title: string;
    enterpriseId: string;
  };
  candidate: ClientCandidateProfile;
}

export interface ClientPortalContext {
  enterprise: {
    id: string;
    name: string;
    industry?: string;
    scale?: string;
    status?: string;
  };
  contracts: Array<{
    id: string;
    contractNo: string;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
    modules: string[];
  }>;
  enabledModules: string[];
  stats: {
    totalRecommendations: number;
    submitted: number;
    reviewing: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    department?: string;
    status: string;
    headcount?: number;
    location?: string;
  }>;
}
