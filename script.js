    let questions = [];
    let currentQuestion = 0;
    let selectedAnswers = [];
    let markedForReview = [];
    let totalTime = 0;
    let timer;
    let paused = false;

    function startExam() {
        const name = document.getElementById('inputName').value.trim();
        const time = parseInt(document.getElementById('inputTime').value.trim());
        const file = document.getElementById('inputExcel').files[0];

        if (!name || !time || !file) {
            alert("Please fill all fields and upload the Excel file.");
            return;
        }

        totalTime = time * 60;
        document.getElementById('userName').innerText = `Name: ${name}`;

        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            questions = rows.slice(1).map(row => ({
                question: row[0],
                options: [row[1], row[2], row[3], row[4]],
                answer: parseInt(row[5])
            }));

            selectedAnswers = new Array(questions.length).fill(null);
            markedForReview = new Array(questions.length).fill(false);

            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('examScreen').style.display = 'block';

            loadQuestion();
            startTimer();
        };
        reader.readAsArrayBuffer(file);
    }

    function startTimer() {
        timer = setInterval(() => {
            if (!paused) {
                if (totalTime <= 0) {
                    clearInterval(timer);
                    submitTest();
                } else {
                    totalTime--;
                    let minutes = String(Math.floor(totalTime / 60)).padStart(2, '0');
                    let seconds = String(totalTime % 60).padStart(2, '0');
                    document.getElementById('timer').innerText = `Time Left: ${minutes}:${seconds}`;
                }
            }
        }, 1000);
    }

    function pauseExam() {
        paused = !paused;
        document.querySelector('.pause-btn').innerText = paused ? 'Resume' : 'Pause';
    }

    function loadQuestion() {
        const q = questions[currentQuestion];
        document.getElementById('questionText').innerText = `Q${currentQuestion + 1}. ${q.question}`;

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = "";

        q.options.forEach((opt, idx) => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="radio" name="option" value="${idx}" ${selectedAnswers[currentQuestion] === idx ? "checked" : ""}> ${opt}`;
            optionsContainer.appendChild(label);
        });

        updateNav();
    }

    function saveAnswer() {
        const selected = document.querySelector('input[name="option"]:checked');
        if (selected) {
            selectedAnswers[currentQuestion] = parseInt(selected.value);
        }
    }

    function markForReview() {
        markedForReview[currentQuestion] = true;
        saveAnswer();
        updateNav();
    }

    function clearResponse() {
        selectedAnswers[currentQuestion] = null;
        markedForReview[currentQuestion] = false;
        loadQuestion();
    }

    function saveAndNext() {
        saveAnswer();
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    }

    function nextQuestion() {
        saveAnswer();
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    }

    function prevQuestion() {
        saveAnswer();
        if (currentQuestion > 0) {
            currentQuestion--;
            loadQuestion();
        }
    }

    function updateNav() {
        const nav = document.getElementById('questionNav');
        nav.innerHTML = "";

        for (let i = 0; i < questions.length; i++) {
            const btn = document.createElement('button');
            btn.innerText = i + 1;
            btn.onclick = () => {
                saveAnswer();
                currentQuestion = i;
                loadQuestion();
            };

            if (i === currentQuestion) {
                btn.classList.add('current');
            } else if (markedForReview[i]) {
                btn.classList.add('marked-answered');
            } else if (selectedAnswers[i] !== null) {
                btn.classList.add('answered');
            } else {
                btn.classList.add('unattempted');
            }

            nav.appendChild(btn);
        }
    }

    function submitTest() {
        saveAnswer();
        clearInterval(timer);

        let score = 0;
        questions.forEach((q, idx) => {
            if (q.answer === selectedAnswers[idx]) {
                score++;
            }
        });

        document.getElementById('examScreen').style.display = 'none';
        document.getElementById('resultScreen').style.display = 'block';
        document.getElementById('scoreText').innerText = `Your Score: ${score}/${questions.length}`;

        showReview();
    }

    function showReview() {
        const review = document.getElementById('reviewSection');
        review.innerHTML = "";

        questions.forEach((q, idx) => {
            const div = document.createElement('div');
            div.className = 'review-question';

            const isCorrect = selectedAnswers[idx] === q.answer;
            div.innerHTML = `
                <h4>Q${idx + 1}: ${q.question}</h4>
                <p>Your Answer: ${q.options[selectedAnswers[idx]] || "Not Answered"}</p>
                <p>Correct Answer: ${q.options[q.answer]}</p>
                <p>Status: <strong style="color:${isCorrect ? 'green' : 'red'};">${isCorrect ? 'Correct' : 'Wrong'}</strong></p>
            `;

            review.appendChild(div);
        });
    }

    // Prevent right-click
    document.addEventListener('contextmenu', event => event.preventDefault());
    window.onbeforeunload = () => "Exam is in progress. Are you sure you want to leave?";
