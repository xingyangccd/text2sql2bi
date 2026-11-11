# 编写一个system下的接口，用于检查数据库连接是否正常，接口的url /health
from fastapi import APIRouter

from backend.app.core.database import ping_database

router = APIRouter(tags=["system"])

@router.get("/health", summary="系统健康检查")
async def health_check():
    """健康检查接口：校验meta数据库连接"""
    db_ok = await ping_database()
    if db_ok:
        return {"status": "ok", "db_meta": True}
    else:
        return {"status": "degraded", "db_meta": False}, 503

