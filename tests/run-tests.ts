import assert from "node:assert/strict";

import { answerDocumentQuestion } from "../src/lib/document-intelligence.ts";
import { createFinancialLesson } from "../src/lib/financial-education.ts";
import { recommendGovernmentSchemes } from "../src/lib/government-schemes.ts";
import { analyzeOmbudsmanCase } from "../src/lib/ombudsman.ts";
import { analyzeScamText } from "../src/lib/scam-intelligence.ts";
import { parseVoiceTransaction } from "../src/lib/voice-transaction-parser.ts";

const expense = parseVoiceTransaction("Hey Boom I spent 500 rupees on groceries");
assert.equal(expense.type, "expense");
assert.equal(expense.amount, 500);
assert.equal(expense.category, "groceries");

const income = parseVoiceTransaction("I received 1000 salary today");
assert.equal(income.type, "income");
assert.equal(income.amount, 1000);
assert.equal(income.category, "salary");

const scam = analyzeScamText("Urgent KYC expired click http://fake.xyz and share OTP");
assert.equal(scam.riskLevel, "high");
assert.ok(scam.indicators.length >= 3);

const lesson = createFinancialLesson("Explain SIP", {
  occupation: "delivery driver"
});
assert.equal(lesson.concept, "sip");
assert.ok(lesson.analogy.toLowerCase().includes("daily earnings"));

const schemes = recommendGovernmentSchemes({
  dependents: 2,
  incomeType: "freelance",
  occupation: "delivery driver"
});
assert.ok(schemes.some((scheme) => scheme.name.includes("Suraksha")));

const ombudsman = analyzeOmbudsmanCase({
  documentText:
    "The bank applied unexpected charges without notice and added a penalty fee after a failed transaction refund was not credited.",
  issueType: "bank_fee",
  title: "Unexpected fee"
});
assert.ok(ombudsman.riskScore > 0);
assert.ok(ombudsman.complaintDraft.includes("Requested resolution"));

const documentAnswer = await answerDocumentQuestion(
  "Loan agreement: prepayment penalty is 4 percent. EMI bounce charge is 500 rupees. Insurance premium is optional.",
  "What penalty is mentioned?"
);
assert.ok(documentAnswer.answer.toLowerCase().includes("penalty"));

const creditAnswer = await answerDocumentQuestion(
  "Personal loan agreement: missed EMI payments, overdue installments, default, and EMI bounce may be reported to credit bureaus including CIBIL.",
  "Will my credit score be affected?"
);
assert.ok(creditAnswer.answer.toLowerCase().includes("credit score"));
assert.ok(!/\bif you\.?$/i.test(creditAnswer.answer.trim()));

console.log("All tests passed.");
