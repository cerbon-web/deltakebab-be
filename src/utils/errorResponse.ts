export interface ErrorItem {
  field?: string;
  code: string;
  message?: string;
}

export interface ErrorResponsePayload {
  status: 'error';
  code: string;
  message: string;
  errors: ErrorItem[];
}

export const buildErrorResponse = ({
  code,
  message,
  errors
}: {
  code: string;
  message: string;
  errors: ErrorItem[];
  status?: number;
}): ErrorResponsePayload => ({
  status: 'error',
  code,
  message,
  errors
});

const mapZodIssueToCode = (issue: { path: (string | number)[]; code: string; message: string }): string => {
  const field = issue.path[0];
  const fieldName = typeof field === 'string' ? field : String(field ?? '');

  if (issue.code === 'too_small' && fieldName === 'guestPhone') {
    return 'PHONE_TOO_SHORT';
  }

  if (issue.code === 'too_small' && fieldName === 'branchId') {
    return 'BRANCH_REQUIRED';
  }

  if (issue.code === 'too_small' && fieldName === 'items') {
    return 'ORDER_ITEMS_REQUIRED';
  }

  if (issue.code === 'invalid_type' && fieldName === 'items') {
    return 'ORDER_ITEMS_REQUIRED';
  }

  if (issue.code === 'invalid_type' || issue.code === 'invalid_literal' || issue.code === 'invalid_enum_value') {
    return 'INVALID_VALUE';
  }

  if (issue.code === 'too_small' || issue.code === 'too_big') {
    return 'FIELD_REQUIRED';
  }

  return 'INVALID_FIELD';
};

export const mapZodErrorToPayload = (error: { issues: Array<{ path: (string | number)[]; code: string; message: string }> }) => {
  const errors = error.issues.map((issue) => ({
    field: issue.path[0] ? String(issue.path[0]) : undefined,
    code: mapZodIssueToCode(issue),
    message: issue.message
  }));

  return buildErrorResponse({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors
  });
};
