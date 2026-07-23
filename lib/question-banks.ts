import { Slide } from '@/hooks/useSession';

const rawText = `
1. Your teacher gives a project due tomorrow. Your first reaction?
A. "Let's build it from scratch 💪" ✅
B. "Bro... anyone got last year's PDF? 👀"
C. "ChatGPT, save my CGPA 😭"
D. "Tomorrow's problem."

2. Which AI can generate images from text?
A. Spotify Wrapped
B. Midjourney ✅
C. WhatsApp
D. Calculator Pro Max

3. You open your laptop to study. After 2 hours you've actually...
A. Finished one chapter 📚
B. Customized Windows theme 🎨
C. Watched 57 reels 😭 ✅
D. Started studying... mentally.

4. What does AI stand for?
A. Awesome Internet
B. Artificial Intelligence ✅
C. Advanced Instagram
D. Automatic Idli

5. Exam tomorrow. Your preparation level?
A. Revision done 😎
B. "I'll wake up at 4 AM."
C. "Notes bhej na bro." ✅
D. Trusting divine intervention.

6. Which engineering branch uses AI today?
A. Computer Science
B. Mechanical
C. Civil
D. All of these ✅

7. Your Wi-Fi disconnects during online exam.
A. Panic.
B. Restart router.
C. Use mobile hotspot.
D. Start negotiating with the universe. ✅

8. Which company created ChatGPT?
A. Google
B. Microsoft
C. OpenAI ✅
D. NASA (because why not)

9. Group project means...
A. Equal work.
B. One person suffers.
C. Everyone says "I'll do tomorrow."
D. Depends on the group. ✅

10. Which is NOT an AI application?
A. Face Unlock
B. Recommendation Systems
C. Self-driving Cars
D. Steel Scale Measuring Length ✅

11. First thing you install on a new laptop?
A. VS Code
B. Chrome ✅
C. Steam
D. Valorant

12. What is Machine Learning?
A. Teaching computers using data ✅
B. Repairing machines
C. Building robots only
D. Making printers angry

13. Teacher says "No AI allowed."
What's your reaction?
A. Respect it.
B. Use AI to understand. ✅
C. Ask seniors.
D. Suddenly become philosophical.

14. Which one is a programming language?
A. Python ✅
B. Penguin
C. Dragon
D. PotatoScript

15. If AI writes your assignment, you should...
A. Submit directly.
B. Read, verify and improve it. ✅
C. Change font only.
D. Pray.

16. Your attendance is 42%.
A. "It's okay."
B. "Can internal marks save me?"
C. Suddenly love college.
D. Start calculating miracles. ✅

17. Which engineering field uses sensors the most?
A. Electrical
B. Electronics
C. Mechanical
D. Actually... all of them in different ways. ✅

18. AI can help engineers by...
A. Predicting failures
B. Designing products
C. Analyzing data
D. All of these ✅

19. Most dangerous sentence before exams?
A. "There's still plenty of time." ✅
B. "Let's study."
C. "One last reel."
D. "Attendance doesn't matter."

20. Which one is NOT an AI model?
A. GPT
B. Gemini
C. Llama
D. Windows XP ✅

21. You discover your lab partner is actually hardworking.
A. Protect them at all costs.
B. Learn from them.
C. Buy them chai.
D. All of the above. ✅

22. What is Deep Learning?
A. Sleeping deeply
B. Advanced Machine Learning using neural networks ✅
C. Reading at midnight
D. Learning underwater

23. Which skill is valuable in every engineering branch?
A. Problem Solving
B. Communication
C. Teamwork
D. Actually... all of these. ✅

24. If your code runs perfectly on the first try...
A. Impossible.
B. You're dreaming.
C. You forgot to test.
D. Buy a lottery ticket. ✅

25. Your goal after today's orientation?
A. Learn something new.
B. Meet new friends.
C. Explore clubs and opportunities.
D. All of the above. ✅
`;

