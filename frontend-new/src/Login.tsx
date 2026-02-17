

const Login = () => {
    const handleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a)',
            color: 'var(--text-primary)'
        }}>
            <div style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Meeting Scheduler
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Your intelligent AI assistant for effortless calendar management.
                </p>

                <button
                    onClick={handleLogin}
                    style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        color: 'white',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        width: '100%',
                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
                    Sign in with Google
                </button>
            </div>

            <footer style={{ marginTop: '2rem', color: '#475569', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} Meeting Scheduler Agent | <a href="/privacy" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy Policy</a>
            </footer>
        </div>
    );
};

export default Login;
