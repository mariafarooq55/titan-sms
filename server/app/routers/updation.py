from fastapi import APIRouter, Depends

from app.deps import require_permission
from app.models.enrollment import Enrollment
from app.models.user import Module
from app.schemas.updation import UpdationRequest, UpdationResponse

router = APIRouter(prefix="/api/updation", tags=["updation"])


@router.post(
    "",
    response_model=UpdationResponse,
    dependencies=[Depends(require_permission(Module.UPDATION, "write"))],
)
async def bulk_update(payload: UpdationRequest):
    updated, not_found = [], []

    for roll_number in payload.roll_numbers:
        roll_number = roll_number.strip()
        if not roll_number:
            continue

        enrollment = await Enrollment.find_one(
            Enrollment.slot_id == payload.slot_id,
            Enrollment.roll_number == roll_number,
        )
        if not enrollment:
            not_found.append(roll_number)
            continue

        enrollment.status = payload.status
        await enrollment.save()
        updated.append(roll_number)

    return UpdationResponse(updated=updated, not_found=not_found)