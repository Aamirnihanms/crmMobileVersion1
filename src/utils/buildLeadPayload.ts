export const buildLeadPayload = (form: any) => {
  const payload: any = {};

  Object.entries(form).forEach(([k, v]) => {
    if (v !== null && v !== '' && v !== undefined) {
      payload[k] = v;
    }
  });

  if (payload.reminder_date) {
    payload.reminder_date = new Date(
      payload.reminder_date
    ).toISOString();
  }

  return payload;
};
