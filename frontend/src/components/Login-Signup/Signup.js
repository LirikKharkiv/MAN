import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { useAuth } from './AuthContext'; // Import authentication context
import { useThemeToggle } from '../Home/ThemeContext'; // Import theme context

function Signup() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
        if (!formData.name) validationErrors.name = "Name is required.";
        if (!formData.email) validationErrors.email = "Email is required.";
        if (!formData.password) validationErrors.password = "Password is required.";
        return validationErrors;
    };

    const handleErrorResponse = (error) => {
        console.error("Signup error response:", error);
        const message = error.response?.data?.detail || 'Signup failed. Please check your information.';
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
            const response = await axios.post('http://127.0.0.1:8081/signup', formData);
            // If registration is successful, automatically log in the user
            if (response.status === 201) {
                const token = response.data.access_token; // Adjust based on your backend response structure
                login(token); // Store the token in context
                navigate('/home'); // Navigate to home page upon successful registration
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
                <h2 className={`${darkMode ? 'text-light' : 'text-dark'}`}>Sign Up</h2>
                {errorMessage && <p className="text-danger" aria-live="assertive">{errorMessage}</p>} {/* Display error message */}
                <form onSubmit={handleSubmit}>
                    {renderInput('text', 'name', 'Your Name', 'Name')}
                    {renderInput('email', 'email', 'Email', 'Email')}
                    {renderInput('password', 'password', 'Password', 'Password')}
                    <button type='submit' className='btn btn-success w-100 rounded-0' disabled={loading}>
                        {loading ? 'Loading...' : 'Sign Up'}
                    </button>
                    <p className={`${darkMode ? 'text-light' : 'text-dark'}`}>You agree to our terms and policies</p>
                    <Link to="/login" className='btn btn-default border w-100 bg-light rounded-0 text-decoration-none'>Already have an account? Login</Link>
                </form>
            </div>
        </div>
    );
}

export default Signup;
