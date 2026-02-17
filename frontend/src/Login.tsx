import React from 'react';

const Login = () => {
    const handleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1>Meeting Scheduler Agent</h1>
            <p>Please log in to manage your calendar.</p>
            <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                Login with Google
            </button>
        </div>
    );
};

export default Login;
