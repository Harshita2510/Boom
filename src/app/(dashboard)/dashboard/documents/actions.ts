"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import {
  answerDocumentQuestion,
  summarizeDocumentTextWithAI
} from "@/lib/document-intelligence";
import { connectToDatabase } from "@/lib/mongoose";
import { analyzeOmbudsmanCase } from "@/lib/ombudsman";
import { OmbudsmanCaseModel, UploadedDocumentModel } from "@/models";

const documentSchema = z.object({
  documentText: z.string().min(40, "Paste at least 40 characters."),
  fileName: z.string().min(2, "Add a document name."),
  fileType: z.enum(["bank_statement", "salary_slip", "tax_document", "receipt", "other"])
});

const questionSchema = z.object({
  documentId: z.string().min(1),
  question: z.string().min(4, "Ask a question.")
});

const disputeSchema = z.object({
  documentText: z.string().min(40, "Paste at least 40 characters."),
  institutionName: z.string().optional()
});

export type DocumentFormState = {
  ok: boolean;
  message: string;
};

export async function createDocumentRecord(
  _previousState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const rawFile = formData.get("textFile");
  let fileText = "";
  let uploadedName = "";

  if (rawFile instanceof File && rawFile.size > 0) {
    uploadedName = rawFile.name;
    fileText = await rawFile.text();
  }

  const parsed = documentSchema.safeParse({
    documentText: fileText || formData.get("documentText"),
    fileName: formData.get("fileName") || uploadedName || "Financial document",
    fileType: formData.get("fileType")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Please check the form."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const intelligence = await summarizeDocumentTextWithAI(parsed.data.documentText);

  await UploadedDocumentModel.create({
    userId: appUser._id,
    fileName: parsed.data.fileName,
    fileType: parsed.data.fileType,
    mimeType: rawFile instanceof File && rawFile.size > 0 ? rawFile.type || "text/plain" : "text/plain",
    fileSizeBytes: Buffer.byteLength(parsed.data.documentText),
    processingStatus: "processed",
    extractedText: parsed.data.documentText,
    extractedData: {
      chunks: intelligence.chunks.length,
      summary: intelligence.summary
    },
    processedAt: new Date()
  });

  revalidatePath("/dashboard/documents");

  return {
    ok: true,
    message: `Document processed into ${intelligence.chunks.length} chunks.`
  };
}

export async function askDocumentQuestion(
  _previousState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const parsed = questionSchema.safeParse({
    documentId: formData.get("documentId"),
    question: formData.get("question")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Please check the question."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const document = await UploadedDocumentModel.findOne({
    _id: parsed.data.documentId,
    userId: appUser._id
  });

  if (!document?.extractedText) {
    return {
      ok: false,
      message: "Document text was not found."
    };
  }

  const answer = await answerDocumentQuestion(
    document.extractedText,
    parsed.data.question
  );

  return {
    ok: true,
    message: answer.answer
  };
}

function inferIssueType(text: string) {
  const lower = text.toLowerCase();

  if (/insurance|claim|premium|policy/.test(lower)) {
    return "insurance";
  }

  if (/loan|emi|interest|foreclosure|prepayment/.test(lower)) {
    return "loan";
  }

  if (/upi|wallet|refund|failed transaction|debited/.test(lower)) {
    return "wallet_upi";
  }

  if (/credit card|card bill|statement/.test(lower)) {
    return "credit_card";
  }

  if (/fee|charge|penalty/.test(lower)) {
    return "bank_fee";
  }

  return "other";
}

function inferTitle(text: string) {
  const lower = text.toLowerCase();

  if (/claim|insurance/.test(lower)) {
    return "Insurance complaint draft";
  }

  if (/loan|emi/.test(lower)) {
    return "Loan complaint draft";
  }

  if (/upi|wallet|refund|failed transaction/.test(lower)) {
    return "UPI or refund complaint draft";
  }

  if (/fee|charge|penalty/.test(lower)) {
    return "Fee or penalty complaint draft";
  }

  return "Financial complaint draft";
}

export async function createDocumentDisputeDraft(
  _previousState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const parsed = disputeSchema.safeParse({
    documentText: formData.get("documentText"),
    institutionName: formData.get("institutionName")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Please check the form."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const input = {
    documentText: parsed.data.documentText,
    institutionName: parsed.data.institutionName,
    issueType: inferIssueType(parsed.data.documentText),
    title: inferTitle(parsed.data.documentText)
  };
  const analysis = analyzeOmbudsmanCase(input);

  await OmbudsmanCaseModel.create({
    userId: appUser._id,
    ...input,
    ...analysis,
    status: "draft"
  });

  revalidatePath("/dashboard/documents");

  return {
    ok: true,
    message: `Complaint draft prepared. Risk score ${analysis.riskScore}/100.`
  };
}
