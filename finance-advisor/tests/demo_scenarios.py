"""
Demo Scenarios — Pre-built test inputs covering 4 user archetypes.
Run all scenarios to validate the pipeline before any demo.

Usage:
    python tests/demo_scenarios.py
"""

import sys
import os

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SCENARIOS = [
    {
        "name": "Young, Low-Income, Emergency Fund",
        "message": "I'm 24, I earn $35k/year, my credit score is 620. "
                   "I want to build an emergency fund.",
    },
    {
        "name": "Mid-Career, High-Income, Retirement",
        "message": "I'm 42, income $120k, credit score 780. "
                   "I want to retire at 60 with $2 million saved.",
    },
    {
        "name": "Self-Employed, Variable Income, House",
        "message": "I'm 30, self-employed, income varies $40k-$80k, credit score 700. "
                   "I want to buy a house in 3 years.",
    },
    {
        "name": "Near-Retirement, Wealth Preservation",
        "message": "I'm 55, income $90k, credit score 750. "
                   "I have $200k in savings. Planning for retirement.",
    },
]


def run_scenarios():
    """Run all demo scenarios and report results."""
    from agents.supervisor.agent import run_full_pipeline

    results = []
    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"\n{'=' * 60}")
        print(f"SCENARIO {i}: {scenario['name']}")
        print(f"  Input: {scenario['message'][:70]}...")
        print('=' * 60)

        try:
            report = run_full_pipeline(scenario["message"])

            # Basic sanity checks
            assert "Financial Advisory Report" in report, "Missing report header"
            assert "Health Score" in report, "Missing health score section"
            assert "Financial Plan" in report, "Missing plan section"

            print(f"  ✅ PASSED — Report generated ({len(report)} chars)")
            results.append(("PASS", scenario["name"]))

        except Exception as e:
            print(f"  ❌ FAILED — {e}")
            results.append(("FAIL", scenario["name"]))

    # Summary
    print(f"\n{'=' * 60}")
    print("RESULTS SUMMARY")
    print('=' * 60)
    for status, name in results:
        icon = "✅" if status == "PASS" else "❌"
        print(f"  {icon} {name}: {status}")

    passed = sum(1 for s, _ in results if s == "PASS")
    total = len(results)
    print(f"\n  {passed}/{total} scenarios passed")

    return all(s == "PASS" for s, _ in results)


if __name__ == "__main__":
    success = run_scenarios()
    sys.exit(0 if success else 1)
