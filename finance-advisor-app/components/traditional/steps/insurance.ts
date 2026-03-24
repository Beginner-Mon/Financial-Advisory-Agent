/**
 * Step configs for traditional insurance purchase — 5 steps.
 */
import { WizardStep } from '../WizardShell';

export const INSURANCE_STEPS: WizardStep[] = [
  {
    title: 'Personal Details',
    fields: [
      { key: 'full_name', label: 'Full name', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'id_number', label: 'NRIC / Passport', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'dob', label: 'Date of birth', type: 'date', prefilled: null, required: true, editable: true },
      { key: 'mobile', label: 'Mobile number', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'gender', label: 'Gender', type: 'select', prefilled: null, required: true, editable: true, options: ['Male', 'Female', 'Other'] },
      { key: 'smoking_status', label: 'Smoking status', type: 'select', prefilled: null, required: true, editable: true, options: ['Non-smoker', 'Smoker', 'Ex-smoker'] },
    ],
  },
  {
    title: 'Health Declaration',
    fields: [
      { key: 'chronic_illness', label: 'Have you been diagnosed with a chronic illness?', type: 'toggle', prefilled: null, required: true, editable: true },
      { key: 'recent_surgery', label: 'Had surgery in the past 5 years?', type: 'toggle', prefilled: null, required: true, editable: true },
      { key: 'hospitalized', label: 'Hospitalized in the past 2 years?', type: 'toggle', prefilled: null, required: true, editable: true },
      { key: 'medication', label: 'Currently on prescribed medication?', type: 'toggle', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Coverage Selection',
    fields: [
      { key: 'coverage_tier', label: 'Coverage tier', type: 'select', prefilled: null, required: true, editable: true, options: ['Basic', 'Standard', 'Premium'] },
      { key: 'coverage_amount', label: 'Coverage amount ($)', type: 'number', prefilled: null, required: true, editable: true },
      { key: 'critical_illness', label: 'Add Critical Illness cover', type: 'toggle', prefilled: null, required: false, editable: true },
      { key: 'total_disability', label: 'Add Total Disability cover', type: 'toggle', prefilled: null, required: false, editable: true },
    ],
  },
  {
    title: 'Payment Setup',
    fields: [
      { key: 'payment_frequency', label: 'Payment frequency', type: 'select', prefilled: null, required: true, editable: true, options: ['Monthly', 'Quarterly', 'Annually'] },
      { key: 'payment_account', label: 'Payment method (checking)', type: 'select', prefilled: null, required: true, editable: true, options: ['Main Checking'] },
    ],
  },
  {
    title: 'Review & Confirm',
    fields: [
      { key: 'terms', label: 'I agree to the Terms & Conditions and policy disclosure', type: 'toggle', prefilled: null, required: true, editable: true },
      { key: 'otp', label: 'OTP Code', type: 'otp', prefilled: null, required: true, editable: true },
    ],
  },
];
