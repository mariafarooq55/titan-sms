from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.student import Student
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User
from app.routers.me import _require_student_profile, _require_trainer_profile, _verify_trainer_slot
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentOut,
    AssignmentUpdate,
    SubmissionCreate,
    SubmissionGrade,
    SubmissionOut,
)
from app.schemas.quiz import (
    QuizAttemptCreate,
    QuizAttemptOut,
    QuizCreate,
    QuizOut,
    QuizPublicOut,
    QuizQuestionFull,
    QuizQuestionPublic,
)

router = APIRouter(prefix="/api/me", tags=["coursework"])


# ==================== Assignments — Trainer side ====================


@router.post("/assignments", response_model=AssignmentOut)
async def create_assignment(payload: AssignmentCreate, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    await _verify_trainer_slot(trainer, payload.slot_id)

    assignment = Assignment(**payload.model_dump())
    await assignment.insert()
    return AssignmentOut(
        id=str(assignment.id),
        slot_id=assignment.slot_id,
        title=assignment.title,
        instructions=assignment.instructions,
        links=assignment.links,
        images=assignment.images,
        topics=assignment.topics,
        is_hackathon=assignment.is_hackathon,
        due_date=assignment.due_date,
    )


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
async def update_assignment(
    assignment_id: str, payload: AssignmentUpdate, user: User = Depends(get_current_user)
):
    trainer = await _require_trainer_profile(user)
    assignment = await Assignment.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await _verify_trainer_slot(trainer, assignment.slot_id)

    assignment.title = payload.title
    assignment.instructions = payload.instructions
    assignment.links = payload.links
    assignment.images = payload.images
    assignment.topics = payload.topics
    assignment.is_hackathon = payload.is_hackathon
    assignment.due_date = payload.due_date
    await assignment.save()

    return AssignmentOut(
        id=str(assignment.id),
        slot_id=assignment.slot_id,
        title=assignment.title,
        instructions=assignment.instructions,
        links=assignment.links,
        images=assignment.images,
        topics=assignment.topics,
        is_hackathon=assignment.is_hackathon,
        due_date=assignment.due_date,
    )


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    assignment = await Assignment.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await _verify_trainer_slot(trainer, assignment.slot_id)

    await assignment.delete()
    return {"message": "Assignment deleted"}


@router.get("/assignments")
async def list_assignments(slot_id: str = Query(...), user: User = Depends(get_current_user)):
    """Works for both trainers (their own slot) and students (their enrolled slot)."""
    if user.role.value == "trainer":
        trainer = await _require_trainer_profile(user)
        await _verify_trainer_slot(trainer, slot_id)
        student = None
    else:
        student = await _require_student_profile(user)
        enrollment = await Enrollment.find_one(
            Enrollment.student_id == str(student.id), Enrollment.slot_id == slot_id
        )
        if not enrollment:
            raise HTTPException(status_code=403, detail="You're not enrolled in this slot")

    assignments = await Assignment.find(Assignment.slot_id == slot_id).to_list()

    items = []
    for a in assignments:
        my_status = None
        if student:
            sub = await Submission.find_one(
                Submission.assignment_id == str(a.id), Submission.student_id == str(student.id)
            )
            if sub:
                my_status = sub.status.value
            else:
                my_status = "late" if a.due_date < date.today() else "not_submitted"
        items.append(
            AssignmentOut(
                id=str(a.id),
                slot_id=a.slot_id,
                title=a.title,
                instructions=a.instructions,
                links=a.links,
                images=a.images,
                topics=a.topics,
                is_hackathon=a.is_hackathon,
                due_date=a.due_date,
                my_submission_status=my_status,
            )
        )
    return {"items": items, "total": len(items)}


@router.get("/assignments/{assignment_id}/submissions")
async def list_submissions(assignment_id: str, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    assignment = await Assignment.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await _verify_trainer_slot(trainer, assignment.slot_id)

    submissions = await Submission.find(Submission.assignment_id == assignment_id).to_list()
    items = []
    for s in submissions:
        student = await Student.get(s.student_id)
        items.append(
            SubmissionOut(
                id=str(s.id),
                assignment_id=s.assignment_id,
                student_id=s.student_id,
                student_name=student.full_name if student else "(unknown)",
                files=s.files,
                links=s.links,
                submitted_at=s.submitted_at,
                status=s.status,
                feedback=s.feedback,
            )
        )
    return {"items": items, "total": len(items)}


@router.patch("/submissions/{submission_id}", response_model=SubmissionOut)
async def grade_submission(
    submission_id: str, payload: SubmissionGrade, user: User = Depends(get_current_user)
):
    trainer = await _require_trainer_profile(user)
    submission = await Submission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assignment = await Assignment.get(submission.assignment_id)
    if assignment:
        await _verify_trainer_slot(trainer, assignment.slot_id)

    submission.status = payload.status
    submission.feedback = payload.feedback
    await submission.save()

    student = await Student.get(submission.student_id)
    return SubmissionOut(
        id=str(submission.id),
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        student_name=student.full_name if student else "(unknown)",
        files=submission.files,
        links=submission.links,
        submitted_at=submission.submitted_at,
        status=submission.status,
        feedback=submission.feedback,
    )


# ==================== Assignments — Student side ====================


@router.post("/submissions", response_model=SubmissionOut)
async def submit_assignment(payload: SubmissionCreate, user: User = Depends(get_current_user)):
    student = await _require_student_profile(user)
    assignment = await Assignment.get(payload.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    enrollment = await Enrollment.find_one(
        Enrollment.student_id == str(student.id), Enrollment.slot_id == assignment.slot_id
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="You're not enrolled in this course")

    existing = await Submission.find_one(
        Submission.assignment_id == payload.assignment_id,
        Submission.student_id == str(student.id),
    )
    is_late = assignment.due_date < date.today()
    status = SubmissionStatus.LATE if is_late else SubmissionStatus.PENDING

    if existing:
        existing.files = payload.files
        existing.links = payload.links
        existing.status = status
        existing.submitted_at = datetime.now(timezone.utc)
        await existing.save()
        submission = existing
    else:
        submission = Submission(
            assignment_id=payload.assignment_id,
            student_id=str(student.id),
            files=payload.files,
            links=payload.links,
            status=status,
        )
        await submission.insert()

    return SubmissionOut(
        id=str(submission.id),
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        student_name=student.full_name,
        files=submission.files,
        links=submission.links,
        submitted_at=submission.submitted_at,
        status=submission.status,
        feedback=submission.feedback,
    )


# ==================== Quizzes — Trainer side ====================


@router.post("/quizzes", response_model=QuizOut)
async def create_quiz(payload: QuizCreate, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    await _verify_trainer_slot(trainer, payload.slot_id)

    quiz = Quiz(
        slot_id=payload.slot_id,
        title=payload.title,
        questions=[QuizQuestion(**q.model_dump()) for q in payload.questions],
        expiry_date=payload.expiry_date,
    )
    await quiz.insert()
    return QuizOut(
        id=str(quiz.id),
        slot_id=quiz.slot_id,
        title=quiz.title,
        questions=[QuizQuestionFull(**q.model_dump()) for q in quiz.questions],
        expiry_date=quiz.expiry_date,
    )


@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    quiz = await Quiz.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    await _verify_trainer_slot(trainer, quiz.slot_id)

    await quiz.delete()
    return {"message": "Quiz deleted"}


@router.get("/quizzes/{quiz_id}/attempts")
async def list_quiz_attempts(quiz_id: str, user: User = Depends(get_current_user)):
    trainer = await _require_trainer_profile(user)
    quiz = await Quiz.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    await _verify_trainer_slot(trainer, quiz.slot_id)

    attempts = await QuizAttempt.find(QuizAttempt.quiz_id == quiz_id).to_list()
    items = []
    for a in attempts:
        student = await Student.get(a.student_id)
        items.append(
            QuizAttemptOut(
                id=str(a.id),
                quiz_id=a.quiz_id,
                student_id=a.student_id,
                student_name=student.full_name if student else "(unknown)",
                score=a.score,
                total=a.total,
                submitted_at=a.submitted_at,
            )
        )
    return {"items": items, "total": len(items)}


# ==================== Quizzes — Student side ====================


@router.get("/quizzes")
async def list_quizzes(slot_id: str = Query(...), user: User = Depends(get_current_user)):
    """Works for both trainers (full, with answers) and students (public, no answers)."""
    if user.role.value == "trainer":
        trainer = await _require_trainer_profile(user)
        await _verify_trainer_slot(trainer, slot_id)
        quizzes = await Quiz.find(Quiz.slot_id == slot_id).to_list()
        items = [
            QuizOut(
                id=str(q.id),
                slot_id=q.slot_id,
                title=q.title,
                questions=[QuizQuestionFull(**qq.model_dump()) for qq in q.questions],
                expiry_date=q.expiry_date,
            )
            for q in quizzes
        ]
        return {"items": items, "total": len(items)}

    student = await _require_student_profile(user)
    enrollment = await Enrollment.find_one(
        Enrollment.student_id == str(student.id), Enrollment.slot_id == slot_id
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="You're not enrolled in this slot")

    quizzes = await Quiz.find(Quiz.slot_id == slot_id).to_list()
    items = []
    for q in quizzes:
        attempted = await QuizAttempt.find_one(
            QuizAttempt.quiz_id == str(q.id), QuizAttempt.student_id == str(student.id)
        )
        items.append(
            QuizPublicOut(
                id=str(q.id),
                slot_id=q.slot_id,
                title=q.title,
                questions=[QuizQuestionPublic(text=qq.text, options=qq.options) for qq in q.questions],
                expiry_date=q.expiry_date,
                already_attempted=attempted is not None,
            )
        )
    return {"items": items, "total": len(items)}


@router.post("/quiz-attempts", response_model=QuizAttemptOut)
async def submit_quiz_attempt(payload: QuizAttemptCreate, user: User = Depends(get_current_user)):
    student = await _require_student_profile(user)
    quiz = await Quiz.get(payload.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    enrollment = await Enrollment.find_one(
        Enrollment.student_id == str(student.id), Enrollment.slot_id == quiz.slot_id
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="You're not enrolled in this course")

    existing = await QuizAttempt.find_one(
        QuizAttempt.quiz_id == payload.quiz_id, QuizAttempt.student_id == str(student.id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="You've already taken this quiz")

    score = sum(
        1
        for i, q in enumerate(quiz.questions)
        if i < len(payload.answers) and payload.answers[i] == q.correct_index
    )

    attempt = QuizAttempt(
        quiz_id=payload.quiz_id,
        student_id=str(student.id),
        answers=payload.answers,
        score=score,
        total=len(quiz.questions),
    )
    await attempt.insert()

    return QuizAttemptOut(
        id=str(attempt.id),
        quiz_id=attempt.quiz_id,
        student_id=attempt.student_id,
        student_name=student.full_name,
        score=attempt.score,
        total=attempt.total,
        submitted_at=attempt.submitted_at,
    )