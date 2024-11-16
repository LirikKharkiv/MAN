/**
 * The TestPage component in React fetches test data and questions, allows users to answer questions,
 * calculates scores, and displays the test results.
 * @returns The `TestPage` component is being returned. This component handles the rendering of a test
 * page including fetching test data and questions, displaying questions with options for answers,
 * handling user selections, calculating score, and displaying the test result. The component
 * conditionally renders loading indicator, error messages, test content, and the final test result
 * based on the state of the component (loading, test data availability, test
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Button, CircularProgress } from '@mui/material';

function TestPage() {
  const { code } = useParams();
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`http://localhost:8081/test/${code}`);
        if (!response.ok) {
          throw new Error('Test not found');
        }
        const data = await response.json();
        setTestData(data);

        // Fetch questions related to the test code
        const questionsResponse = await fetch(`http://localhost:8081/test_questions/${code}`);
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions');
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData); // Assuming questionsData is an array of questions
      } catch (error) {
        console.error('Error fetching test or questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [code]);

  const handleAnswerSelect = (optionId) => {
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = optionId;
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    const correctAnswers = questions.map(q => q.correctAnswers).flat();
    return selectedAnswers.filter(answer => correctAnswers.includes(answer)).length;
  };

  if (loading) {
    return (
      <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1">Загружается...</Typography>
      </Container>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
        <Typography variant="body1">Тест или вопросы не найдены.</Typography>
      </Container>
    );
  }

  if (isFinished) {
    const score = calculateScore(); // Calculate score only when finished
    return (
      <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
        <Typography variant="h4">Тест завершен!</Typography>
        <Typography variant="h6">Ваш результат: {score} из {questions.length}</Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>Пройти снова</Button>
      </Container>
    );
  }

  const { subject, topic } = testData;

  return (
    <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
      <Typography variant="h4">{subject}</Typography>
      <Typography variant="h6">{topic}</Typography>

      {questions.length > 0 && currentQuestionIndex < questions.length ? (
        <>
          <Typography variant="h5">{questions[currentQuestionIndex].question}</Typography>
          {questions[currentQuestionIndex].options.map(option => (
            <Button
              key={option.id}
              variant="contained"
              sx={{ margin: '5px' }}
              onClick={() => handleAnswerSelect(option.id)}
              style={{
                backgroundColor: selectedAnswers[currentQuestionIndex] === option.id ? 'lightblue' : '',
              }}
            >
              {option.text}
            </Button>
          ))}
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQuestionIndex] === undefined} // Disable if no answer selected
          >
            {currentQuestionIndex < questions.length - 1 ? 'Далее' : 'Завершить тест'}
          </Button>
        </>
      ) : (
        <Typography variant="body1">Это конец теста.</Typography>
      )}
    </Container>
  );
}

export default TestPage;
