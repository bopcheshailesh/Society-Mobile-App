
/**
 * Calculations for the Society Finance App
 */

export const MONTHLY_CONTRIBUTION = 2000;
export const MONTHLY_INTEREST_RATE = 0.01; // 1%

export interface MonthlyPayable {
  contribution: number;
  interest: number;
  principalSuggestion: number;
  totalMin: number;
}

export interface ForecastMonth {
  name: string;
  projectedBalance: number;
  estimatedInflow: number;
  breakdown: {
    contributions: number;
    interest: number;
  }
}

/**
 * Calculates interest based on outstanding principal.
 * Rule: 1% of outstanding principal.
 */
export const calculateInterest = (principal: number): number => {
  return Math.round(principal * MONTHLY_INTEREST_RATE);
};

/**
 * Validates loan eligibility.
 */
export const getMaxLoanAmount = (availableBalance: number): number => {
  // Conservative rule: Don't lend more than 80% of available pool at once
  return Math.floor(availableBalance * 0.8);
};

/**
 * Formatter for Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Mock current month for logic
 */
export const getCurrentMonthYear = () => {
  const d = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return {
    month: months[d.getMonth()],
    year: d.getFullYear()
  };
};

/**
 * Generates a 3-month forecast of society funds
 */
export const generateForecast = (
  availableBalance: number,
  totalMembers: number,
  totalLoaned: number
): ForecastMonth[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  
  const forecasts: ForecastMonth[] = [];
  let runningBalance = availableBalance;

  for (let i = 1; i <= 3; i++) {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthlyCont = totalMembers * MONTHLY_CONTRIBUTION;
    const monthlyInt = totalLoaned * MONTHLY_INTEREST_RATE;
    const totalInflow = monthlyCont + monthlyInt;
    
    runningBalance += totalInflow;
    
    forecasts.push({
      name: months[monthIdx],
      projectedBalance: runningBalance,
      estimatedInflow: totalInflow,
      breakdown: {
        contributions: monthlyCont,
        interest: monthlyInt
      }
    });
  }
  
  return forecasts;
};
