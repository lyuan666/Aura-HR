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
