"""Goals routes."""

from __future__ import annotations
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from routes import ok, err

router = APIRouter(tags=["Goals"])


class CreateGoalBody(BaseModel):
    user_id: str
    name: str
    target_amount: float
    deadline: str = ""


class UpdateGoalBody(BaseModel):
    target_amount: Optional[float] = None
    deadline: Optional[str] = None
    current_amount: Optional[float] = None
    name: Optional[str] = None


@router.get("/goals/{user_id}")
def get_goals(user_id: str):
    from tools.goals.tracker import get_goals as _get_goals
    return ok(_get_goals(user_id))


@router.post("/goals")
def create_goal(body: CreateGoalBody):
    from tools.goals.tracker import create_goal as _create
    goal = _create(body.user_id, body.name, body.target_amount, body.deadline)
    return ok(goal)


@router.patch("/goals/{goal_id}")
def update_goal(goal_id: str, body: UpdateGoalBody):
    from tools.goals.tracker import update_goal as _update
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = _update(goal_id, updates)
    if not result:
        err(f"Goal not found: {goal_id}", 404)
    return ok(result)


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str):
    from tools.goals.tracker import delete_goal as _delete
    deleted = _delete(goal_id)
    if not deleted:
        err(f"Goal not found: {goal_id}", 404)
    return ok({"goal_id": goal_id, "status": "cancelled"})
