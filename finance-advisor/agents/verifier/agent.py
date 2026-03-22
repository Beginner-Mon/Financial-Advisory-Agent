"""
Verifier Agent — Cross-checks the advisory report for consistency,
logical contradictions, and compliance issues.
"""

from agents.base import run_agent
from config import get_logger

logger = get_logger(__name__)

SYSTEM = """You are a financial compliance reviewer.
Your job is to review a financial advisory report for quality and consistency.

Check for:
1. Risk profile ↔ product consistency (conservative profiles should not have high-risk fund recommendations)
2. Health score ↔ plan feasibility (a score of 30 should not suggest aggressive investing)
3. Missing disclosures or unrealistic return projections
4. Logical contradictions in the financial plan
5. Any goals mentioned but not addressed in the plan

Response format:
- If everything is consistent: "APPROVED — [brief summary of why it passes]"
- If issues found: "ISSUES FOUND" followed by a numbered list of specific problems.

Be concise and specific. Focus on factual inconsistencies, not style."""


def verify(report: str) -> str:
    """
    Run the verifier agent on a completed advisory report.

    Args:
        report: The full Markdown advisory report.

    Returns:
        Verification result string (APPROVED or list of issues).
    """
    result = run_agent(
        SYSTEM,
        f"Please review this financial advisory report for consistency and compliance:\n\n{report}",
        tools=[],
        tool_fn_map={},
    )

    status = "APPROVED" if "APPROVED" in result.upper() else "ISSUES FOUND"
    logger.info(f"Verifier result: {status}")
    return result
