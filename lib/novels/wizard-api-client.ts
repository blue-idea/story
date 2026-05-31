import type { CoreConfig, CustomConfig } from "../../db/schema";

type WizardDraftResponse = {
  novelId: string;
  status: "draft";
};

type WizardUpdateResponse = {
  novelId: string;
  status: "draft";
  customConfig: Partial<CustomConfig>;
};

type WizardConfirmConfigResponse = {
  novelId: string;
  status: "draft";
  customConfig: CustomConfig;
};

type WizardTitlesResponse = {
  candidateTitles: string[];
};

type WizardConfirmTitleResponse = {
  novelId: string;
  status: "planning";
};

type WizardSuggestionResponse = {
  field: string;
  suggestion: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error("Request failed");
  }

  return (await response.json()) as T;
}

export async function createWizardDraftRequest(
  coreConfig: CoreConfig,
): Promise<WizardDraftResponse> {
  const response = await fetch("/api/novel/wizard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coreConfig,
    }),
  });

  return parseJsonResponse<WizardDraftResponse>(response);
}

export async function updateWizardDraftRequest(
  novelId: string,
  customConfigPartial: Partial<CustomConfig>,
): Promise<WizardUpdateResponse> {
  const response = await fetch(`/api/novel/${novelId}/wizard`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customConfigPartial,
    }),
  });

  return parseJsonResponse<WizardUpdateResponse>(response);
}

export async function requestWizardSuggestion(
  novelId: string,
  questionId: string,
): Promise<WizardSuggestionResponse> {
  const response = await fetch(`/api/novel/${novelId}/wizard/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId,
    }),
  });

  return parseJsonResponse<WizardSuggestionResponse>(response);
}

export async function confirmWizardConfigRequest(
  novelId: string,
): Promise<WizardConfirmConfigResponse> {
  const response = await fetch(`/api/novel/${novelId}/wizard/confirm-config`, {
    method: "POST",
  });

  return parseJsonResponse<WizardConfirmConfigResponse>(response);
}

export async function requestWizardTitles(
  novelId: string,
): Promise<WizardTitlesResponse> {
  const response = await fetch(`/api/novel/${novelId}/wizard/titles`, {
    method: "POST",
  });

  return parseJsonResponse<WizardTitlesResponse>(response);
}

export async function confirmWizardTitleRequest(
  novelId: string,
  title: string,
): Promise<WizardConfirmTitleResponse> {
  const response = await fetch(`/api/novel/${novelId}/confirm-title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
    }),
  });

  return parseJsonResponse<WizardConfirmTitleResponse>(response);
}
