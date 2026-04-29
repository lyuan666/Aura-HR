import { BadRequestException } from '@nestjs/common';

export interface StateMachineConfig {
  [key: string]: string[];
}

export class StateMachine {
  constructor(private readonly config: StateMachineConfig) {}

  validateTransition(from: string, to: string) {
    if (from === to) return; // Allow same state "transition" if needed, or skip

    const allowed = this.config[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  isTerminal(state: string) {
    return (this.config[state] || []).length === 0;
  }
}

export const RECOMMENDATION_TRANSITIONS: StateMachineConfig = {
  pending: ['submitted', 'withdrawn'],
  submitted: ['reviewing', 'withdrawn'],
  reviewing: ['interview_scheduled', 'rejected', 'withdrawn'],
  interview_scheduled: ['interviewed', 'withdrawn'],
  interviewed: ['offer_sent', 'rejected', 'withdrawn'],
  offer_sent: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export const CANDIDATE_TRANSITIONS: StateMachineConfig = {
  new: ['active', 'inactive'],
  active: ['in_process', 'inactive'],
  in_process: ['offered', 'active', 'inactive'],
  offered: ['placed', 'inactive'],
  placed: [],
  inactive: ['new', 'active'],
};

export const JOB_TRANSITIONS: StateMachineConfig = {
  pending: ['matching', 'cancelled'],
  matching: ['recommending', 'cancelled'],
  recommending: ['interviewing', 'closed', 'cancelled'],
  interviewing: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

export const ENTERPRISE_TRANSITIONS: StateMachineConfig = {
  potential: ['following', 'churned'],
  following: ['negotiating', 'churned'],
  negotiating: ['signed', 'churned'],
  signed: ['churned'],
  churned: ['potential'],
};

export const CONTRACT_TRANSITIONS: StateMachineConfig = {
  draft: ['pending_approval', 'terminated'],
  pending_approval: ['active', 'draft', 'terminated'],
  active: ['completed', 'terminated'],
  completed: [],
  terminated: [],
};

export const INVOICE_TRANSITIONS: StateMachineConfig = {
  pending: ['issued', 'cancelled'],
  issued: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: [],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
};

export const GUARANTEE_TRANSITIONS: StateMachineConfig = {
  tracking: ['finished', 'failed'],
  finished: [],
  failed: [],
};
