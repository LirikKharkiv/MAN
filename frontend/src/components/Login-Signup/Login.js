import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Import authentication context
import { useThemeToggle } from '../Home/ThemeContext'; // Import theme context

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth(); // Get login function from context
    const { darkMode } = useThemeToggle(); // Get theme state

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const validateForm = () => {
        const validationErrors = {};
        if (!formData.email) validationErrors.email = "Email is required.";
        if (!formData.password) validationErrors.password = "Password is required.";
        return validationErrors;
    };

    const handleErrorResponse = (error) => {
        console.error("Login error response:", error);
        const message = error.response?.status === 409
            ? 'Email already exists. Please login or try a different email.'
            : error.response?.data?.detail || 'Login failed. Please check your credentials.';
        setErrorMessage(message);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = validateForm();
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrorMessage('');  // Clear previous error message
        
        try {
            const response = await axios.post('http://127.0.0.1:8081/login', formData);
            if (response.data.access_token) {
                login(response.data.access_token); // Store the token in context
                navigate('/home'); // Navigate to home page upon successful login
            } else {
                setErrorMessage(response.data.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (type, name, placeholder, label) => (
        <div className='mb-3'>
            <label htmlFor={name}>
                <strong className={`${darkMode ? 'text-light' : 'text-dark'}`}>{label}</strong>
            </label>
            <input
                type={type}
                value={formData[name]}
                name={name}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`form-control rounded-0 ${darkMode ? 'bg-dark text-white' : ''}`}
                aria-invalid={!!errors[name]}
                required
            />
            {errors[name] && <span className='text-danger'>{errors[name]}</span>}
        </div>
    );

    return (
        <div className={`d-flex justify-content-center align-items-center vh-100 ${darkMode ? 'bg-dark text-white' : 'bg-primary'}`}>
            <div className={`p-3 rounded w-25 ${darkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
                <h2 className={`${darkMode ? 'text-light' : 'text-dark'}`}>Login</h2>
                {errorMessage && <p className="text-danger" aria-live="assertive">{errorMessage}</p>} {/* Display error message */}
                <form onSubmit={handleSubmit}>
                    {renderInput('email', 'email', 'Email', 'Email')}
                    {renderInput('password', 'password', 'Password', 'Password')}
                    <button type='submit' className='btn btn-success w-100 rounded-0' disabled={loading}>
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                    <p className={`${darkMode ? 'text-light' : 'text-dark'}`}>You agree to our terms and policies</p>
                    <Link to="/signup" className='btn btn-default border w-100 bg-light rounded-0 text-decoration-none'>Create Account</Link>
                    <Link to="/forgot-password" className='btn btn-default border w-100 bg-light rounded-0 text-decoration-none'>Forgot Password?</Link>
                </form>
            </div>
        </div>
    );
}

export default Login;
