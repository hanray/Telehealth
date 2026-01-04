export const createAppointment = ({
  patientId,
  patientName,
  providerId,
  providerName,
  type = 'General Consultation',
  dateISO,
  time = '10:00',
  status = 'scheduled',
  priority = 'normal',
  notes = '',
}) => {
  const id = `A-${Math.random().toString(16).slice(2)}-${Date.now()}`;
  const startAt = dateISO ? `${dateISO}T${time}:00.000Z` : new Date().toISOString();

  return {
    id,
    patientId,
    patientName,
    providerId,
    providerName,
    type,
    status,
    priority,
    notes,
    startAt,
    createdAt: new Date().toISOString(),
  };
};
