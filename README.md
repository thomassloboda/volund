# Völund

Völund is an Electron app that allows users to run code and see execution results in a sandbox environment. It provides a clean, intuitive interface for writing, testing, and experimenting with code in multiple programming languages.

## Features

### Sandbox Environment
- **Monaco Editor Integration**: Professional code editor with syntax highlighting
- **Multiple Layout Options**: 
  - Side by side (code on left, results on right)
  - Top and bottom (code on top, results on bottom)
- **Language Selection**: Toggle between supported languages with intuitive icons

### Code Execution
- **Smart Execution**: Code is evaluated with a 1-second debounce to prevent excessive executions
- **Timeout Protection**: Runtime timeout to prevent infinite loops
- **Console Output Capture**: Properly captures and displays console output (console.log, etc.)

### Tab System
- **Multiple Sandboxes**: Create multiple tabs, each with its own isolated environment
- **Persistent Tabs**: Tabs are saved across sessions
- **Custom Tab Titles**: Rename tabs by double-clicking on the tab title
- **Independent Settings**: Each tab maintains its own language, layout, and code content

### Settings
- **Theme Options**: Switch between light, dark, and auto themes
- **Language Versions**: Select from installed language versions
- **Persistent Settings**: Settings are saved in SQLite database

### Supported Languages
- JavaScript
- TypeScript
- Python

## Installation

### From GitHub Releases
1. Go to the [GitHub repository](https://github.com/thomassloboda/runner)
2. Navigate to the Releases section
3. Download the appropriate installer for your operating system:
   - Windows: `.exe` installer
   - macOS: `.dmg` or `.zip` file
   - Linux: `.deb` or `.rpm` package
4. Run the installer to install the application

### From Source
```bash
# Clone the repository
git clone https://github.com/thomassloboda/runner.git
cd runner

# Install dependencies
npm install

# Start the application
npm start

# Build the application
npm run make
```

## Usage

### Creating a New Tab
Click the "+" button in the tab bar to create a new tab.

### Selecting a Language
Use the language toggle buttons at the top of the editor to select your preferred programming language.

### Selecting a Language Version
After selecting a language, use the version dropdown that appears to select a specific version (if available).

### Changing the Layout
Use the layout icons in the top bar to switch between side-by-side and top-bottom layouts.

### Changing the Theme
Click the theme icon in the top bar to cycle through light, dark, and auto themes.

### Renaming a Tab
Double-click on a tab's title to rename it.

### Running Code
Simply type your code in the editor. The code will be executed automatically after a short delay (1 second of inactivity).

### Viewing Results
Results of your code execution will appear in the results panel. This includes both return values and console output.

## How It Was Made

Völund was built using modern web technologies and follows clean architecture principles:

### Architecture
The application follows a clean architecture approach with clear separation of concerns:
- **Core**: Contains entities and use cases
- **Infrastructure**: Implements repositories and runners
- **Adapters**: Handles IPC communication
- **UI**: Manages the renderer process

### Development Process
The project evolved through several key phases:
1. **Initial Setup**: Basic Electron app with Monaco Editor integration
2. **Language Support**: Added runners for JavaScript, TypeScript, and Python
3. **UI Enhancements**: Implemented toggle buttons, icons, and theme switching
4. **Tab System**: Added support for multiple tabs with independent environments
5. **Settings Storage**: Implemented SQLite database for persistent settings
6. **Release Configuration**: Set up Electron Forge for building and publishing releases

## Technologies Used

### Frontend
- **Electron**: Cross-platform desktop application framework
- **Monaco Editor**: Code editor that powers VS Code
- **TypeScript**: Type-safe JavaScript
- **CSS**: Styling with variables for theming

### Backend
- **Node.js**: JavaScript runtime
- **SQLite**: Embedded database for storing settings and tabs
- **Electron IPC**: Inter-process communication between main and renderer processes

### Build Tools
- **Electron Forge**: Complete tool for building and publishing Electron applications
- **Vite**: Next-generation frontend build tool
- **TypeScript**: For type checking and compilation

## Project Structure
```
völund/
├── src/                  # Source code
│   ├── core/             # Core business logic
│   │   ├── entities/     # Domain entities
│   │   └── usecases/     # Application use cases
│   ├── infrastructure/   # External interfaces
│   │   ├── db/           # Database repositories
│   │   └── runners/      # Language runners
│   ├── adapters/         # IPC handlers
│   ├── images/           # Application icons and images
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script
│   └── renderer.ts       # Renderer process entry point
├── forge.config.ts       # Electron Forge configuration
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

## Contributing
Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Upcoming Features
- Support for additional programming languages (Ruby, Go, etc.)
