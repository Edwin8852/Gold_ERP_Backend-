class InterestService {
  /**
   * Formula: SI = (P × R × T) / 100
   * T is duration in months, so we divide by 12 for annual rate
   */
  calculateInterest(principal, annualRate, durationMonths) {
    const timeInYears = durationMonths / 12;
    const totalInterest = (principal * annualRate * timeInYears) / 100;
    const monthlyInterest = totalInterest / durationMonths;
    const totalRepayment = principal + totalInterest;

    return {
      principal,
      annualRate,
      durationMonths,
      monthlyInterest,
      totalInterest,
      totalRepayment
    };
  }

  generateRepaymentSchedule(principal, annualRate, durationMonths) {
    const schedule = [];
    const monthlyInterest = (principal * annualRate) / (100 * 12);
    
    for (let i = 1; i <= durationMonths; i++) {
      schedule.push({
        month: i,
        interestAmount: monthlyInterest,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + i))
      });
    }
    
    return schedule;
  }
}

module.exports = new InterestService();
