import React, { useState, useEffect, useRef } from 'react';
import { QUESTIONS, STAGE_DESCRIPTIONS, STOPPER_WORDS } from './constants';
import { AppStage, TestSession, EmotionDataPoint } from './types';
import { evaluateAnswerWithGemini } from './services/geminiService';
import CameraFeed from './components/CameraFeed';
import AudioVisualizer from './components/AudioVisualizer';
import EmotionGraph from './components/EmotionGraph';
import { Activity, Brain, ChevronRight, Mic, RefreshCw, Volume2, BarChart2, Download } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Type helper for answers to handle Object.values inference
type SessionAnswer = TestSession['answers'][number];

const App: React.FC = () => {
  // State
  const [stage, setStage] = useState<AppStage>(AppStage.LANDING);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotionLabel, setCurrentEmotionLabel] = useState("Neutral");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Session Data
  const [sessionData, setSessionData] = useState<TestSession>({
    questions: QUESTIONS,
    currentQuestionIndex: 0,
    answers: {},
    emotionTimeline: [],
    startTime: Date.now()
  });

  // --- Helpers ---

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = resultsRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('neuroscreen-report.pdf');
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Callback for CameraFeed
  const handleEmotionUpdate = (data: { label: string; stress: number; anxiety: number; neutral: number }) => {
    if (stage !== AppStage.TESTING) return;

    setCurrentEmotionLabel(data.label);
    
    // Throttle updates slightly to avoid state thrashing if needed, 
    // but React batching usually handles high frequency updates okay for this scale.
    // We'll append to timeline every ~1s logic could be done here, but for now we append every frame update 
    // which might be too much data. Let's sample it based on time.
    
    setSessionData(prev => {
        const lastPoint = prev.emotionTimeline[prev.emotionTimeline.length - 1];
        const now = Date.now() - prev.startTime;
        
        // Only add data point every 500ms
        if (lastPoint && (now - lastPoint.timestamp < 500)) {
            return prev;
        }

        const newPoint: EmotionDataPoint = {
            timestamp: now,
            stress: data.stress,
            anxiety: data.anxiety,
            neutral: data.neutral
        };

        return {
            ...prev,
            emotionTimeline: [...prev.emotionTimeline, newPoint].slice(-100) // Keep last 100 points
        };
    });
  };

  // --- Effects ---

  // TTS: Speak question when index changes and we are in testing mode
  useEffect(() => {
    if (stage === AppStage.TESTING && !isProcessing) {
      const question = QUESTIONS[currentQuestionIdx].question;
      // Slight delay to allow transition
      const timer = setTimeout(() => {
        speakText(question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIdx, stage, isProcessing]);

  // --- Handlers ---

  const handleStart = () => {
    setStage(AppStage.PERMISSIONS);
  };

  const handlePermissionsGranted = () => {
    setStage(AppStage.TESTING);
    setSessionData(prev => ({ ...prev, startTime: Date.now() }));
  };

  const startListening = () => {
    setIsListening(true);
    
    // Check for Web Speech API
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
         // Optionally confirm start
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
             setTranscript(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
             setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };

      recognition.onend = () => {
          setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Web Speech API not supported. Please type your answer.");
      setIsListening(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);

    try {
        const currentQ = QUESTIONS[currentQuestionIdx];

        // 1. Analyze "Stopper Words" (Simple Regex)
        let stopperCount = 0;
        STOPPER_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = transcript.match(regex);
            if (matches) stopperCount += matches.length;
        });

        // 2. AI Evaluation
        const evaluation = await evaluateAnswerWithGemini(
            currentQ.question,
            transcript,
            currentQ.expectedType
        );

        // 3. Save Data
        setSessionData(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [currentQ.id]: {
                    transcript,
                    evaluation,
                    audioFeatures: {
                        pitch: Math.random() * 100 + 100, // Simulated pitch
                        tone: evaluation.confidence > 0.7 ? "Confident" : "Hesitant",
                        stopperWordCount: stopperCount,
                        aggression: Math.random() * 0.1 // Simulated low aggression
                    }
                }
            }
        }));

        setTranscript('');

        if (currentQuestionIdx < QUESTIONS.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            setStage(AppStage.RESULTS);
        }
    } catch (error) {
        console.error("Error processing answer:", error);
        alert("There was an error processing your response. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Rendering Helpers ---

  const calculateFinalStage = () => {
    const answers = Object.values(sessionData.answers) as SessionAnswer[];
    if (answers.length === 0) return 1;

    let totalScore = 0;
    answers.forEach(a => totalScore += a.evaluation.score);
    
    // Normalize to 0-100 roughly
    const finalScore = totalScore; 

    if (finalScore <= 10) return 7;
    if (finalScore <= 25) return 6;
    if (finalScore <= 40) return 5;
    if (finalScore <= 55) return 4;
    if (finalScore <= 70) return 3;
    if (finalScore <= 85) return 2;
    return 1;
  };

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white p-6 rounded-full shadow-lg mb-8 animate-pulse-slow">
        <Brain className="w-16 h-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-4">NeuroScreen AI</h1>
      <p className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
        An advanced early dementia screening tool utilizing multimodal AI analysis.
        We analyze voice patterns, facial micro-expressions, and cognitive responses.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
        {[
            { icon: <Mic className="w-6 h-6" />, title: "Voice Analysis", desc: "Detects pitch, tone, and stopper words." },
            { icon: <Activity className="w-6 h-6" />, title: "Emotion Tracking", desc: "Real-time AI facial detection." },
            { icon: <Brain className="w-6 h-6" />, title: "Cognitive AI", desc: "Gemini-powered response evaluation." }
        ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
                <div className="text-secondary mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-slate-700 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        className="group flex items-center gap-2 bg-primary hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        Start Screening
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="mt-6 text-xs text-slate-400">
        * This is a screening tool, not a medical diagnosis. Consult a doctor for professional advice.
      </p>
    </div>
  );

  const renderPermissions = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Device Permissions</h2>
            <p className="text-slate-600 mb-8">
                To conduct the analysis, we need access to your camera and microphone. 
                Data is processed locally for the duration of the test.
            </p>
            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-200 p-2 rounded-full"><Mic className="w-5 h-5 text-slate-600" /></div>
                        <span className="font-medium text-slate-700">Microphone</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">REQUIRED</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-200 p-2 rounded-full"><Activity className="w-5 h-5 text-slate-600" /></div>
                        <span className="font-medium text-slate-700">Camera</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">REQUIRED</span>
                </div>
            </div>
            <button
                onClick={handlePermissionsGranted}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors"
            >
                Grant Permissions & Begin
            </button>
        </div>
    </div>
  );

  const renderTesting = () => {
    const question = QUESTIONS[currentQuestionIdx];
    return (
        <div className="flex h-full p-6 gap-6 bg-slate-50 overflow-hidden">
            {/* Left Panel: Camera With Box Overlay */}
            <div className="w-1/3 flex flex-col justify-center">
                <div className="aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg relative transition-all border-4 border-slate-200">
                    <CameraFeed 
                      isActive={true} 
                      showOverlay={true} 
                      onEmotionUpdate={handleEmotionUpdate}
                    />
                    <div className="absolute bottom-4 left-4 right-4">
                        <AudioVisualizer isActive={isListening} />
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Live Facial Expression Analysis
                </p>
            </div>

            {/* Right Panel: Question & Interaction */}
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Question {currentQuestionIdx + 1} of {QUESTIONS.length}
                    </div>
                    <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                    <div className="flex items-start gap-4 mb-8">
                        <button 
                            onClick={() => speakText(question.question)}
                            className="mt-1 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-primary transition-colors"
                            title="Read question"
                        >
                            <Volume2 className="w-6 h-6" />
                        </button>
                        <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                            {question.question}
                        </h2>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative">
                         {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                                <RefreshCw className="w-8 h-8 text-primary animate-spin mb-2" />
                                <span className="font-semibold text-primary">Analyzing cognitive response...</span>
                            </div>
                         )}

                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Tap the microphone to speak, or type your answer here..."
                            className="w-full h-32 p-4 text-lg text-slate-700 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
                            disabled={isProcessing}
                        />
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                            <button 
                                onClick={startListening}
                                disabled={isListening || isProcessing}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Mic className="w-4 h-4" />
                                {isListening ? 'Listening...' : 'Record Answer'}
                            </button>
                            <span className="text-xs text-slate-400 font-mono">
                                {transcript.trim().length > 0 ? `${transcript.trim().split(/\s+/).length} words recorded` : 'Waiting for input...'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleNextQuestion}
                        disabled={!transcript.trim() || isProcessing}
                        className={`
                            flex items-center justify-center gap-2 w-full py-4 rounded-xl text-lg font-semibold shadow-lg transition-all
                            ${!transcript.trim() || isProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-teal-800 transform hover:-translate-y-1'}
                        `}
                    >
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                Confirm & Next Question
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const renderResults = () => {
    const finalStage = calculateFinalStage();
    const stageInfo = STAGE_DESCRIPTIONS[finalStage];
    
    // Calculate Voice Analysis Metrics
    const answers = Object.values(sessionData.answers) as SessionAnswer[];
    const totalAnswers = answers.length;
    
    const avgPitch = Math.round(answers.reduce((acc, curr) => acc + curr.audioFeatures.pitch, 0) / (totalAnswers || 1));
    const totalHesitations = answers.reduce((acc, curr) => acc + curr.audioFeatures.stopperWordCount, 0);
    
    const confidentCount = answers.filter(a => a.audioFeatures.tone === 'Confident').length;
    const dominantTone = confidentCount >= totalAnswers / 2 ? 'Confident' : 'Hesitant';
    
    // Simple quality score calculation
    // Base 70. Minus 2 per hesitation. +15 if mostly confident.
    let qualityScore = 70; 
    if (dominantTone === 'Confident') qualityScore += 15;
    qualityScore -= (totalHesitations * 2);
    qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    let qualityLabel = "Average";
    if (qualityScore > 85) qualityLabel = "Excellent";
    else if (qualityScore > 70) qualityLabel = "Good";
    else if (qualityScore > 50) qualityLabel = "Fair";
    else qualityLabel = "Needs Attention";

    return (
        <div className="h-full overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto" ref={resultsRef}>
                <div className="flex items-center justify-between mb-8" data-html2canvas-ignore="true">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-slate-800">Final Assessment Report</h1>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {isGeneratingPdf ? 'Generating...' : 'Download Report'}
                        </button>
                        <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors px-4 py-2" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4" /> Restart
                        </button>
                    </div>
                </div>

                {/* Print Header - Visible only in PDF via manual logic or standard print, but for html2canvas we want a visible header in capture if we excluded top bar */}
                <div className="hidden print:block mb-8 border-b pb-4">
                     <h1 className="text-2xl font-bold text-slate-900">NeuroScreen AI - Cognitive Assessment Report</h1>
                     <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                {/* Main Score Card */}
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Cognitive Health Stage</h2>
                            <h3 className={`text-5xl font-bold ${stageInfo.color} mb-3`}>{stageInfo.title}</h3>
                            <p className="text-slate-600 text-lg max-w-2xl leading-relaxed">{stageInfo.desc}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-5xl font-mono font-bold text-slate-800">
                                {Math.round((Object.values(sessionData.answers) as SessionAnswer[]).reduce((acc, curr) => acc + curr.evaluation.score, 0))}
                                <span className="text-2xl text-slate-400">/100</span>
                             </div>
                             <span className="text-sm text-slate-500 uppercase tracking-wider">Total Score</span>
                        </div>
                    </div>
                    
                    {/* Stress Graph in Results */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-slate-500" />
                            <h4 className="font-semibold text-slate-700">Emotional Stress Timeline</h4>
                        </div>
                        <EmotionGraph data={sessionData.emotionTimeline} />
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Graph shows real-time fluctuations in stress (red), anxiety (orange), and calmness (green) throughout the session.
                        </p>
                    </div>
                </div>

                {/* Overall Voice Analysis Section */}
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-slate-500" />
                        <h4 className="font-semibold text-slate-700">Overall Voice Analysis</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Voice Quality</p>
                            <p className={`text-2xl font-bold ${qualityScore > 70 ? 'text-green-600' : 'text-orange-500'}`}>{qualityLabel}</p>
                            <p className="text-xs text-slate-500 mt-1">Based on tone & fluency</p>
                        </div>
                         <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Pitch</p>
                            <p className="text-2xl font-bold text-slate-700">{avgPitch} Hz</p>
                            <p className="text-xs text-slate-500 mt-1">Normal Range: 85-255 Hz</p>
                        </div>
                         <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dominant Tone</p>
                            <p className="text-2xl font-bold text-slate-700">{dominantTone}</p>
                            <p className="text-xs text-slate-500 mt-1">Consistency check</p>
                        </div>
                         <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Hesitations</p>
                            <p className="text-2xl font-bold text-slate-700">{totalHesitations}</p>
                            <p className="text-xs text-slate-500 mt-1">Detected stopper words</p>
                        </div>
                    </div>
                </div>

                {/* Simplified Detailed Analysis */}
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" /> Detailed Question Analysis
                </h3>
                
                <div className="space-y-6">
                    {(Object.values(sessionData.answers) as SessionAnswer[]).map((answer, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            {/* Header: Question & Score */}
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                                <h4 className="font-bold text-slate-800 text-lg flex-1 mr-4">
                                    {idx + 1}. {QUESTIONS[idx].question}
                                </h4>
                                <div className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${answer.evaluation.score >= 7 ? 'bg-green-100 text-green-700' : answer.evaluation.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    Score: {answer.evaluation.score}/10
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Patient Answer */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Patient Answer</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 italic">
                                        "{answer.transcript}"
                                    </div>
                                </div>

                                {/* Detailed Voice Tone Analysis */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Voice Tone Analysis</p>
                                    <div className="space-y-3 text-sm text-slate-600">
                                        <div className="flex justify-between border-b border-slate-50 pb-1">
                                            <span>Tone:</span>
                                            <span className={`font-medium ${answer.audioFeatures.tone === 'Confident' ? 'text-green-600' : 'text-orange-500'}`}>
                                                {answer.audioFeatures.tone}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-1">
                                            <span>Hesitation Markers:</span>
                                            <span className="font-medium text-slate-800">{answer.audioFeatures.stopperWordCount} detected</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-1">
                                            <span>Speech Stability:</span>
                                            <span className="font-medium text-slate-800">
                                                {answer.audioFeatures.stopperWordCount > 2 ? 'Fragmented' : 'Fluid'}
                                            </span>
                                        </div>
                                         <div className="flex justify-between">
                                            <span>Pitch Variance:</span>
                                            <span className="font-medium text-slate-800">
                                                {Math.round(answer.audioFeatures.pitch)} Hz (Normal Range)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>Report generated by NeuroScreen AI. This is a screening tool, not a medical diagnosis.</p>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen w-full bg-slate-100 font-sans text-slate-900">
      {stage === AppStage.LANDING && renderLanding()}
      {stage === AppStage.PERMISSIONS && renderPermissions()}
      {(stage === AppStage.TESTING || stage === AppStage.PROCESSING) && renderTesting()}
      {stage === AppStage.RESULTS && renderResults()}
    </div>
  );
};

export default App;