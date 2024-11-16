from g4f.client import Client

prompt = """Создайте набор тестов по теме «Дискриминант» с ответами. Убедитесь, что корни квадратного уравнения 𝑎𝑥² + 𝑏𝑥 + 𝑐 = 0 четные числа. Каждый раз генерируйте новые вопросы с различными коэффициентами 𝑎, 𝑏 и 𝑐, чтобы гарантировать, что корни уравнения будут четными. Форматируйте ответ в следующем формате и без лишнего текста онли в таком формате :

{
    "questions": [
    {
        "question": "Найдите корни квадратного уравнения 2x² - 8x + 6 = 0.",
        "options": [
        {"id": 1, "text": "(1, 3)"},
        {"id": 2, "text": "(3, -1)"},
        {"id": 3, "text": "(2, 4)"},
        {"id": 4, "text": "(0, 6)"}
        ],
        "correctAnswers": [3]
    },
    {
        "question": "Найдите корни квадратного уравнения 2x² - 10x + 12 = 0.",
        "options": [
        {"id": 1, "text": "(2, 6)"},
        {"id": 2, "text": "(3, 4)"},
        {"id": 3, "text": "(0, 6)"},
        {"id": 4, "text": "(1, 5)"}
        ],
        "correctAnswers": [1]
    },
    {
        "question": "Найдите корни квадратного уравнения 4x² - 16x + 16 = 0.",
        "options": [
        {"id": 1, "text": "(2, 2)"},
        {"id": 2, "text": "(0, 4)"},
        {"id": 3, "text": "(1, 3)"},
        {"id": 4, "text": "(2, 4)"}
        ],
        "correctAnswers": [1]
    }
    ]
}
"""
client = Client()
response = client.chat.completions.create(
    model="gpt-4o",

    messages=[{"role": "user", "content": prompt}
            ],
    temperature=0.9
    # Add any other necessary parameters if needed
)
print(response.choices[0].message.content)
