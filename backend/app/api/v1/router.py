from app.api.v1.access import router as access_router
from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.configurations import router as configurations_router
from app.api.v1.control import router as control_router
from app.api.v1.home import router as home_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.manifests import router as manifests_router
from app.api.v1.operations import router as operations_router
from app.api.v1.product_users import router as product_users_router
from app.api.v1.saas import router as saas_router
from fastapi import APIRouter

router = APIRouter()
router.include_router(access_router)
router.include_router(audit_router)
router.include_router(configurations_router)
router.include_router(control_router)
router.include_router(auth_router)
router.include_router(home_router)
router.include_router(integrations_router)
router.include_router(manifests_router)
router.include_router(operations_router)
router.include_router(product_users_router)
router.include_router(saas_router)
