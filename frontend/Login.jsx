import './Login.css';

function Login() {
    return(
        <div className="login-box">
            <h1>Login</h1>
            <div>
                <input type="text" className="username" placeholder="Username"/>
            </div>
            <div>
                <input type="text" className="password" placeholder="Password"/>
            </div>
        </div>
    );
}

export default Login;