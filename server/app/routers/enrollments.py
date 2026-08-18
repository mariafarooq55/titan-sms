from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_permission
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.slot import Slot
from app.models.student import Student
from app.models.user import Module
from app.schemas.enrollment import EnrollmentCreate, EnrollmentOut, EnrollmentUpdate

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


async def to_out(enrollment: Enrollment) -> EnrollmentOut:
    student = await Student.get(enrollment.student_id)
    slot = await Slot.get(enrollment.slot_id)
    return EnrollmentOut(
        id=str(enrollment.id),
        student_id=enrollment.student_id,
        student_name=student.full_name if student else "(deleted student)",
        slot_id=enrollment.slot_id,
        slot_schedule=slot.schedule if slot else "(deleted slot)",
        course=slot.course if slot else "",
        campus=slot.campus if slot else "",
        trainer=slot.trainer if slot else None,
        roll_number=enrollment.roll_number,
        status=enrollment.status,
        joined_at=enrollment.joined_at,
    )


@router.post(
    "",
    response_model=EnrollmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Module.STUDENTS, "write"))],
)
async def create_enrollment(payload: EnrollmentCreate):
    student = await Student.get(payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    slot = await Slot.get(payload.slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if not slot.registration_open:
        raise HTTPException(status_code=400, detail="Registration is closed for this slot")

    existing = await Enrollment.find_one(
        Enrollment.student_id == payload.student_id,
        Enrollment.slot_id == payload.slot_id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Student is already enrolled in this slot")

    active_count = await Enrollment.find(
        Enrollment.slot_id == payload.slot_id,
        Enrollment.status != EnrollmentStatus.DROPOUT,
    ).count()
    if active_count >= slot.capacity:
        raise HTTPException(status_code=400, detail="This slot is full")

    roll_number = str(active_count + 1)
    enrollment = Enrollment(
        student_id=payload.student_id,
        slot_id=payload.slot_id,
        roll_number=roll_number,
    )
    await enrollment.insert()
    return await to_out(enrollment)


@router.get(
    "",
    dependencies=[Depends(require_permission(Module.STUDENTS, "read"))],
)
async def list_enrollments(
    student_id: str | None = Query(None),
    slot_id: str | None = Query(None),
):
    query = {}
    if student_id:
        query["student_id"] = student_id
    if slot_id:
        query["slot_id"] = slot_id

    enrollments = await Enrollment.find(query).to_list()
    items = [await to_out(e) for e in enrollments]
    return {"items": items, "total": len(items)}


@router.patch(
    "/{enrollment_id}",
    response_model=EnrollmentOut,
    dependencies=[Depends(require_permission(Module.STUDENTS, "update"))],
)
async def update_enrollment(enrollment_id: str, payload: EnrollmentUpdate):
    enrollment = await Enrollment.get(enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    enrollment.status = payload.status
    await enrollment.save()
    return await to_out(enrollment)