// Shared between submit-plot, submit-layout, update-plot, update-layout.
// Legal approval status (DTCP/CMDA planning approval + RERA status) is
// mandatory at submission — enforced here server-side, not just in the
// AddForm.jsx client validation, since the client check is trivially
// bypassable via a direct API call.

const PLANNING_APPROVAL_VALUES = ["dtcp", "cmda", "none"];
const RERA_STATUS_VALUES = ["registered", "exempted", "not_registered"];

export function validateApproval(body: Record<string, unknown>): string | null {
  const { planning_approval, planning_approval_number, rera_status, rera_number } = body as {
    planning_approval?: string; planning_approval_number?: string;
    rera_status?: string; rera_number?: string;
  };
  if (!planning_approval || !PLANNING_APPROVAL_VALUES.includes(planning_approval)) {
    return "planning_approval is required and must be one of: " + PLANNING_APPROVAL_VALUES.join(", ");
  }
  if ((planning_approval === "dtcp" || planning_approval === "cmda") && !planning_approval_number?.trim()) {
    return "planning_approval_number is required when planning_approval is dtcp or cmda";
  }
  if (!rera_status || !RERA_STATUS_VALUES.includes(rera_status)) {
    return "rera_status is required and must be one of: " + RERA_STATUS_VALUES.join(", ");
  }
  if (rera_status === "registered" && !rera_number?.trim()) {
    return "rera_number is required when rera_status is registered";
  }
  return null;
}
