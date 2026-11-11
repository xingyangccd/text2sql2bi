-- 创建只读账号 bi_reader，设置密码
CREATE USER bi_reader WITH PASSWORD 'bi_reader_password';

-- 允许该用户连接数据库 text2sql2bi
GRANT CONNECT ON DATABASE text2sql2bi TO bi_reader;

-- 允许使用 public 模式（可以看到public下面的表，但是还没有select权限）
GRANT USAGE ON SCHEMA public TO bi_reader;
