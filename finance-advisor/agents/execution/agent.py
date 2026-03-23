"""
Execution Agent — processes product application steps autonomously.

Step results are JSON with shape:
{
  "step": str,
  "status": "done" | "paused",
  "input_type": null | "otp" | "biometric" | "clarification" | "user_choice" | "document_upload",
  "prompt": str | null,
  "options": list | null,
  "filled_value": str | null,
  "agent_log_entry": str
}
"""
from __future__ import annotations
import json

# ---------------------------------------------------------------------------
# Product flows — ordered list of steps per product type
# ---------------------------------------------------------------------------
PRODUCT_FLOWS: dict[str, list[str]] = {
    "card": [
        "fill_personal",
        "set_limit",
        "choose_delivery",
        "agree_terms",
        "otp_confirm",
    ],
    "savings": [
        "fill_personal",
        "set_initial_deposit",
        "choose_tenor",
        "agree_terms",
        "otp_confirm",
    ],
    "loan": [
        "fill_personal",
        "fill_employment",
        "set_loan_amount",
        "credit_check_consent",
        "agree_terms",
        "otp_confirm",
    ],
    "home_loan": [
        "fill_personal",
        "fill_employment",
        "fill_property",
        "document_checklist",
        "credit_check_consent",
        "agree_terms",
        "otp_confirm",
        "biometric_confirm",
    ],
    "insurance": [
        "fill_personal",
        "health_declaration",
        "choose_coverage",
        "choose_frequency",
        "agree_terms",
        "biometric_confirm",
    ],
    "investment": [
        "fill_personal",
        "risk_acknowledgement",
        "set_amount",
        "set_recurring",
        "link_account",
        "agree_prospectus",
        "otp_confirm",
    ],
}

# Steps that ALWAYS require a manual pause — agent never auto-fills these
ALWAYS_PAUSE: set[str] = {
    "health_declaration",
    "credit_check_consent",
    "risk_acknowledgement",
    "agree_prospectus",
    "otp_confirm",
    "biometric_confirm",
    "document_checklist",
}

# ---------------------------------------------------------------------------
# Pause configurations per step
# ---------------------------------------------------------------------------
_PAUSE_CONFIG: dict[str, dict] = {
    "otp_confirm": {
        "input_type": "otp",
        "prompt": "Enter the OTP sent to your registered mobile number.",
        "options": None,
    },
    "biometric_confirm": {
        "input_type": "biometric",
        "prompt": "Please verify your identity using biometric or PIN to continue.",
        "options": None,
    },
    "health_declaration": {
        "input_type": "user_choice",
        "prompt": "Please complete the health declaration. Do you have any pre-existing medical conditions?",
        "options": ["No pre-existing conditions", "Yes — I will declare them"],
    },
    "credit_check_consent": {
        "input_type": "user_choice",
        "prompt": "We need your consent to perform a credit check. This will not affect your credit score.",
        "options": ["I consent to a credit check", "I do not consent"],
    },
    "risk_acknowledgement": {
        "input_type": "user_choice",
        "prompt": "Please review and acknowledge the investment risk rating (4/7 — Medium Risk).",
        "options": ["I acknowledge the risk rating", "I want to learn more"],
    },
    "agree_prospectus": {
        "input_type": "user_choice",
        "prompt": "Please confirm you have read the fund prospectus and full terms.",
        "options": ["I have read and agree to the prospectus", "Send me the prospectus first"],
    },
    "document_checklist": {
        "input_type": "document_upload",
        "prompt": "Please confirm you have the required documents ready to upload after submission.",
        "options": ["I have all required documents", "I need to gather documents"],
    },
}

# ---------------------------------------------------------------------------
# Auto-fill logic per step
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """You are a bank application agent working on behalf of the user.
You are given: the product type, user's profile, current step name, and already-filled data.

For each step, return ONLY valid JSON (no markdown, no explanation):
{
  "step": "<step_name>",
  "status": "done",
  "input_type": null,
  "prompt": null,
  "options": null,
  "filled_value": "<what was auto-filled>",
  "agent_log_entry": "<human-readable description for the summary card>"
}

Guidelines:
- fill_personal: Fill from profile (name, address, DOB, NRIC/ID, nationality)
- set_limit: Calculate as min(50% of monthly_income * 12, 50000). Show as "$X,XXX"
- choose_delivery: Use primary address from profile. If multiple addresses, return status "paused" with clarification
- agree_terms: Always auto-agree. filled_value = "Terms & conditions agreed"
- fill_employment: Fill employer, employment type, annual income from profile
- fill_property: Return paused — user must provide property details
- set_loan_amount: Return paused — user picks loan amount
- set_initial_deposit: Return paused — user enters initial deposit
- choose_tenor: Return paused — user picks 3/6/12/24 months
- set_amount: Return paused — user enters investment amount
- set_recurring: Return paused — user sets recurring amount or skips
- link_account: Auto-link to primary checking account ("Checking ••XXXX")

Always return valid JSON only. Never add explanation text outside the JSON."""


def _auto_fill(step: str, product_type: str, profile: dict, filled_data: dict) -> dict:
    """Try to auto-fill a step using the AI agent. Falls back to clarification on error."""
    try:
        from agents.base import run_agent

        context = json.dumps({
            "step": step,
            "product_type": product_type,
            "profile": profile,
            "already_filled": filled_data,
        }, indent=2)

        result_text = run_agent(_SYSTEM_PROMPT, context, tools=[], tool_fn_map={})
        # Strip markdown code fences if present
        cleaned = result_text.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[:-1])
        return json.loads(cleaned.strip())
    except Exception as e:
        return {
            "step": step,
            "status": "paused",
            "input_type": "clarification",
            "prompt": f"We need some additional information to complete this step.",
            "options": None,
            "filled_value": None,
            "agent_log_entry": f"Could not auto-fill {step} — your input is required.",
        }


def _pause_step(step: str) -> dict:
    """Return a pause result for a mandatory-pause step."""
    cfg = _PAUSE_CONFIG.get(step, {
        "input_type": "clarification",
        "prompt": "Your input is required to continue.",
        "options": None,
    })
    return {
        "step": step,
        "status": "paused",
        "input_type": cfg["input_type"],
        "prompt": cfg["prompt"],
        "options": cfg.get("options"),
        "filled_value": None,
        "agent_log_entry": f"Paused at {step} — your confirmation is required.",
    }


def process_step(step: str, product_type: str, profile: dict, filled_data: dict) -> dict:
    """
    Process a single step. Returns a step result dict.
    If the step is in ALWAYS_PAUSE, returns pause immediately.
    Otherwise, attempts to auto-fill from profile via AI.
    """
    if step in ALWAYS_PAUSE:
        return _pause_step(step)

    return _auto_fill(step, product_type, profile, filled_data)
