from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user
from app.models.attendance import Attendance, AttendanceStatus
from app.models.enrollment import Enrollment
from app.models.slot import Slot
from app.models.student import Student
from app.models.user import Role, User
from app.models.voucher import Voucher
from app.routers.enrollments import to_out as enrollment_to_out
from app.routers.voucher import to_out as voucher_to_out
from app.schemas.student import StudentOut, StudentSelfUpdate

router = APIRouter(prefix="/api/me", tags=["me"])


async def _require_student_profile(user: User) -> Student:
    if user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="This endpoint is for student accounts only")
    student = await Student.find_one(Student.cnic == user.login_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="No student profile linked to this login. Ask the office to re-register you.",
        )
    return student


async def _require_trainer_profile(user: User) -> User:
    """
    Trainer identity is the User itself (matched to slots by full_name),
    consistent with app/routers/trainer.py's Slot.trainer == user.full_name pattern.
    """
    if user.role != Role.TRAINER:
        raise HTTPException(status_code=403, detail="This endpoint is for trainer accounts only")
    return user


async def _verify_trainer_slot(trainer: User, slot_id: str) -> Slot:
    slot = await Slot.get(slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.trainer != trainer.full_name:
        raise HTTPException(status_code=403, detail="This slot is not assigned to you")
    return slot


def _student_to_out(student: Student) -> StudentOut:
    return StudentOut(
        id=str(student.id),
        full_name=student.full_name,
        father_name=student.father_name,
        cnic=student.cnic,
        phone=student.phone,
        email=student.email,
        father_cnic=student.father_cnic,
        father_phone=student.father_phone,
        dob=student.dob,
        gender=student.gender,
        address=student.address,
        last_qualification=student.last_qualification,
        computer_level=student.computer_level,
        has_laptop=student.has_laptop,
        status=student.status,
        payment_status=student.payment_status,
        course=student.course,
        campus=student.campus,
        batch=student.batch,
    )


@router.get("/student", response_model=StudentOut)
async def get_my_profile(user: User = Depends(get_current_user)):
    student = await _require_student_profile(user)
    return _student_to_out(student)


@router.patch("/student", response_model=StudentOut)
async def update_my_profile(
    payload: StudentSelfUpdate, user: User = Depends(get_current_user)
):
    student = await _require_student_profile(user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(student, field, value)
    await student.save()
    return _student_to_out(student)


@router.get("/enrollments")
async def get_my_enrollments(user: User = Depends(get_current_user)):
    student = await _require_student_profile(user)
    enrollments = await Enrollment.find(Enrollment.student_id == str(student.id)).to_list()
    items = [await enrollment_to_out(e) for e in enrollments]
    return {"items": items, "total": len(items)}


@router.get("/attendance")
async def get_my_attendance(
    enrollment_id: str = Query(...), user: User = Depends(get_current_user)
):
    student = await _require_student_profile(user)
    enrollment = await Enrollment.get(enrollment_id)
    if not enrollment or enrollment.student_id != str(student.id):
        raise HTTPException(status_code=404, detail="Enrollment not found")

    records = await Attendance.find(Attendance.enrollment_id == enrollment_id).to_list()
    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    total = len(records)
    percentage = round((present / total) * 100, 1) if total else 0.0

    return {
        "present_count": present,
        "leave_count": leave,
        "absent_count": absent,
        "total": total,
        "percentage": percentage,
        "records": [
            {"date": r.date, "status": r.status}
            for r in sorted(records, key=lambda r: r.date, reverse=True)
        ],
    }


@router.get("/vouchers")
async def get_my_vouchers(enrollment_id: str = Query(...), user: User = Depends(get_current_user)):
    student = await _require_student_profile(user)
    enrollment = await Enrollment.get(enrollment_id)
    if not enrollment or enrollment.student_id != str(student.id):
        raise HTTPException(status_code=404, detail="Enrollment not found")

    vouchers = await Voucher.find(Voucher.enrollment_id == enrollment_id).to_list()
    items = [voucher_to_out(v) for v in vouchers]
    return {"items": items, "total": len(items)}