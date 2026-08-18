from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import require_permission
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.slot import Slot
from app.models.user import Module
from app.schemas.slot import SlotCreate, SlotOut, SlotUpdate

router = APIRouter(prefix="/api/slots", tags=["slots"])


async def to_out(slot: Slot) -> SlotOut:
    seats_used = await Enrollment.find(
        Enrollment.slot_id == str(slot.id),
        Enrollment.status != EnrollmentStatus.DROPOUT,
    ).count()
    return SlotOut(
        id=str(slot.id),
        schedule=slot.schedule,
        city=slot.city,
        campus=slot.campus,
        course=slot.course,
        trainer=slot.trainer,
        class_type=slot.class_type,
        gender=slot.gender,
        start_date=slot.start_date,
        end_date=slot.end_date,
        trainer_hourly_rate=slot.trainer_hourly_rate,
        whatsapp_link=slot.whatsapp_link,
        capacity=slot.capacity,
        seats_used=seats_used,
        registration_open=slot.registration_open,
    )


@router.post(
    "",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Module.SLOTS, "write"))],
)
async def create_slot(payload: SlotCreate):
    slot = Slot(**payload.model_dump())
    await slot.insert()
    return await to_out(slot)


@router.get(
    "",
    dependencies=[Depends(require_permission(Module.SLOTS, "read"))],
)
async def list_slots():
    slots = await Slot.find_all().to_list()
    items = [await to_out(s) for s in slots]
    return {"items": items, "total": len(items)}


@router.get(
    "/{slot_id}",
    response_model=SlotOut,
    dependencies=[Depends(require_permission(Module.SLOTS, "read"))],
)
async def get_slot(slot_id: str):
    slot = await Slot.get(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return await to_out(slot)


@router.patch(
    "/{slot_id}",
    response_model=SlotOut,
    dependencies=[Depends(require_permission(Module.SLOTS, "update"))],
)
async def update_slot(slot_id: str, payload: SlotUpdate):
    slot = await Slot.get(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(slot, field, value)
    await slot.save()
    return await to_out(slot)


@router.post(
    "/{slot_id}/toggle-registration",
    response_model=SlotOut,
    dependencies=[Depends(require_permission(Module.SLOTS, "update"))],
)
async def toggle_registration(slot_id: str):
    slot = await Slot.get(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    slot.registration_open = not slot.registration_open
    await slot.save()
    return await to_out(slot)