from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import close_pools
from backend.api.router import api_router


# 这里创建一个 create_app文件，得到app 对象
@asynccontextmanager
async def lifespan(_: FastAPI):
    print("app创建之前，我想做一些事情.....")
    yield   # 是一个分水岭，这个词之前 是app创建前的代码，这个之后是app 销毁之后做的事情
    await close_pools()


def create_app()->FastAPI:
    application=FastAPI(
            title="自然语言转SQL",
            version="0.1.0",
            lifespan=lifespan
    )

    settings=get_settings()
    # 实现跨域的代码

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 加载路由，指定前缀
    application.include_router(
        api_router,
        prefix=settings.API_PREFIX,
    )

    @application.get("/")
    async def root() -> dict:
        return {
            "name": "太湖问数智能体",
            "docs": "/docs",
            "health": f"{settings.API_PREFIX}/health",
        }

    return application


app = create_app()