/**
 * Step configs for traditional savings account opening — 4 steps.
 */
import { WizardStep } from '../WizardShell';

export const SAVINGS_STEPS: WizardStep[] = [
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
    title: 'Account Setup',
    fields: [
      { key: 'account_nickname', label: 'Account nickname', type: 'text', prefilled: null, required: true, editable: true },
      { key: 'initial_deposit', label: 'Initial deposit ($)', type: 'number', prefilled: null, required: true, editable: true },
      { key: 'funding_account', label: 'Funding account', type: 'select', prefilled: null, required: true, editable: true, options: ['Main Checking'] },
    ],
  },
  {
    title: 'Savings Goal (Optional)',
    fields: [
      { key: 'goal_name', label: 'Savings goal', type: 'select', prefilled: null, required: false, editable: true, options: ['Emergency fund', 'House', 'Education', 'Holiday', 'Other'] },
      { key: 'target_amount', label: 'Target amount ($)', type: 'number', prefilled: null, required: false, editable: true },
      { key: 'target_date', label: 'Target date', type: 'date', prefilled: null, required: false, editable: true },
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
