/**
 * Step configs for traditional product application wizards.
 * Cards — 5 steps
 */
import { WizardStep } from '../WizardShell';

export const CARD_STEPS: WizardStep[] = [
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
    title: 'Address',
    fields: [
      { key: 'address_1', label: 'Home address line 1', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'address_2', label: 'Home address line 2', type: 'text', prefilled: null, required: false, editable: true },
      { key: 'city', label: 'City / State', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'postcode', label: 'Postcode', type: 'text', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Employment & Income',
    fields: [
      { key: 'job_stability', label: 'Employment status', type: 'select', prefilled: null, required: true, editable: true, options: ['Stable', 'Contract', 'Self-employed'] },
      { key: 'employer', label: 'Employer name', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'income', label: 'Annual income', type: 'number', prefilled: null, required: true, editable: true },
      { key: 'credit_limit', label: 'Credit limit preference', type: 'select', prefilled: null, required: true, editable: true, options: ['$1,000', '$3,000', '$5,000', '$10,000'] },
    ],
  },
  {
    title: 'Card Preference',
    fields: [
      { key: 'statement_cycle', label: 'Statement cycle', type: 'select', prefilled: null, required: true, editable: true, options: ['1st of month', '15th of month'] },
      { key: 'autopay', label: 'Autopay', type: 'select', prefilled: null, required: true, editable: true, options: ['Minimum balance', 'Full balance'] },
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
