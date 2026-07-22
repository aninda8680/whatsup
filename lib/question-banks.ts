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
