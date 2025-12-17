
# NeuroScreen AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)

An advanced early dementia screening tool utilizing multimodal AI analysis. NeuroScreen AI combines voice pattern analysis, real-time facial micro-expression detection, and cognitive response evaluation powered by Google's Gemini AI to provide comprehensive cognitive health assessments.

## 🚀 Features

### Multimodal Analysis
- **Voice Analysis**: Detects pitch variations, tone consistency, and hesitation markers (stopper words)
- **Facial Expression Tracking**: Real-time emotion detection using computer vision
- **Cognitive Evaluation**: AI-powered assessment of responses using Gemini AI

### Interactive Assessment
- **Speech Recognition**: Web Speech API integration for voice input
- **Text-to-Speech**: Automated question reading for accessibility
- **Real-time Feedback**: Live emotion tracking during assessment
- **Progress Tracking**: Visual progress indicators and session management

### Comprehensive Reporting
- **Detailed Reports**: Individual question analysis with scores and insights
- **Emotional Timeline**: Visual graphs showing stress and anxiety fluctuations
- **PDF Generation**: Exportable assessment reports using jsPDF and html2canvas
- **Voice Quality Metrics**: Pitch analysis, tone consistency, and fluency scoring

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Privacy-Focused**: Local processing with no data storage
- **Accessible Interface**: Clear navigation and intuitive controls
- **Error Handling**: Robust error management and user feedback

## 🛠️ Technologies Used

### Frontend
- **React 19.2.3** - Modern UI framework with hooks and functional components
- **TypeScript 5.8.2** - Type-safe JavaScript development
- **Vite 6.2.0** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework (via CDN)

### AI & Computer Vision
- **Google Gemini AI** - Advanced language model for cognitive evaluation
- **@vladmandic/human** - Real-time facial expression and emotion detection
- **Web Speech API** - Browser-native speech recognition and synthesis

### Data Visualization & Export
- **Recharts** - React charting library for emotion timeline graphs
- **jsPDF** - PDF document generation
- **html2canvas** - HTML to image conversion for PDF reports

### Development Tools
- **Lucide React** - Beautiful icon library
- **ESLint** - Code linting and formatting
- **Vite Plugins** - React and other development enhancements

## 📋 Prerequisites

Before running NeuroScreen AI, ensure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Modern Web Browser** with:
  - Camera access permissions
  - Microphone access permissions
  - Web Speech API support (Chrome recommended)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NAVNEET-PRATAP-BYTE/NeuroScreenAI.git
   cd neuroscreen-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > **Note:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` (default Vite port)

## 🎯 Usage

### Starting an Assessment

1. **Launch the Application**: Open the app in your browser
2. **Grant Permissions**: Allow camera and microphone access when prompted
3. **Begin Screening**: Click "Start Screening" to initiate the assessment

### During the Assessment

- **Listen Carefully**: Questions are read aloud automatically
- **Respond Naturally**: Speak your answers or type them in the text area
- **Use Voice Input**: Click the microphone button for speech recognition
- **Monitor Progress**: Watch the progress bar and emotion indicators

### Viewing Results

- **Comprehensive Report**: Review detailed analysis of all responses
- **Emotion Timeline**: Analyze stress and anxiety patterns over time
- **Voice Metrics**: Examine pitch, tone, and fluency scores
- **Export Options**: Download PDF reports for record-keeping

## ⚙️ Configuration

### API Keys
- **GEMINI_API_KEY**: Required for AI-powered response evaluation
- Obtain from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Assessment Parameters
The assessment includes customizable elements in `constants.ts`:
- **Questions**: Cognitive assessment prompts
- **Stopper Words**: Words indicating hesitation or cognitive load
- **Scoring Weights**: Evaluation criteria and thresholds

### Technical Settings
- **Emotion Sampling**: Configurable update frequency (default: 500ms)
- **PDF Quality**: Adjustable resolution for report generation
- **Speech Recognition**: Language and sensitivity settings

## 🧠 How It Works

### Assessment Flow
1. **Initialization**: User grants camera and microphone permissions
2. **Question Presentation**: System presents cognitive assessment questions
3. **Multimodal Capture**: Simultaneously records voice and facial expressions
4. **Real-time Analysis**: Processes audio features and emotion data
5. **AI Evaluation**: Gemini AI analyzes response quality and cognitive indicators
6. **Report Generation**: Compiles comprehensive assessment results

### Analysis Components

#### Voice Analysis
- **Pitch Detection**: Measures vocal frequency variations
- **Tone Consistency**: Evaluates confidence and hesitation patterns
- **Stopper Word Detection**: Identifies filler words and pauses
- **Speech Fluency**: Analyzes response coherence and flow

#### Facial Expression Analysis
- **Emotion Recognition**: Detects stress, anxiety, and neutral states
- **Micro-expression Tracking**: Monitors subtle facial changes
- **Real-time Monitoring**: Continuous assessment throughout session
- **Timeline Visualization**: Graphical representation of emotional states

#### Cognitive Evaluation
- **Response Quality**: AI-powered assessment of answer relevance
- **Contextual Analysis**: Understanding of question comprehension
- **Scoring Algorithm**: Weighted evaluation of multiple factors
- **Comparative Metrics**: Benchmarking against established criteria

## 🤝 Contributing

We welcome contributions to NeuroScreen AI! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

### Areas for Contribution
- **Algorithm Improvements**: Enhance AI evaluation accuracy
- **UI/UX Enhancements**: Improve user interface and experience
- **Additional Languages**: Multi-language support for assessments
- **Accessibility Features**: Better support for diverse user needs
- **Performance Optimization**: Faster processing and reduced latency

### Code Standards
- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Maintain consistent code formatting
- Add comprehensive error handling
- Include appropriate TypeScript types

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**NeuroScreen AI is a screening tool, not a medical diagnostic device.**

- This application is designed for preliminary cognitive health assessment only
- Results should not be considered as medical diagnoses
- Always consult qualified healthcare professionals for medical advice
- The tool analyzes patterns that may indicate cognitive concerns but cannot confirm conditions
- Regular medical check-ups and professional evaluations are essential for health monitoring

## 📞 Support

For questions, issues, or contributions:
- Open an issue on [GitHub](https://github.com/NAVNEET-PRATAP-BYTE/NeuroScreenAI/issues)
- Review the documentation in the `docs/` folder
- Check the troubleshooting guide in `docs/installation.txt`

## 🔄 Updates

Stay updated with the latest features and improvements by:
- Watching the repository for releases
- Following development updates
- Checking the changelog for new versions

---

<div align="center">
  <p><strong>Built with ❤️ for cognitive health awareness</strong></p>
  <p>Empowering early detection through technology</p>
</div>
