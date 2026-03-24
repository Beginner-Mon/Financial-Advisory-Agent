import sys
from agents.profiling.agent import run
import json

if __name__ == "__main__":
    msg = "I earn 50k and want to retire at 60"
    res = run(msg)
    print("RESULT:", json.dumps(res, indent=2))
