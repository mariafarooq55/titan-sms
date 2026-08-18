from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_permission
from app.models.student import Student
from app.models.user import Module
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate

router = APIRouter(prefix="/api/students", tags=["students"])


def to_out(student: Student) -> StudentOut:
    return StudentOut(
        id=str(student.id),
        full_name=student.full_name,
        father_name=student.father_name,
        cnic=student.cnic,
        phone=student.phone,
        email=student.email,
        status=student.status,
        payment_status=student.payment_status,
        course=student.course,
        campus=student.campus,
        batch=student.batch,
    )


@router.post(
    "",
    response_model=StudentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Module.STUDENTS, "write"))],
)
async def create_student(payload: StudentCreate):
    if await Student.find_one(Student.cnic == payload.cnic):
        raise HTTPException(status_code=409, detail="A student with this CNIC already exists")
    if payload.email and await Student.find_one(Student.email == payload.email):
        raise HTTPException(status_code=409, detail="A student with this email already exists")

    student = Student(**payload.model_dump())
    await student.insert()
    return to_out(student)


@router.get(
    "",
    dependencies=[Depends(require_permission(Module.STUDENTS, "read"))],
)
async def list_students(
    search: str | None = Query(None, description="Matches name, CNIC, or phone"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = {}
    if search:
        query = {
            "$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"cnic": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
            ]
        }

    skip = (page - 1) * page_size
    total = await Student.find(query).count()
    students = await Student.find(query).skip(skip).limit(page_size).to_list()

    return {
        "items": [to_out(s) for s in students],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/{student_id}",
    response_model=StudentOut,
    dependencies=[Depends(require_permission(Module.STUDENTS, "read"))],
)
async def get_student(student_id: str):
    student = await Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return to_out(student)


@router.patch(
    "/{student_id}",
    response_model=StudentOut,
    dependencies=[Depends(require_permission(Module.STUDENTS, "update"))],
)
async def update_student(student_id: str, payload: StudentUpdate):
    student = await Student.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(student, field, value)
    await student.save()
    return to_out(student)