function parseQuiz(text: string): Partial<Slide>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const slides: Partial<Slide>[] = [];
  let currentSlide: any = null;
  
  for (let line of lines) {
    if (/^\d+\./.test(line)) {
      if (currentSlide && currentSlide.options.length > 0) {
        slides.push(currentSlide);
      }
      currentSlide = {
        prompt: line,
        options: [],
        type: 'mcq_single',
        resultsVisibleToStudents: true,
      };
    } else if (/^[A-D]\./.test(line)) {
      if (currentSlide) {
        const optionId = 'opt_' + currentSlide.options.length;
        if (line.includes('✅')) {
          currentSlide.correctOptionId = optionId;
        }
        currentSlide.options.push({
          id: optionId,
          label: line.replace(' ✅', '') 
        });
      }
    } else if (currentSlide && currentSlide.options.length === 0) {
      if (!line.startsWith('(')) {
        currentSlide.prompt += ' ' + line;
      }
    }
  }
  if (currentSlide && currentSlide.options.length > 0) {
    slides.push(currentSlide);
  }
  return slides;
}

export const cseecemeQuestions = parseQuiz(rawText);

const cseStudentsRawText = `
1. What does AI stand for?
A. Artificial Intelligence ✅
B. Automatic Internet
C. Alien Instructor
D. Advanced Instagram

2. Which of these is an example of AI you probably use every day?
A. Google Maps Navigation ✅
B. A Water Bottle
C. Ceiling Fan
D. Notebook

3. AI will replace everyone tomorrow.
A. True
B. False ✅

4. If AI becomes smarter than humans tomorrow, what's your backup plan?
A. Farming
B. Open a Tea Stall
C. Become an Influencer
D. None of the above because AI isn't taking over tomorrow ✅

5. What does ML stand for?
A. Machine Learning ✅
B. Machine Language
C. Mobile Learning
D. Mega Logic

6. Which subject is MOST important for Machine Learning?
A. Mathematics ✅
B. Geography
C. History
D. Drawing

7. Which branch of mathematics is heavily used in ML?
A. Statistics ✅
B. Sanskrit
C. Civics
D. Physical Education

8. Knowing only Python makes you an ML Engineer.
A. True
B. False ✅

9. Which skill is NOT required for ML?
A. Problem Solving
B. Mathematics
C. Logical Thinking
D. Memorizing Bollywood Songs ✅

10. Deep Learning is mostly used for...
A. Face Recognition ✅
B. Making Coffee
C. Playing Cricket
D. Charging Phones

11. MediaPipe can detect...
A. Hand Gestures ✅
B. Your Exam Marks
C. Future Salary
D. Wi-Fi Password

12. What's more important than being a genius?
A. Consistency ✅
B. Luck
C. Expensive Laptop
D. RGB Keyboard

13. If ChatGPT writes every assignment for you...
A. You'll learn faster
B. Your thinking skills may become weaker ✅
C. Teachers become happier
D. You'll become an AI Engineer instantly

14. Which statement is better?
A. Never use AI.
B. Use AI wisely. ✅
C. AI is cheating.
D. AI knows everything.

15. Technology changes...
A. Every few years
B. Almost every day ✅
C. Never
D. Only before exams

16. Which AI tool have you probably heard about the most?
A. ChatGPT ✅
B. MS Paint
C. VLC
D. Calculator

17. What's a Prompt?
A. Instructions given to AI ✅
B. A Password
C. A Programming Language
D. A Virus

18. Which prompt will likely give a better answer?
A. Explain AI.
B. Explain AI to a first-year engineering student with simple examples. ✅

19. Why is context important?
A. It helps AI understand your situation better. ✅
B. It makes Wi-Fi faster.
C. It increases RAM.
D. It changes your keyboard color.

20. Which question gives more context?
A. I have a red mark.
B. A mosquito bit my face yesterday and now I have a red mark. ✅

21. An engineer should trust AI answers...
A. Always
B. Never
C. Only after verifying them ✅
D. Only if ChatGPT says so

22. Which habit makes someone a better engineer?
A. Copy-paste everything
B. Ask "Why?" and verify answers ✅
C. Memorize code
D. Ignore documentation

23. GitHub is best described as...
A. Google Drive for Code ✅
B. Instagram for Developers
C. A Search Engine
D. A Programming Language

24. What is the BEST way to become good at programming?
A. Watch 300 tutorials
B. Build Projects ✅
C. Buy an expensive laptop
D. Change keyboard every month

25. Final Question: What is the biggest takeaway from today's session?
A. AI will replace me.
B. Python is enough.
C. Keep learning, think critically, and use AI as a tool. ✅
D. Engineering is impossible.
`;

export const cseStudentsQuestions = parseQuiz(cseStudentsRawText);
