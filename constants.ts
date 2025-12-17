import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Could you please tell me your full name, your age, and the name of a person you are very close to?",
    expectedType: "Personal Orientation"
  },
  {
    id: 2,
    question: "I am going to give you 5 words to remember: Apple, Watch, Penny, Desk, Cloud. Please repeat them back to me now.",
    expectedType: "Immediate Memory Registration"
  },
  {
    id: 3,
    question: "What is today’s date (day, month, and year)?",
    expectedType: "Orientation to Time"
  },
  {
    id: 4,
    question: "Can you tell me where we are right now (place and city)?",
    expectedType: "Orientation to Place"
  },
  {
    id: 5,
    question: "Can you count backwards from 100 by subtracting 7 each time?",
    expectedType: "Attention & Calculation"
  },
  {
    id: 6,
    question: "Please spell the word 'WORLD' backwards.",
    expectedType: "Attention & Language"
  },
  {
    id: 7,
    question: "What do people usually use a watch and a pen for?",
    expectedType: "Language & Semantic Memory"
  },
  {
    id: 8,
    question: "Can you repeat this sentence exactly: 'No ifs, ands, or buts.'",
    expectedType: "Language Repetition"
  },
  {
    id: 9,
    question: "Please name as many animals as you can in one minute.",
    expectedType: "Verbal Fluency"
  },
  {
    id: 10,
    question: "What were the 5 words I asked you to remember earlier in the test?",
    expectedType: "Delayed Recall"
  }
];


export const STAGE_DESCRIPTIONS: Record<number, { title: string; color: string; desc: string }> = {
  1: { title: "Stage 1 — Very low risk", color: "text-green-600", desc: "Appears normal. No significant cognitive decline detected." },
  2: { title: "Stage 2 — Minimal signs", color: "text-green-500", desc: "Monitor. Very mild forgetfulness that may be age-appropriate." },
  3: { title: "Stage 3 — Mild concerns", color: "text-yellow-500", desc: "Early signs. Noticeable word-finding or memory issues." },
  4: { title: "Stage 4 — Moderate deficits", color: "text-orange-500", desc: "Moderate deficits. Clear difficulty with complex tasks." },
  5: { title: "Stage 5 — Moderately severe", color: "text-orange-600", desc: "Significant gaps in memory and cognitive function." },
  6: { title: "Stage 6 — Severe impairment", color: "text-red-600", desc: "Severe memory loss and personality changes." },
  7: { title: "Stage 7 — Very severe", color: "text-red-700", desc: "Loss of ability to respond to environment. Needs evaluation." }
};

export const STOPPER_WORDS = ['umm', 'uh', 'ah', 'like', 'you know', 'aray', 'ufff', 'mmm', 'mhh'];