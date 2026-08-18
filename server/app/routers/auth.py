from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_password, hash_password, create_access_token
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await User.find_one(User.login_id == payload.login_id)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login ID or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token(subject=str(user.id), extra_claims={"role": user.role})
    return TokenResponse(access_token=token, role=user.role, full_name=user.full_name)


@router.get("/me", response_model=UserOut)
async def get_my_profile(user: User = Depends(get_current_user)):
    return UserOut(
        id=str(user.id),
        login_id=user.login_id,
        role=user.role,
        full_name=user.full_name,
        campus_id=user.campus_id,
        permissions=user.permissions,
    )


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest, user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = hash_password(payload.new_password)
    await user.save()
    return {"message": "Password updated successfully"}