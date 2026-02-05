/**
 * Calculates the UAE End-of-Service Benefit (EOSB)
 * Based on the standard rule:
 * - 21 days basic salary for each of the first 5 years.
 * - 30 days basic salary for each additional year.
 *
 * @param basicSalaryMonthly - The monthly basic salary in the smallest currency unit (e.g., fils/cents) to maintain integer precision.
 * @param yearsOfService - Total years of service (can be fractional).
 * @returns The estimated EOSB amount in the same currency unit.
 */
export function calculateUAE_EOSB(basicSalaryMonthly: number, yearsOfService: number): number {
    if (yearsOfService < 1) {
        return 0;
    }

    const dailySalary = basicSalaryMonthly / 30;
    let gratuity = 0;

    if (yearsOfService <= 5) {
        gratuity = yearsOfService * 21 * dailySalary;
    } else {
        // First 5 years at 21 days
        gratuity += 5 * 21 * dailySalary;
        // Subsequent years at 30 days
        const additionalYears = yearsOfService - 5;
        gratuity += additionalYears * 30 * dailySalary;
    }

    // Cap at 2 years total salary (standard UAE labor law cap, though not strictly requested, it's good practice)
    // const maxGratuity = basicSalaryMonthly * 24;
    // return Math.min(Math.floor(gratuity), maxGratuity);

    // Returning strict calculation as per prompt request "21 days for <5 years, 30 days for >5 years"
    // Using Math.floor to ensure integer result for currency
    return Math.floor(gratuity);
}
