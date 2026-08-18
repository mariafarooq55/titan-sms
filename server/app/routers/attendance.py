from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_permission, get_current_user
from app.models.attendance import Attendance, AttendanceStatus
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.student import Student
from app.models.user import Module, User
from app.schemas.attendance import (
    AttendanceRecordOut,
    MarkAttendanceRequest,
    MarkAttendanceResponse,
    MultiMarkRequest,
    MultiMarkResponse,
    ViewAttendanceResponse,
)

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


async def _find_active_enrollment(slot_id: str, roll_number: str) -> Enrollment | None:
    return await Enrollment.find_one(
        Enrollment.slot_id == slot_id,
        Enrollment.roll_number == roll_number,
        Enrollment.status != EnrollmentStatus.DROPOUT,
    )


@router.get(
    "/lookup",
    dependencies=[Depends(require_permission(Module.ATTENDANCE_MARK, "read"))],
)
async def lookup_student(slot_id: str = Query(...), roll_number: str = Query(...)):
    enrollment = await _find_active_enrollment(slot_id, roll_number)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Roll number not found in this slot")

    student = await Student.get(enrollment.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    return {
        "student_name": student.full_name,
        "roll_number": enrollment.roll_number,
        "photo_url": student.photo_url,
        "payment_warning": student.payment_status != "paid",
    }


@router.post(
    "/mark",
    response_model=MarkAttendanceResponse,
    dependencies=[Depends(require_permission(Module.ATTENDANCE_MARK, "write"))],
)
async def mark_attendance(payload: MarkAttendanceRequest, user: User = Depends(get_current_user)):
    enrollment = await _find_active_enrollment(payload.slot_id, payload.roll_number)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Roll number not found in this slot")

    student = await Student.get(enrollment.student_id)

    existing = await Attendance.find_one(
        Attendance.enrollment_id == str(enrollment.id),
        Attendance.date == payload.date,
    )

    was_updated = False
    if existing:
        was_updated = existing.status != payload.status
        existing.status = payload.status
        existing.marked_by = str(user.id)
        await existing.save()
    else:
        record = Attendance(
            enrollment_id=str(enrollment.id),
            slot_id=payload.slot_id,
            date=payload.date,
            status=payload.status,
            marked_by=str(user.id),
        )
        await record.insert()

    return MarkAttendanceResponse(
        student_name=student.full_name if student else "(unknown)",
        roll_number=enrollment.roll_number,
        status=payload.status,
        payment_warning=(student.payment_status != "paid") if student else False,
        was_updated=was_updated,
    )


@router.post(
    "/multi",
    response_model=MultiMarkResponse,
    dependencies=[Depends(require_permission(Module.ATTENDANCE_MULTI, "write"))],
)
async def mark_multi(payload: MultiMarkRequest, user: User = Depends(get_current_user)):
    marked, updated, already_marked, not_found = [], [], [], []

    for roll_number in payload.roll_numbers:
        roll_number = roll_number.strip()
        if not roll_number:
            continue

        enrollment = await _find_active_enrollment(payload.slot_id, roll_number)
        if not enrollment:
            not_found.append(roll_number)
            continue

        existing = await Attendance.find_one(
            Attendance.enrollment_id == str(enrollment.id),
            Attendance.date == payload.date,
        )
        if existing:
            if existing.status == payload.status:
                already_marked.append(roll_number)
            else:
                existing.status = payload.status
                existing.marked_by = str(user.id)
                await existing.save()
                updated.append(roll_number)
            continue

        record = Attendance(
            enrollment_id=str(enrollment.id),
            slot_id=payload.slot_id,
            date=payload.date,
            status=payload.status,
            marked_by=str(user.id),
        )
        await record.insert()
        marked.append(roll_number)

    return MultiMarkResponse(
        marked=marked, updated=updated, already_marked=already_marked, not_found=not_found
    )


@router.get(
    "/view",
    response_model=ViewAttendanceResponse,
    dependencies=[Depends(require_permission(Module.ATTENDANCE_VIEW, "read"))],
)
async def view_attendance(slot_id: str = Query(...), roll_number: str = Query(...)):
    enrollment = await _find_active_enrollment(slot_id, roll_number)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Roll number not found in this slot")

    student = await Student.get(enrollment.student_id)
    records = await Attendance.find(Attendance.enrollment_id == str(enrollment.id)).to_list()

    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    total = len(records)
    percentage = round((present / total) * 100, 1) if total else 0.0

    return ViewAttendanceResponse(
        student_name=student.full_name if student else "(unknown)",
        roll_number=enrollment.roll_number,
        present_count=present,
        leave_count=leave,
        absent_count=absent,
        total=total,
        percentage=percentage,
        records=[
            AttendanceRecordOut(
                date=r.date,
                status=r.status,
                student_name=student.full_name if student else "(unknown)",
                roll_number=enrollment.roll_number,
            )
            for r in sorted(records, key=lambda r: r.date, reverse=True)
        ],
    )


@router.get(
    "/recent",
    dependencies=[Depends(require_permission(Module.ATTENDANCE_MARK, "read"))],
)
async def recent_attendance(slot_id: str = Query(...), limit: int = Query(20, le=100)):
    records = (
        await Attendance.find(Attendance.slot_id == slot_id)
        .sort(-Attendance.created_at)
        .limit(limit)
        .to_list()
    )

    items = []
    for r in records:
        enrollment = await Enrollment.get(r.enrollment_id)
        student = await Student.get(enrollment.student_id) if enrollment else None
        items.append(
            {
                "date": r.date,
                "status": r.status,
                "roll_number": enrollment.roll_number if enrollment else "?",
                "student_name": student.full_name if student else "(unknown)",
            }
        )
    return {"items": items}