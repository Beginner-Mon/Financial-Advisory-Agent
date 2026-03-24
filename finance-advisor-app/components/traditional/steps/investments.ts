/**
 * Step configs for traditional investment purchase — 5 steps.
 */
import { WizardStep } from '../WizardShell';

export const INVESTMENT_STEPS: WizardStep[] = [
  {
    title: 'Personal Details',
    fields: [
      { key: 'full_name', label: 'Full name', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'id_number', label: 'NRIC / Passport', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'dob', label: 'Date of birth', type: 'date', prefilled: null, required: true, editable: true },
      { key: 'mobile', label: 'Mobile number', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'tax_residency', label: 'Tax residency', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'pep', label: 'Politically exposed person?', type: 'toggle', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Risk Acknowledgement',
    fields: [
      { key: 'risk_acknowledge', label: 'I understand and accept the risks of this investment', type: 'toggle', prefilled: null, required: true, editable: true },
    ],
  },
  {
    title: 'Investment Amount',
    fields: [
      { key: 'investment_amount', label: 'Investment amount ($)', type: 'number', prefilled: null, required: true, editable: true },
      { key: 'funding_account', label: 'Funding account', type: 'select', prefilled: null, required: true, editable: true, options: ['Main Checking'] },
      { key: 'recurring', label: 'Recurring investment?', type: 'toggle', prefilled: null, required: false, editable: true },
    ],
  },
  {
    title: 'Prospectus',
    fields: [
      { key: 'prospectus_read', label: 'I have read and understood the fund prospectus', type: 'toggle', prefilled: null, required: true, editable: true },
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
