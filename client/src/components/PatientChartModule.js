import React from 'react';
import MedicalRecordModule from './MedicalRecordModule';

// Patient Chart = clinical UI.
// For now, this reuses the existing clinical chart UI implementation.
// Medical Record = patient data (patient.medicalRecord).
const PatientChartModule = (props) => <MedicalRecordModule {...props} />;

export default PatientChartModule;
