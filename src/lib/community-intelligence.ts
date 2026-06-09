export const communities = [
  "Farmers",
  "Gig Workers",
  "Students",
  "Teachers",
  "Small Businesses"
] as const;

export type CommunityName = (typeof communities)[number];

export type CommunityInsight = {
  positivePatterns: string[];
  negativePatterns: string[];
  recommendedActions: string[];
};

export const communityInsightMap: Record<CommunityName, CommunityInsight> = {
  Farmers: {
    positivePatterns: [
      "Seasonal income planning improves cash availability before sowing cycles.",
      "Bulk input purchases reduce repeated transport and market visit costs.",
      "Families with separate emergency cash handle crop-delay months with less debt."
    ],
    negativePatterns: [
      "Loan repayments cluster around harvest windows, creating high-pressure months.",
      "Untracked small input purchases make real crop costs harder to estimate.",
      "Insurance and subsidy paperwork is often started after deadlines are close."
    ],
    recommendedActions: [
      "Create a crop-cycle cash calendar before taking new credit.",
      "Keep a dedicated input-expense log for seeds, fertilizer, labor, and transport.",
      "Set reminders for insurance, subsidy, and repayment dates."
    ]
  },
  "Gig Workers": {
    positivePatterns: [
      "Weekly savings transfers work better than monthly leftovers.",
      "Fuel, phone, and platform costs are clearer when tracked as work expenses.",
      "Multiple earning platforms reduce disruption from one slow week."
    ],
    negativePatterns: [
      "Income volatility leads to missed bill dates after low-demand weeks.",
      "Vehicle maintenance is often paid from emergency savings.",
      "Instant loans are used most when tax and platform deductions are unclear."
    ],
    recommendedActions: [
      "Build a weekly baseline budget from the last 8 earning weeks.",
      "Keep a separate maintenance reserve for work equipment or vehicle costs.",
      "Review platform deductions before accepting new credit."
    ]
  },
  Students: {
    positivePatterns: [
      "Small recurring savings are easier when moved right after allowance or stipend.",
      "Shared subscriptions and group purchases reduce monthly leakage.",
      "Students who plan exam-month spending borrow less from friends."
    ],
    negativePatterns: [
      "Food delivery and transport costs rise sharply near deadlines.",
      "Buy-now-pay-later use hides the true monthly cost of gadgets and courses.",
      "Emergency funds are often mixed with daily spending accounts."
    ],
    recommendedActions: [
      "Use a weekly cap for food, transport, and subscriptions.",
      "Pause pay-later purchases until current dues are cleared.",
      "Keep a small emergency balance outside the main spending wallet."
    ]
  },
  Teachers: {
    positivePatterns: [
      "Salary-day allocation keeps school, home, and savings money separate.",
      "Recurring investments are more consistent than manual month-end deposits.",
      "Planned festival and school-term expenses reduce surprise borrowing."
    ],
    negativePatterns: [
      "Tuition or side-income cash is frequently mixed with household expenses.",
      "Annual insurance and fee payments create uneven cash-flow pressure.",
      "Professional course costs are delayed until promotions or evaluations."
    ],
    recommendedActions: [
      "Split salary-day money into bills, savings, learning, and flexible spending.",
      "Create sinking funds for annual premiums, fees, and festivals.",
      "Track side income separately before adding it to household spending."
    ]
  },
  "Small Businesses": {
    positivePatterns: [
      "Daily sales and expense closing improves cash visibility.",
      "Separate tax and inventory reserves reduce end-of-month stress.",
      "Businesses that follow receivables weekly recover dues faster."
    ],
    negativePatterns: [
      "Personal and business spends are mixed during low-sales periods.",
      "Inventory is restocked before slow-moving items are reviewed.",
      "Supplier credit hides margin pressure until repayment dates arrive."
    ],
    recommendedActions: [
      "Close each day with sales, expenses, receivables, and cash balance.",
      "Keep tax, inventory, and owner-withdrawal money in separate buckets.",
      "Review slow-moving stock before placing repeat orders."
    ]
  }
};

export function isCommunityName(value: unknown): value is CommunityName {
  return communities.includes(value as CommunityName);
}
