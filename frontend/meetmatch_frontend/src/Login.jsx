import { useState } from "react";
import './Login.css';

export default function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword]  = useState(""); // Figure out hashing.

    return(
        <div className="login-box">
            <div>
                <input 
                    type="text" 
                    className="username"
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <input 
                    type="text" 
                    className="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)} 
                />
            </div>
        </div>
    );
}