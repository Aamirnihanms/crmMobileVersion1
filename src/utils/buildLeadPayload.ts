export const buildLeadPayload = (form: any) => {
  const payload: any = {};

  // Merge country codes with phone numbers
  const formWithPhone = {
    ...form,
    phone_number: form.phone_number
      ? `${form.phone_country_code?.code ?? '+91'}${form.phone_number}`
      : '',
    whatsapp_number: form.whatsapp_number
      ? `${form.whatsapp_country_code?.code ?? '+91'}${form.whatsapp_number}`
      : '',
    parent_phone_number: form.parent_phone_number
      ? `${form.parent_phone_country_code?.code ?? '+91'}${form.parent_phone_number}`
      : '',
  };

  Object.entries(formWithPhone).forEach(([k, v]) => {
    // Skip internal country code objects
    if (
      k === 'phone_country_code' ||
      k === 'whatsapp_country_code' ||
      k === 'parent_phone_country_code'
    ) return;
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

