from pydantic import BaseModel


class ChartPoint(BaseModel):
    label: str
    count: int


class DashboardSummary(BaseModel):
    total_students: int
    enrolled_students: int
    courses: int
    cities: int
    campuses: int
    trainers: int
    active_slots: int
    registration_open_count: int
    students_per_campus: list[ChartPoint]
    students_per_course: list[ChartPoint]