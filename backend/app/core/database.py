from psycopg_pool import AsyncConnectionPool

from backend.app.core.config import get_settings

#四个关于pgsql的函数

# 全局变量，保存连接池实例；初始None代表还没初始化
_meta_pool: AsyncConnectionPool | None = None
_query_pool: AsyncConnectionPool | None = None

# 创建操作数据库超级管理员的连接对象
async def create_meta_pool() -> AsyncConnectionPool:
    """
    创建PostgreSQL异步连接池 psycopg_pool.AsyncConnectionPool
    """
    global _meta_pool  # 声明使用全局变量，不是函数内局部变量
    if _meta_pool is None:
        settings=get_settings()
        pool = AsyncConnectionPool(
            conninfo=settings.POSTGRES_DSN,
            min_size=1,
            max_size=10,
            open=False
        )
        # 预热连接池，预先创建min_size个连接
        await pool.open(wait=True)
        _meta_pool = pool
        return pool
    else:
        return _meta_pool


# 创建查询数据库的连接对象   单例模式
async def create_query_pool() -> AsyncConnectionPool:
    """
     创建PostgreSQL异步连接池 psycopg_pool.AsyncConnectionPool
    """
    global _query_pool  # 声明使用全局变量，不是函数内局部变量
    if _query_pool is None:
        settings=get_settings()
        pool = AsyncConnectionPool(
            conninfo=settings.QUERY_POSTGRES_DSN,
            min_size=1,
            max_size=10,
            open=False
        )
        # 预热连接池，预先创建min_size个连接
        await pool.open(wait=True)
        _query_pool=pool
        return pool
    else:
        return _query_pool


#- 关闭池子并且把全局变量置为`None`；置空后，如果后续又调用`get_meta_pool()`，会重新新建连接池。
async def close_pools() -> None:
    global _meta_pool, _query_pool
    if _query_pool:
        await _query_pool.close() # 优雅关闭连接池，释放所有数据库连接
        _query_pool = None        # 置空，下次调用get_xxx_pool会重新初始化
    if _meta_pool:
        await _meta_pool.close()
        _meta_pool = None


# 使用pgsql 判断数据库连接是否正常，返回true false ,使用 select 1 来校验，连接的话，实用_meta_pool

async def ping_database() -> bool:
    """
    使用 SELECT 1 校验 _meta_pool 连接是否正常
    :param meta_pool: 元数据库异步连接池实例
    :return: True 连接正常；False 异常/池为空
    """
    meta_pool = await create_meta_pool()
    if meta_pool is None or meta_pool.closed:
        return False
    try:
        async with meta_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1;")
                result = await cur.fetchone()
                return result is not None and result[0] == 1
    except Exception:
        return False