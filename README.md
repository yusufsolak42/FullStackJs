# AI Integration Project

Welcome to the AI Integration Project! This Node.js application leverages OpenAI's APIs to offer a variety of AI-powered features. It's built with Express.js on the backend and provides a user-friendly frontend for seamless interaction.

## Features

- **Text Prompt Processing**: Generate responses from text prompts using GPT-3.5-turbo.
- **Image Generation**: Create images from text prompts with DALL-E 3.
- **Image Understanding**: Analyze and describe uploaded images.
- **Text-to-Speech**: Convert text to speech and save it as an MP3 file.
- **Speech-to-Text**: Transcribe audio files to text using Whisper.

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/your-repo-name.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   openAiKey=your_api_key_here
   ```

### Running the Application

Start the server:
```
node server.js
```

Visit `http://localhost:3000` in your web browser to use the application.

## API Endpoints

- `/api/handle-prompt`: Process text prompts
- `/api/text-image`: Generate images from text
- `/api/image-to-text`: Analyze uploaded images
- `/api/text-to-speech`: Convert text to audio
- `/api/speech-to-text`: Transcribe audio to text

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.
   
