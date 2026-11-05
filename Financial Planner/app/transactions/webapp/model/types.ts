// Shapes the Transactions app exchanges with TransactionService.

import type JSONModel from "sap/ui/model/json/JSONModel";

/** A vendor's recurring split template as suggestRecurringSplit returns it (Decimals as strings). */
export interface SplitSuggestionPayload {
  mySharePct: string | number | null;
  myShareAmount: string | number;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** A recurring split template ready for the Split dialog; a null share means dollar-based. */
export interface SplitSuggestion {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** The Split dialog's JSON model; inputs hold numbers when seeded and text once edited. */
export interface SplitDialogData {
  mySharePct: string | number | null;
  myShareAmount: string | number | null;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** The OData model as FE extends it: computed states live in its local annotation model. */
export interface LocalAnnotationModelOwner {
  getLocalAnnotationModel(): JSONModel;
}

/** One node of FE's local annotation model: computed-state leaves, or nested annotation paths. */
export type VirtualStateNode = Record<string, unknown>;
