import React, { useState } from 'react';
import Button from '@mui/material/Button';
import {
    AppBar,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    Divider,
    Select,
    FormControl,
    InputLabel,
    TextField,
    CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeToggle } from '../Home/ThemeContext'; // Ensure this is imported correctly
import { useNavigate } from 'react-router-dom';
import './Testcreate.css'

function TestCreate() {
    const { toggleTheme, darkMode } = useThemeToggle();
    const [anchorEl, setAnchorEl] = useState(null);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState([]);
    const [showTestCode, setShowTestCode] = useState(''); 
    const [errorMessage, setErrorMessage] = useState(''); 
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const generateUniqueCode = (length = 9) => {
        return Math.random().toString(36).substr(2, length);
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        navigate('/'); 
        handleMenuClose();
    };

    const handleProfile = () => {
        navigate('/profile'); 
        handleMenuClose();
    };

    const handleReturnToHome = () => {
        navigate('/home'); 
    };

    const handleSubjectChange = (event) => {
        setSubject(event.target.value);
        setTopic('');
    };

    const handleTopicChange = (event) => {
        setTopic(event.target.value);
        const newTestCode = generateUniqueCode();
        setShowTestCode(newTestCode);
    };

    const createTest = async () => {
        setLoading(true);
        try {
            const requestBody = {
                subject,
                topic,
                code: showTestCode
            };
            
            const response = await fetch('http://localhost:8081/create_test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Test creation failed: ${errorData.error || 'unknown error'}`);
            }

            const createTestData = await response.json();
            return createTestData.test_data?.code; 

        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestionsFromAI = async () => {
    if (!subject || !topic) {
        alert('Please select a subject and a topic.');
        return;
    }

    setLoading(true);
    try {
        const testCode = await createTest();
        if (!testCode) throw new Error('No test code returned.');

        setShowTestCode(testCode);

        const aiResponse = await fetch('http://localhost:8082/generate_questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subject, topic, code: testCode })
        });

        if (!aiResponse.ok) throw new Error('Failed to generate questions from AI');

        const questionsData = await aiResponse.json();
        
        // Log the received questions
        console.log("Received questions:", questionsData);

        const questions = questionsData.questions.map(q => ({
            question_text: q.question,
            options: q.options,
            correct_answers: q.correctAnswers,
        }));

        setQuestions(questions);
        await addQuestionsToDatabase(); 

        setErrorMessage('');
    } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
    } finally {
        setLoading(false);
    }
    };

    const addQuestionsToDatabase = async () => {
        setLoading(true);
        try {
            for (const question of questions) {
                const response = await fetch('http://localhost:8081/add_question', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        test_code: showTestCode,
                        question_text: question.question_text,
                        options: question.options.map(option => option.text),
                        correct_answers: question.correct_answers,
                    }),
                });

                if (!response.ok) throw new Error('Failed to add question to the database');
            }
            alert('Questions added successfully!');
            resetForm();
        } catch (error) {
            console.error(error);
            setErrorMessage(`Error adding questions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSubject('');
        setTopic('');
        setQuestions([]);
        setShowTestCode(''); 
        setErrorMessage('');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#121212' : '#ffffff' }}>
            <AppBar position='fixed'>
                <Container fixed>
                    <Toolbar sx={{ justifyContent: 'flex-start' }}>
                        <IconButton edge='start' color="inherit" aria-label="menu" onClick={handleMenuClick}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 4, textAlign: 'center' }}>
                            Create Test
                        </Typography>
                    </Toolbar>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem onClick={handleProfile}>Profile</MenuItem>
                        <MenuItem onClick={() => { toggleTheme(); handleMenuClose(); }} sx={{ justifyContent: 'center' }}>
                            Toggle Theme
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Container>
            </AppBar>
            <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ marginBottom: '20px' }}>
                    Create Test
                </Typography>

                {errorMessage && (
                    <Typography color="error" sx={{ marginBottom: '20px' }}>
                        {errorMessage}
                    </Typography>
                )}

                <FormControl fullWidth sx={{ marginBottom: '20px' }}>
                    <InputLabel id="subject-label">Subject</InputLabel>
                    <Select
                        labelId="subject-label"
                        value={subject}
                        onChange={handleSubjectChange}
                        label="Subject"
                    >
                        <MenuItem value="math">Math</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ marginBottom: '20px' }} disabled={!subject}>
                    <InputLabel id="topic-label">Topic</InputLabel>
                    <Select
                        labelId="topic-label"
                        value={topic}
                        onChange={handleTopicChange}
                        label="Topic"
                    >
                        <MenuItem value="discriminant">Discriminant</MenuItem>
                    </Select>
                </FormControl>

                <Button variant="contained" color="primary" onClick={fetchQuestionsFromAI} disabled={!subject || !topic || loading}>
                    {loading ? <CircularProgress size={24} /> : 'Get Questions from AI'}
                </Button>

                {questions.map((q, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                        <TextField
                            fullWidth
                            label={`Question ${index + 1}`}
                            value={q.question_text || ''}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                        />
                        <FormControl fullWidth sx={{ marginTop: '10px' }}>
                            <InputLabel>Answer Options</InputLabel>
                            <Select
                                value={q.options.map(option => option.text)}
                                label="Answer Options"
                                multiple
                                readOnly
                            >
                                {q.options.map((option, idx) => (
                                    <MenuItem key={idx} value={option.text}>
                                        {option.text}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                ))}

                <Button variant="outlined" onClick={resetForm} style={{ marginLeft: '20px' }}>
                    Reset Form
                </Button>

                <Button variant="outlined" onClick={handleReturnToHome} style={{ marginLeft: '20px' }}>
                    Return to Home
                </Button>
            </Container>
        </div>
    );
}

export default TestCreate;
