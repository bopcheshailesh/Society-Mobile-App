
export enum Role {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  mobileNumber: string;
  role: Role;
  totalContribution: number;
  currentLoanBalance: number;
  totalInterestPaid: number; // Cumulative interest paid to society
  joinedDate: string;
}

export interface SocietyStats {
  totalMembers: number;
  totalFund: number;
  totalLoaned: number;
  availableBalance: number;
  monthlyContributionAmount: number;
  interestRate: number; // monthly %
}

export interface LoanRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: TransactionStatus;
  requestedDate: string;
  repaymentPeriod?: number; // months (optional for info)
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  month: string;
  year: number;
  contribution: number;
  principalRepayment: number;
  interestPaid: number;
  totalPaid: number;
  status: TransactionStatus;
  date: string;
}

export interface Loan {
  id: string;
  userId: string;
  originalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  startDate: string;
}
