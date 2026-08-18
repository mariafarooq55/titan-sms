from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user
from app.models.assignment import Assignment
from app.models.attendance import Attendance, AttendanceStatus
from app.models.enrollment import Enrollment
from app.models.slot import Slot
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.user import Role, User
from app.schemas.trainer import TrainerOut, TrainerSelfUpdate

router = APIRouter(prefix="/api/me", tags=["trainer"])


async def _require_trainer(user: User) -> User:
    if user.role != Role.TRAINER:
        raise HTTPException(
            status_code=403,
            detail="This endpoint is for trainer accounts only",
        )

    return user


async def _get_trainer_slots(user: User):
    trainer = await _require_trainer(user)

    slots = await Slot.find(
        Slot.trainer == trainer.full_name
    ).to_list()

    return slots


def _trainer_to_out(trainer: Trainer) -> TrainerOut:
    return TrainerOut(
        id=str(trainer.id),
        employee_id=trainer.employee_id,
        full_name=trainer.full_name,
        full_name_urdu=trainer.full_name_urdu,
        bio=trainer.bio,
        phone=trainer.phone,
        email=trainer.email,
        hourly_rate=trainer.hourly_rate,
        photo_url=trainer.photo_url,
        social_links=trainer.social_links,
        city=trainer.city,
        campus=trainer.campus,
        courses=trainer.courses,
    )


# ============================================================
# TRAINER DASHBOARD
# ============================================================

@router.get("/trainer/dashboard")
async def trainer_dashboard(
    user: User = Depends(get_current_user),
):
    trainer = await _require_trainer(user)

    slots = await Slot.find(
        Slot.trainer == trainer.full_name
    ).to_list()

    active_slots = [
        slot
        for slot in slots
        if slot.registration_open
    ]

    total_students = 0
    total_assignments = 0

    slot_items = []

    for slot in slots:

        # ----------------------------------------------------
        # Count enrolled students for THIS specific slot
        # ----------------------------------------------------
        student_count = await Enrollment.find(
            Enrollment.slot_id == str(slot.id),
            Enrollment.status != "dropout",
        ).count()

        total_students += student_count

        # ----------------------------------------------------
        # Count assignments for THIS specific slot
        # ----------------------------------------------------
        assignment_count = await Assignment.find(
            Assignment.slot_id == str(slot.id)
        ).count()

        total_assignments += assignment_count

        # ----------------------------------------------------
        # Build course card data
        # ----------------------------------------------------
        slot_items.append(
            {
                "id": str(slot.id),
                "course": slot.course,
                "campus": slot.campus,
                "city": slot.city,
                "schedule": slot.schedule,
                "start_date": getattr(
                    slot,
                    "start_date",
                    None,
                ),
                "end_date": getattr(
                    slot,
                    "end_date",
                    None,
                ),
                "capacity": slot.capacity,

                # IMPORTANT:
                # Use the actual Enrollment count instead
                # of slot.seats_used.
                "seats_used": student_count,

                "registration_open": slot.registration_open,
                "trainer": slot.trainer,
                "assignment_count": assignment_count,
            }
        )

    return {
        "active_courses": len(active_slots),
        "enrolled_students": total_students,
        "total_assignments": total_assignments,
        "slots": slot_items,
    }


# ============================================================
# TRAINER SLOTS
# ============================================================

@router.get("/slots")
async def trainer_slots(
    user: User = Depends(get_current_user),
):
    trainer = await _require_trainer(user)

    slots = await Slot.find(
        Slot.trainer == trainer.full_name
    ).to_list()

    items = []

    for slot in slots:

        enrollments = await Enrollment.find(
            Enrollment.slot_id == str(slot.id),
            Enrollment.status != "dropout",
        ).to_list()

        assignment_count = await Assignment.find(
            Assignment.slot_id == str(slot.id)
        ).count()

        items.append(
            {
                "id": str(slot.id),
                "course": slot.course,
                "campus": slot.campus,
                "city": slot.city,
                "schedule": slot.schedule,
                "start_date": getattr(
                    slot,
                    "start_date",
                    None,
                ),
                "end_date": getattr(
                    slot,
                    "end_date",
                    None,
                ),
                "capacity": slot.capacity,
                "seats_used": len(enrollments),
                "registration_open": slot.registration_open,
                "trainer": slot.trainer,
                "assignment_count": assignment_count,
            }
        )

    return {
        "items": items,
        "total": len(items),
    }


