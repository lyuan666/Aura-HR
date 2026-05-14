export const CLIENT_RECOMMENDATION_CANDIDATE_FIELDS = {
  publicShare: ['name', 'skills', 'education', 'yearsOfExperience'],
  authenticatedClient: [
    'displayName',
    'currentTitle',
    'currentCompany',
    'totalYears',
    'degree',
    'school',
    'skills',
    'workExperiencesSummary',
    'projectExperiencesSummary',
  ],
  hidden: ['phone', 'email', 'wechat', 'resumeUrl', 'resumeText'],
} as const;
