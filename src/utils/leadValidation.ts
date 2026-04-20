export const validateLead = (form: any) => {
  if (!form.name) return 'Name required';
  if (!form.phone_number) return 'Phone required';
  if (form.phone_number.length !== 10) return 'Phone number must be 10 digits';
  if (form.whatsapp_number && form.whatsapp_number.length !== 10) return 'WhatsApp number must be 10 digits';
  if (form.parent_phone_number && form.parent_phone_number.length !== 10) return 'Parent phone number must be 10 digits';
  if (!form.course) return 'Select course';
  if (!form.counselor) return 'Select counselor';

  return null;
};
