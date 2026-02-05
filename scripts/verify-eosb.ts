import { calculateUAE_EOSB } from "../lib/logic/eosb";

const salary = 10000; // Example Basic Salary
const cases = [
    { years: 1, expected: 1 * 21 * (salary / 30) },
    { years: 4, expected: 4 * 21 * (salary / 30) },
    { years: 5, expected: 5 * 21 * (salary / 30) },
    { years: 6, expected: (5 * 21 * (salary / 30)) + (1 * 30 * (salary / 30)) }, // 5 years @ 21 days + 1 year @ 30 days
];

console.log("Verifying UAE EOSB Logic (Basic Salary: " + salary + ")...");

let allPass = true;

cases.forEach((c, i) => {
    const result = calculateUAE_EOSB(salary, c.years);
    const expected = Math.floor(c.expected);
    const pass = result === expected;

    if (!pass) allPass = false;

    console.log(`Case ${i + 1} (Years: ${c.years}): ${pass ? "✅ PASS" : "❌ FAIL"} (Got ${result}, Expected ${expected})`);
});

if (allPass) {
    console.log("\nAll EOSB checks passed.");
} else {
    console.error("\nSome EOSB checks failed.");
    process.exit(1);
}
