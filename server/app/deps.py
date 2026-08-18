from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.models.user import User, Module

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    user = await User.get(user_id)
    if user is None or not user.is_active:
        raise credentials_error

    return user


def require_permission(module: Module, action: str):
    """
    Use as a route dependency to enforce server-side permissions, e.g.:

        @router.get("/students", dependencies=[Depends(require_permission(Module.STUDENTS, "read"))])

    This is the ONE place permission logic lives — every protected route in the
    app should go through this instead of re-checking roles by hand.
    """

    async def checker(user: User = Depends(get_current_user)) -> User:
        if not user.has_permission(module, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have '{action}' permission on '{module.value}'",
            )
        return user

    return checker
