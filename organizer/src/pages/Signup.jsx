import { Box, Button, TextField, Typography, Snackbar, Alert, InputAdornment, IconButton } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingButton from '@mui/lab/LoadingButton';
import authApi from '../api/authApi';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Signup = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [usernameErrText, setUsernameErrText] = useState('');
    const [passwordErrText, setPasswordErrText] = useState('');
    const [confirmPasswordErrText, setConfirmPasswordErrText] = useState('');
    const [username, setUsername] = useState('');
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const [passwordMismatchPopup, setPasswordMismatchPopup] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

    // Handle input for username field, restricting disallowed characters
    const handleUsernameInput = (e) => {
        const input = e.target.value;
        const usernameRegex = /^[A-Za-z\s]*$/;

        if (usernameRegex.test(input)) {
            setUsername(input);
            setUsernameErrText('');
        } else {
            setUsernameErrText('Username can only contain letters and spaces');
        }
    };

    // Password validation function
    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUsernameErrText('');
        setPasswordErrText('');
        setConfirmPasswordErrText('');

        const data = new FormData(e.target);
        const password = data.get('password').trim();
        const confirmPassword = data.get('confirmPassword').trim();

        let err = false;

        // Validate username
        if (username.trim() === '') {
            err = true;
            setUsernameErrText('Please fill this field');
        }

        // Validate password
        if (password === '') {
            err = true;
            setPasswordErrText('Please fill this field');
        } else if (!validatePassword(password)) {
            err = true;
            setPasswordErrText(
                'Password must be at least 8 characters long, contain one number, and one capital letter'
            );
        }

        // Validate confirm password
        if (confirmPassword === '') {
            err = true;
            setConfirmPasswordErrText('Please fill this field');
        } else if (password !== confirmPassword) {
            err = true;
            setConfirmPasswordErrText('Confirm password does not match');
            setPasswordMismatchPopup(true); // Trigger Snackbar when passwords don't match
        }

        if (err) {
            console.log('Validation failed, form not submitted'); // Debugging log
            return; // Stop form submission if there's an error
        }

        setLoading(true);

        try {
            const res = await authApi.signup({
                username: username.trim(),
                password,
                confirmPassword,
            });
            setLoading(false);
            localStorage.setItem('token', res.token);
            navigate('/board');  // Navigate to board page after successful signup
        } catch (err) {
            const errors = err?.data?.errors || [];
            errors.forEach((e) => {
                if (e.param === 'username') {
                    setUsernameErrText(e.msg);
                }
                if (e.param === 'password') {
                    setPasswordErrText(e.msg);
                }
                if (e.param === 'confirmPassword') {
                    setConfirmPasswordErrText(e.msg);
                }
            });
            setLoading(false);
        }
    };

    return (
        <>
            <Box
                component='form'
                sx={{ mt: 1 }}
                onSubmit={handleSubmit}
                noValidate
            >
                <TextField
                    margin='normal'
                    required
                    fullWidth
                    id='username'
                    label='Username'
                    name='username'
                    value={username}
                    onInput={handleUsernameInput}
                    disabled={loading}
                    error={usernameErrText !== ''}
                    helperText={usernameErrText}
                />
                
                <TextField
                    margin='normal'
                    required
                    fullWidth
                    id='password'
                    label='Password'
                    name='password'
                    type={showPassword ? 'text' : 'password'} // Toggle password visibility
                    disabled={loading}
                    error={passwordErrText !== ''}
                    helperText={passwordErrText}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                {showPasswordRequirements && (
                    <Typography
                        variant="body2"
                        sx={{ color: 'green', mt: 1 }}  
                    >
                        Password must be at least 8 characters long, contain one number, and one capital letter.
                    </Typography>
                )}

                <TextField
                    margin='normal'
                    required
                    fullWidth
                    id='confirmPassword'
                    label='Confirm Password'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'} // Toggle confirm password visibility
                    disabled={loading}
                    error={confirmPasswordErrText !== ''}
                    helperText={confirmPasswordErrText}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle showConfirmPassword state
                                    edge="end"
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                
                <LoadingButton
                    sx={{ mt: 3, mb: 2 }}
                    variant='outlined'
                    fullWidth
                    color='success'
                    type='submit'
                    loading={loading}
                >
                    SignUp
                </LoadingButton>
            </Box>
            <Button
                component={Link}
                to='/login'
                sx={{ textTransform: 'none' }}
            >
                Already have an account? Login
            </Button>

            {/* Snackbar for password mismatch */}
            <Snackbar
                open={passwordMismatchPopup}
                autoHideDuration={6000}
                onClose={() => setPasswordMismatchPopup(false)}
            >
                <Alert 
                    onClose={() => setPasswordMismatchPopup(false)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    Password and Confirm Password do not match!
                </Alert>
            </Snackbar>
        </>
    );
};

export default Signup;
