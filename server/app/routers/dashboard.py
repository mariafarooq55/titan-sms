from collections import defaultdict

from fastapi import APIRouter, Depends

from app.deps import require_permission
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.slot import Slot
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.user import Module
from app.schemas.dashboard import ChartPoint, DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummary,
    dependencies=[Depends(require_permission(Module.DASHBOARD, "read"))],
)
async def dashboard_summary():
    slots = await Slot.find_all().to_list()
    slot_by_id = {str(s.id): s for s in slots}

    total_students = await Student.find_all().count()
    trainers_count = await Trainer.find_all().count()

    enrolled_student_ids = {
        e.student_id
        for e in await Enrollment.find(
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).to_list()
    }
    enrolled_students = len(enrolled_student_ids)

    courses = len({s.course for s in slots if s.course})
    cities = len({s.city for s in slots if s.city})
    campuses = len({s.campus for s in slots if s.campus})
    active_slots = len(slots)
    registration_open_count = sum(1 for s in slots if s.registration_open)

    active_enrollments = await Enrollment.find(
        Enrollment.status != EnrollmentStatus.DROPOUT
    ).to_list()

    campus_counts: dict[str, int] = defaultdict(int)
    course_counts: dict[str, int] = defaultdict(int)
    for e in active_enrollments:
        slot = slot_by_id.get(e.slot_id)
        if not slot:
            continue
        if slot.campus:
            campus_counts[slot.campus] += 1
        if slot.course:
            course_counts[slot.course] += 1

    students_per_campus = [
        ChartPoint(label=label, count=count)
        for label, count in sorted(
            campus_counts.items(), key=lambda kv: kv[1], reverse=True
        )
    ]
    students_per_course = [
        ChartPoint(label=label, count=count)
        for label, count in sorted(
            course_counts.items(), key=lambda kv: kv[1], reverse=True
        )
    ]

    return DashboardSummary(
        total_students=total_students,
        enrolled_students=enrolled_students,
        courses=courses,
        cities=cities,
        campuses=campuses,
        trainers=trainers_count,
        active_slots=active_slots,
        registration_open_count=registration_open_count,
        students_per_campus=students_per_campus,
        students_per_course=students_per_course,
    )