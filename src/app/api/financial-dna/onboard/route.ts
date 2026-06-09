import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAOnboardingModel, FinancialDNAModel, UserModel } from "@/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, userId } = body;
    await connectToDatabase();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const appUser = await UserModel.findOne({ clerkId: userId });

    if (!appUser) {
      return NextResponse.json({ error: "User profile not found. Please refresh and try again." }, { status: 404 });
    }

    const appUserId = appUser._id;

    // find or create onboarding doc
    let onboard = await FinancialDNAOnboardingModel.findOne({ userId: appUserId });
    if (!onboard) {
      onboard = await FinancialDNAOnboardingModel.create({ userId: appUserId, answers: {}, step: 0 });
    }

    // state machine steps
    const steps = [
      "incomeType",
      "incomeAmount",
      "financialGoal",
      "emergencyCheck",
      "generate"
    ];

    let reply = "";

    if (onboard.completed) {
      reply = "You have already completed onboarding. You can view your Financial DNA on the dashboard.";
      return NextResponse.json({ reply });
    }

    const step = onboard.step ?? 0;

    if (step === 0) {
      // expecting income type
      const normalized = String(message || "").trim().toLowerCase();
      const allowed = ["salaried","business","freelance","student","homemaker","retired","other"];
      if (allowed.includes(normalized)) {
        onboard.answers.incomeType = normalized;
        onboard.step = 1;
        await onboard.save();
        reply = "Got it. What is your monthly income amount in numbers?";
      } else {
        reply = "Please answer with one of: salaried, business, freelance, student, homemaker, retired, other.";
      }
      return NextResponse.json({ reply, step: onboard.step });
    }

    if (step === 1) {
      const num = Number(String(message || "").replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num >= 0) {
        onboard.answers.incomeAmount = num;
        onboard.step = 2;
        await onboard.save();
        reply = "Thanks. Briefly, what is your main financial goal? (e.g., emergency fund, buy home, save for education)";
      } else {
        reply = "Please enter a numeric monthly income amount, like 25000.";
      }
      return NextResponse.json({ reply, step: onboard.step });
    }

    if (step === 2) {
      const text = String(message || "").trim();
      if (text.length < 2) {
        reply = "Please provide a short goal like: emergency fund, buy home, save for education.";
        return NextResponse.json({ reply, step: onboard.step });
      }

      onboard.answers.financialGoal = text;
      onboard.step = 3;
      await onboard.save();
      reply = "If an emergency were to happen tomorrow, would you have at least 1 month of expenses saved? (yes/no)";
      return NextResponse.json({ reply, step: onboard.step });
    }

    if (step === 3) {
      const normalized = String(message || "").trim().toLowerCase();
      const yes = ["yes","y","true","1","yeah","yep"];
      const no = ["no","n","false","0","nope","nah"];
      if (yes.includes(normalized)) {
        onboard.answers.emergency = true;
        onboard.step = 4;
        await onboard.save();
      } else if (no.includes(normalized)) {
        onboard.answers.emergency = false;
        onboard.step = 4;
        await onboard.save();
      } else {
        reply = "Please answer yes or no.";
        return NextResponse.json({ reply, step: onboard.step });
      }

      // now generate Financial DNA
      // simple generator using existing FinancialDNAModel logic
      const fdna = await FinancialDNAModel.findOneAndUpdate(
        { userId: appUserId },
        {
          userId: appUserId,
          occupation: appUser.firstName || "",
          incomeType: onboard.answers.incomeType || "other",
          monthlyIncome: onboard.answers.incomeAmount || 0,
          financialGoals: [onboard.answers.financialGoal || ""],
          dependents: 0,
          riskAppetite: onboard.answers.incomeAmount > 50000 ? "high" : "medium",
          summary: `Income type: ${onboard.answers.incomeType}, income: ${onboard.answers.incomeAmount}, goal: ${onboard.answers.financialGoal}`,
          riskProfile: onboard.answers.incomeAmount > 50000 ? "growth" : "balanced",
          incomeStability: onboard.answers.incomeType === "salaried" ? "high" : "medium",
          lastCalculatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      onboard.completed = true;
      await onboard.save();

      reply = `All done — your Financial DNA has been generated: ${fdna?.summary}`;
      return NextResponse.json({ reply, fdna });
    }

    // fallback
    reply = "Sorry, I didn't understand. Let's start: what is your income type?";
    return NextResponse.json({ reply, step: onboard.step });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
