from app.api.v1.access import router as access_router
from app.api.v1.auth import router as auth_router
from app.api.v1.saas import router as saas_router
from fastapi import APIRouter

router = APIRouter()
router.include_router(access_router)
router.include_router(auth_router)
router.include_router(saas_router)
