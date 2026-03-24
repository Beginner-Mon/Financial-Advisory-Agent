/**
 * Step configs for traditional personal loan application — 5 steps.
 */
import { WizardStep } from '../WizardShell';

export const LOAN_STEPS: WizardStep[] = [
  {
    title: 'Personal Details',
    fields: [
      { key: 'full_name', label: 'Full name', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'id_number', label: 'NRIC / Passport', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'dob', label: 'Date of birth', type: 'date', prefilled: null, required: true, editable: true },
      { key: 'mobile', label: 'Mobile number', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'email', label: 'Email address', type: 'text', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Employment & Income',
    fields: [
      { key: 'job_stability', label: 'Employment status', type: 'select', prefilled: null, required: true, editable: true, options: ['Stable', 'Contract', 'Self-employed'] },
      { key: 'employer', label: 'Employer name', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'employment_duration', label: 'Employment duration', type: 'select', prefilled: null, required: true, editable: true, options: ['<1 year', '1-3 years', '3-5 years', '5+ years'] },
      { key: 'monthly_income', label: 'Monthly income ($)', type: 'number', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Loan Details',
    fields: [
      { key: 'loan_amount', label: 'Loan amount ($)', type: 'number', prefilled: null, required: true, editable: true },
      { key: 'loan_tenure', label: 'Loan tenure', type: 'select', prefilled: null, required: true, editable: true, options: ['12 months', '24 months', '36 months', '48 months', '60 months'] },
      { key: 'loan_purpose', label: 'Purpose of loan', type: 'select', prefilled: null, required: true, editable: true, options: ['Medical', 'Education', 'Renovation', 'Travel', 'Other'] },
    ],
  },
  {
    title: 'Credit Check Consent',
    fields: [
      { key: 'credit_check_consent', label: 'I consent to a credit check being performed', type: 'toggle', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Review & Confirm',
    fields: [
      { key: 'terms', label: 'I agree to the Terms & Conditions', type: 'toggle', prefilled: null, required: true, editable: true },
      { key: 'otp', label: 'OTP Code', type: 'otp', prefilled: null, required: true, editable: true },
    ],
  },
];
