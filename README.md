# Tape - AI-Powered 3D Object Generator

A modern web application that uses AI to generate interactive 3D objects from natural language descriptions. Built with Three.js and powered by Puter.js for **FREE** AI access!

## Features

- 🎨 **AI-Powered 3D Generation**: Describe any object and watch it come to life in 3D
- 🆓 **100% FREE AI**: No API keys, no limits, no registration required!
- 🤖 **Advanced AI Models**: Claude Opus 4, GPT-5, Gemini 2.5 Pro selection
- 🧠 **Smart Model Selection**: Choose the best AI model for your needs
- 💬 **Chat Interface**: Manage multiple conversations with full history
- 🌓 **Dark/Light Mode**: Beautiful themes that adapt to your preference
- 🔄 **Real-time Rendering**: Interactive 3D objects with animations
- 📐 **Grid Workspace**: Professional 3D workspace with spatial reference
- 💾 **Persistent Storage**: Your chats and objects are saved locally
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔐 **Local Authentication**: Simple sign-in/sign-up system with local storage
- 🎯 **Enhanced Fallbacks**: Smart object generation even when AI fails
- 🐍 **AI Training Tools**: Python scripts for improving 3D generation

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tape
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

The `.env` file is already configured for free AI:
```env
VITE_USE_PUTER_AI=true
```

### 3. No API Key Needed! 🎉
- **Puter.js provides FREE AI models**
- No registration required
- No API limits
- Multiple AI models available (Claude, GPT-4, etc.)

### 4. Run the Application
Since this is a client-side application, you can:

**Option A: Use a local server**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

**Option B: Open directly in browser**
Simply open `index.html` in your browser (some features may be limited)

### 5. Start Creating!
- Type a description like "a spinning red cube" or "a golden dragon"
- Watch as AI generates the 3D object
- Use mouse to rotate, zoom, and explore your creation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_USE_PUTER_AI` | Enable free Puter.js AI models | No (default: true) |

| `VITE_DEBUG_MODE` | Enable debug logging | No |
| `VITE_ENABLE_PHYSICS` | Enable physics simulation | No |
| `VITE_ENABLE_POSTPROCESSING` | Enable visual effects | No |

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **3D Graphics**: Three.js with additional libraries
- **AI**: Puter.js (Free AI models including Claude, GPT-4, etc.)
- **Styling**: Tailwind CSS
- **Authentication**: Local storage-based system
- **Storage**: LocalStorage for chats and user data

## Three.js Libraries Used

- **Core**: Three.js for 3D rendering
- **Controls**: OrbitControls for camera interaction
- **Loaders**: GLTFLoader, OBJLoader for model loading
- **Post-processing**: EffectComposer for visual effects
- **Physics**: Cannon.js integration for realistic physics
- **Materials**: Enhanced materials and shaders

## 🤖 AI Model Selection

Choose from the latest and most powerful AI models in **Settings** → **AI Model**:

- **Claude Opus 4** (Recommended) - Most advanced reasoning and creativity
- **GPT-5** (Latest) - OpenAI's newest model with enhanced capabilities  
- **Gemini 2.5 Pro** (Google) - Advanced multimodal understanding
- **Claude 3.5 Sonnet** (Fallback) - Fast and reliable generation
- **GPT-4o Mini** (Speed) - Quick responses for simple objects

## 🐍 AI Training & Enhancement

Improve 3D object generation with our Python training tools:

```bash
# Install training dependencies
pip install -r requirements.txt

# Generate training data
python train_3d_ai.py
```

This creates comprehensive training datasets with 500+ examples covering:
- Basic shapes (spheres, cubes, cylinders, etc.)
- Advanced materials (metallic, glass, crystal, plasma)
- Complex animations (floating, pulsing, color-changing)
- Realistic physics and lighting

## Example Prompts

Try these prompts to see what Tape can create:

- "A spinning golden sphere with metallic reflections"
- "A crystalline tower with glowing edges"
- "A floating island with trees and waterfalls"
- "A mechanical robot with moving parts"
- "A glass pyramid with rainbow refractions"
- "A wooden sailing ship on ocean waves"
- "A transparent glass sphere"
- "A glowing plasma ball"
- "A rotating rainbow cone"

## Features in Detail

### Chat Management
- Create multiple chat sessions
- Rename and organize your conversations
- Delete unwanted chats
- Switch between different projects seamlessly

### 3D Object Generation
- Natural language processing via Gemini AI
- Real-time Three.js code generation
- Automatic object animation
- Interactive camera controls
- Responsive 3D viewport

### User Interface
- Clean, modern design
- Collapsible sidebar
- Theme switching
- Responsive layout
- Keyboard shortcuts

## Development

### Project Structure
```
tape/
├── index.html          # Main HTML file
├── scripts.js          # Core JavaScript functionality
├── styles.css          # Custom CSS styles
├── .env               # Environment variables (create from .env.example)
├── .env.example       # Environment template
└── README.md          # This file
```

### Key Functions
- `callGenerativeAI()`: Interfaces with Puter.js AI models
- `initThreeJS()`: Sets up 3D scene
- `createNewChat()`: Manages chat sessions
- `handleFormSubmit()`: Processes user input

## Security Notes

- API keys are loaded from environment variables
- Never commit `.env` file to version control
- Consider using a backend proxy for production
- Supabase provides secure authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the license file for details.

## Support

If you encounter issues:
1. Ensure Puter.js is loading properly (check browser console)
2. Ensure you're running a local server (not file://)
3. Check browser console for error messages
4. Verify environment variables are loaded correctly

## Roadmap

- [ ] Advanced physics simulation
- [ ] Model export functionality
- [ ] Collaborative editing
- [ ] VR/AR support
- [ ] Advanced material editor
- [ ] Animation timeline
- [ ] Cloud storage integration

---

Built with ❤️ using AI and modern web technologies.