from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_permission
from app.models.enrollment import Enrollment
from app.models.user import Module
from app.models.voucher import Voucher
from app.schemas.voucher import VoucherCreate, VoucherOut, VoucherUpdate

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])


def to_out(voucher: Voucher) -> VoucherOut:
    return VoucherOut(
        id=str(voucher.id),
        enrollment_id=voucher.enrollment_id,
        invoice_number=voucher.invoice_number,
        payment_id=voucher.payment_id,
        type=voucher.type,
        month=voucher.month,
        due_date=voucher.due_date,
        amount=voucher.amount,
        status=voucher.status,
    )


async def _next_invoice_number() -> str:
    count = await Voucher.find_all().count()
    return f"INV-{count + 1:06d}"


@router.post(
    "",
    response_model=VoucherOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Module.STUDENTS, "write"))],
)
async def generate_voucher(payload: VoucherCreate):
    enrollment = await Enrollment.get(payload.enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    voucher = Voucher(
        enrollment_id=payload.enrollment_id,
        invoice_number=await _next_invoice_number(),
        type=payload.type,
        month=payload.month,
        due_date=payload.due_date,
        amount=payload.amount,
    )
    await voucher.insert()
    return to_out(voucher)


@router.get(
    "",
    dependencies=[Depends(require_permission(Module.STUDENTS, "read"))],
)
async def list_vouchers(enrollment_id: str = Query(...)):
    vouchers = await Voucher.find(Voucher.enrollment_id == enrollment_id).to_list()
    items = [to_out(v) for v in vouchers]
    return {"items": items, "total": len(items)}


@router.patch(
    "/{voucher_id}",
    response_model=VoucherOut,
    dependencies=[Depends(require_permission(Module.STUDENTS, "update"))],
)
async def update_voucher(voucher_id: str, payload: VoucherUpdate):
    voucher = await Voucher.get(voucher_id)
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")

    voucher.status = payload.status
    if payload.payment_id is not None:
        voucher.payment_id = payload.payment_id
    await voucher.save()
    return to_out(voucher)