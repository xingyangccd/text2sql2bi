import asyncio
import selectors

from app.core.database import create_meta_pool, create_query_pool, ping_database, close_pools


# 在这个里面，编写函数，校验 database中的四个函数是否正确
async def main():
    meta_pool = await create_meta_pool()
    print(meta_pool)
    query_pool =await create_query_pool()
    print(query_pool)

    result=await ping_database()
    print(result)

    await close_pools()

if __name__ == '__main__':
    # Windows 下 Python 默认事件循环是 `ProactorEventLoop`，**psycopg3 的异步模式不支持它**，必须改用 `SelectorEventLoop`。
    loop_factory = lambda: asyncio.SelectorEventLoop(selectors.SelectSelector())
    asyncio.run(main(), loop_factory=loop_factory)