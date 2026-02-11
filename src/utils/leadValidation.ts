export const validateLead = (form: any) => {
  if (!form.name) return 'Name required';
  if (!form.phone_number) return 'Phone required';
  if (!form.course) return 'Select course';
  if (!form.counselor) return 'Select counselor';

  return null;
};
