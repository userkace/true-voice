# TrueVoice - AI-Powered Voice Authenticator

A browser extension that helps detect AI-generated voice recordings with machine learning.

![Demo](assets/usage.gif)

## Features

- Drag and drop audio file analysis
- Real-time prediction of AI-generated vs human voice
- Clean, modern interface
- Fast and lightweight

## Installation

### From Chrome Web Store (Future Recommendation)

### Manual Installation

> 📺 [Watch the installation tutorial on YouTube](https://www.youtube.com/watch?v=oswjtLwCUqg)


1. Clone this repository:
   ```bash
   git clone https://github.com/userkace/true-voice.git
   cd true-voice
   ```

2. Open Chrome/Edge and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in the top-right corner)

4. Click "Load unpacked" and select the `true-voice` directory

## Usage

1. Click the extension icon in your browser's toolbar
2. Drag and drop an audio file or click to browse
3. View the prediction results (Real or Fake) with confidence percentage

## Model Training

The transformer model used in this extension was trained using the code available [here](https://github.com/left-no-crumbz/thesis-testing).

## Development

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

2. Build the extension:
   ```bash
   npm run build
   # or
   yarn build
   ```

3. Load the extension in your browser as described in the Installation section

### File Structure

- `assets/` - Demo and usage GIFs
- `icons/` - Extension icons in different sizes
- `popup.html` - Main extension popup UI
- `popup.js` - Extension logic and API integration
- `styles.css` - Styling for the extension
- `hooks.js` - Browser extension hooks and utilities
- `manifest.json` - Extension configuration