# ============================================================
# TRAINER SLOT STUDENTS
# ============================================================

@router.get("/slots/{slot_id}/students")
async def trainer_slot_students(
    slot_id: str,
    user: User = Depends(get_current_user),
):
    trainer = await _require_trainer(user)

    slot = await Slot.get(slot_id)

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    if slot.trainer != trainer.full_name:
        raise HTTPException(
            status_code=403,
            detail="This slot is not assigned to you",
        )

    enrollments = await Enrollment.find(
        Enrollment.slot_id == slot_id,
        Enrollment.status != "dropout",
    ).to_list()

    items = []

    for enrollment in enrollments:
        student = await Student.get(
            enrollment.student_id
        )

        items.append(
            {
                "id": str(enrollment.id),
                "student_id": enrollment.student_id,
                "student_name": (
                    student.full_name
                    if student
                    else "(deleted student)"
                ),
                "roll_number": enrollment.roll_number,
                "status": enrollment.status,
                "phone": (
                    student.phone
                    if student
                    else None
                ),
                "cnic": (
                    student.cnic
                    if student
                    else None
                ),
            }
        )

    return {
        "items": items,
        "total": len(items),
    }


# ============================================================
# MARK ATTENDANCE
# ============================================================

@router.post("/attendance/mark")
async def trainer_mark_attendance(
    slot_id: str,
    roll_number: str,
    date: str,
    status: AttendanceStatus,
    user: User = Depends(get_current_user),
):
    trainer = await _require_trainer(user)

    slot = await Slot.get(slot_id)

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    if slot.trainer != trainer.full_name:
        raise HTTPException(
            status_code=403,
            detail="This slot is not assigned to you",
        )

    enrollment = await Enrollment.find_one(
        Enrollment.slot_id == slot_id,
        Enrollment.roll_number == roll_number,
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Student with this roll number was not found in this slot",
        )

    existing = await Attendance.find_one(
        Attendance.enrollment_id == str(enrollment.id),
        Attendance.date == date,
    )

    if existing:
        existing.status = status
        existing.marked_by = str(user.id)

        await existing.save()

        return {
            "message": "Attendance updated",
            "id": str(existing.id),
            "status": existing.status,
        }

    attendance = Attendance(
        enrollment_id=str(enrollment.id),
        slot_id=slot_id,
        date=date,
        status=status,
        marked_by=str(user.id),
    )

    await attendance.insert()

    return {
        "message": "Attendance marked",
        "id": str(attendance.id),
        "status": attendance.status,
    }


# ============================================================
# GET ATTENDANCE
# ============================================================

@router.get("/attendance")
async def trainer_attendance(
    slot_id: str = Query(...),
    date: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    trainer = await _require_trainer(user)

    slot = await Slot.get(slot_id)

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    if slot.trainer != trainer.full_name:
        raise HTTPException(
            status_code=403,
            detail="This slot is not assigned to you",
        )

    enrollments = await Enrollment.find(
        Enrollment.slot_id == slot_id,
        Enrollment.status != "dropout",
    ).to_list()

    items = []

    for enrollment in enrollments:

        conditions = [
            Attendance.enrollment_id
            == str(enrollment.id)
        ]

        if date:
            conditions.append(
                Attendance.date == date
            )

        records = await Attendance.find(
            *conditions
        ).to_list()

        student = await Student.get(
            enrollment.student_id
        )

        attendance_status = None

        if records:
            attendance_status = records[-1].status

        items.append(
            {
                "enrollment_id": str(enrollment.id),
                "roll_number": enrollment.roll_number,
                "student_name": (
                    student.full_name
                    if student
                    else "(deleted student)"
                ),
                "status": attendance_status,
            }
        )

    return {
        "items": items,
        "total": len(items),
    }


# ============================================================
# TRAINER'S OWN PROFILE
# ============================================================

@router.get("/trainer/profile")
async def get_my_trainer_profile(user: User = Depends(get_current_user)):
    trainer_user = await _require_trainer(user)
    trainer = await Trainer.find_one(Trainer.user_id == str(trainer_user.id))
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")
    return _trainer_to_out(trainer)


@router.patch("/trainer/profile")
async def update_my_trainer_profile(
    payload: TrainerSelfUpdate, user: User = Depends(get_current_user)
):
    trainer_user = await _require_trainer(user)
    trainer = await Trainer.find_one(Trainer.user_id == str(trainer_user.id))
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(trainer, field, value)
    await trainer.save()
    return _trainer_to_out(trainer)