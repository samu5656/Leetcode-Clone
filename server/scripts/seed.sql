-- Admin:  admin@dsa.local / Admin@123
INSERT INTO users (email, username, password_hash, display_name, role)
VALUES (
    'admin@dsa-contest.com',
    'admin',
    '$2a$12$3.Edmpo.wk6tPTabf.B5ee.1.su3OiKc8mxzgz.m1hzK.DyG3hk/e',
    'Admin',
    'admin'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;
