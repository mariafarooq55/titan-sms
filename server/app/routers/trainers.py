from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import hash_password
from app.deps import require_permission
from app.models.trainer import Trainer
from app.models.user import User, Role, Module
from app.schemas.trainer import TrainerCreate, TrainerOut, TrainerUpdate

router = APIRouter(prefix="/api/trainers", tags=["trainers"])


def to_out(trainer: Trainer) -> TrainerOut:
    return TrainerOut(
        id=str(trainer.id),
        employee_id=trainer.employee_id,
        full_name=trainer.full_name,
        full_name_urdu=trainer.full_name_urdu,
        bio=trainer.bio,
        phone=trainer.phone,
        email=trainer.email,
        hourly_rate=trainer.hourly_rate,
        social_links=trainer.social_links,
        city=trainer.city,
        campus=trainer.campus,
        courses=trainer.courses,
    )


@router.post(
    "",
    response_model=TrainerOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Module.TRAINERS, "write"))],
)
async def create_trainer(payload: TrainerCreate):
    if await Trainer.find_one(Trainer.employee_id == payload.employee_id):
        raise HTTPException(status_code=409, detail="A trainer with this Employee ID already exists")
    if await User.find_one(User.login_id == payload.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    # Every trainer gets a login account (they sign into the Trainer Portal with it)
    user = User(
        login_id=payload.email,
        password_hash=hash_password(payload.password),
        role=Role.TRAINER,
        full_name=payload.full_name,
        campus_id=payload.campus,
    )
    await user.insert()

    trainer = Trainer(
        user_id=str(user.id),
        employee_id=payload.employee_id,
        full_name=payload.full_name,
        full_name_urdu=payload.full_name_urdu,
        bio=payload.bio,
        phone=payload.phone,
        email=payload.email,
        hourly_rate=payload.hourly_rate,
        social_links=payload.social_links,
        city=payload.city,
        campus=payload.campus,
        courses=payload.courses,
    )
    await trainer.insert()
    return to_out(trainer)


@router.get(
    "",
    dependencies=[Depends(require_permission(Module.TRAINERS, "read"))],
)
async def list_trainers():
    trainers = await Trainer.find_all().to_list()
    return {"items": [to_out(t) for t in trainers], "total": len(trainers)}


@router.get(
    "/{trainer_id}",
    response_model=TrainerOut,
    dependencies=[Depends(require_permission(Module.TRAINERS, "read"))],
)
async def get_trainer(trainer_id: str):
    trainer = await Trainer.get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return to_out(trainer)


@router.patch(
    "/{trainer_id}",
    response_model=TrainerOut,
    dependencies=[Depends(require_permission(Module.TRAINERS, "update"))],
)
async def update_trainer(trainer_id: str, payload: TrainerUpdate):
    trainer = await Trainer.get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(trainer, field, value)
    await trainer.save()
    return to_out(trainer)