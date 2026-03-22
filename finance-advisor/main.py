"""
Finance Advisor CLI — Main entry point for the advisory pipeline.

Usage:
    python main.py "I'm 28, earn 60k, credit score 680, want to buy a house"
    python main.py "I want to retire at 60" --verify
    python main.py "Change my goal to retirement" --session my-session
    python main.py --help
"""

import sys
import argparse
from config import get_logger

logger = get_logger("main")


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="finance-advisor",
        description="Agentic AI Financial Advisory System",
        epilog="Example: python main.py \"I'm 28, earn 60k, credit 680, want a house\"",
    )
    parser.add_argument(
        "message",
        nargs="?",
        default="I want to save for a house in 5 years",
        help="Your financial situation and goals in natural language",
    )
    parser.add_argument(
        "--session",
        default="default",
        help="Session ID for multi-turn conversations (default: 'default')",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Run the verifier agent after generating the report",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output the report as JSON instead of rich console format",
    )
    return parser


def print_rich_report(report: str, health_score: float | None = None):
    """Print the report with Rich formatting if available."""
    try:
        from rich.console import Console
        from rich.markdown import Markdown
        from rich.panel import Panel

        console = Console()
        console.print()
        console.print(
            Panel(
                Markdown(report),
                title="[bold blue]Financial Advisory Report[/bold blue]",
                border_style="blue",
                padding=(1, 2),
            )
        )
        console.print()
    except ImportError:
        print(report)


def print_verification(result: str):
    """Print verification result with Rich formatting."""
    try:
        from rich.console import Console
        from rich.panel import Panel

        console = Console()
        is_approved = "APPROVED" in result.upper()
        style = "green" if is_approved else "red"
        title = "✅ Verification: APPROVED" if is_approved else "⚠️ Verification: ISSUES FOUND"
        console.print(
            Panel(result, title=title, border_style=style, padding=(1, 2))
        )
    except ImportError:
        print(f"\n--- Verification ---\n{result}\n")


def run_with_progress(message: str, session_id: str, verify: bool) -> str:
    """Run the pipeline with a Rich progress spinner."""
    try:
        from rich.console import Console
        from rich.status import Status

        console = Console()
        with console.status("[bold blue]Running advisory pipeline...", spinner="dots"):
            from agents.supervisor.agent import run_full_pipeline
            console.log("[1/4] Profiling user...")
            report = run_full_pipeline(message, session_id)

        return report
    except ImportError:
        from agents.supervisor.agent import run_full_pipeline
        print(f"\nRunning pipeline for: '{message}'\n{'─' * 50}")
        return run_full_pipeline(message, session_id)


def main():
    parser = create_parser()
    args = parser.parse_args()

    logger.info(f"Starting pipeline: message='{args.message[:60]}...'")

    try:
        # Run the pipeline
        report = run_with_progress(args.message, args.session, args.verify)

        # Output
        if args.json_output:
            import json
            print(json.dumps({"report": report, "session_id": args.session}, indent=2))
        else:
            print_rich_report(report)

        # Optional verification
        if args.verify:
            try:
                from rich.console import Console
                Console().log("[5/5] Running verification...")
            except ImportError:
                print("\n[5/5] Running verification...")

            from agents.verifier.agent import verify
            verification = verify(report)
            if args.json_output:
                import json
                print(json.dumps({"verification": verification}))
            else:
                print_verification(verification)

    except ValueError as e:
        if "GOOGLE_API_KEY" in str(e):
            print(f"\n❌ Error: {e}")
            print("   Run: copy .env.example .env  then add your API key.")
            print("   Get a free key at: https://aistudio.google.com/apikey")
            sys.exit(1)
        raise
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        print(f"\n❌ Pipeline error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
