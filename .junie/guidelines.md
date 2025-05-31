# Völund

Völund is an Electron app that allows users to run code and see execution results in a sandbox environment.

## General context

If state.json doesn't exist, create it. You'll log in every step you work on giving it a title, a short description, a status (planned, in progress, done), last update time as ISO string.
If state.json exists, read it, execute the next task then update state.json.

## Technical information

### Technical stack

- TypeScript
- Electron
- Monaco Editor
- SQLite

### Software architecture

The application follows clean architecture principles with clear separation of concerns:
- Core (entities and use cases)
- Infrastructure (repositories and runners)
- Adapters (IPC handlers)
- UI (renderer)

## Features

### 01 - Sandbox

The application displays a screen with two layout configurations:
- Side by side (code left and results right)
- Top and bottom (code top and results bottom)

Users can select the programming language with a toggle and icons, and select the language version when applicable.

Code is highlighted based on the selected language using Monaco Editor.

### 02 - Results

Code is evaluated with a 1-second debounce to prevent excessive executions. A timeout is set on runtime to avoid infinite loops.

Console output (console.log, etc.) is properly captured and displayed in the results area.

### 03 - Settings

Settings are accessible from the top bar. Users can:
- Switch between light, dark, and auto themes
- View and select installed language versions

Settings are saved in the SQLite database with each setting stored under its own key for better organization and performance.

The application remembers the user's theme and language preferences and applies them when creating new tabs or restarting the application.

### 04 - Tab System

Users can create multiple tabs, each with its own:
- Title (can be extracted from code comments or set by double-clicking on the tab title)
- Language selection
- Layout configuration
- Code content

Tabs provide an isolated sandbox environment, allowing users to work on multiple code snippets simultaneously.

Tabs are persisted across sessions, so users can continue where they left off when reopening the application.

Tab titles can be easily renamed by double-clicking on the tab title, which allows users to organize their work more effectively.

### 05 - Language Support

The application supports multiple programming languages:
- JavaScript
- TypeScript
- Python

Each language has its own runner implementation that handles execution and output formatting.

Users can select different versions of each language when available.

### 06 - UI Features

The application features a modern, responsive UI with:
- Language selection via toggle buttons with icons
- Language version selectors that appear based on the selected language
- Layout selection via icon buttons
- Theme switching (light/dark/auto) via icon buttons
- App-wide theming that applies to all UI elements, not just the editor

The UI is designed to be intuitive and user-friendly, with a clean and consistent look across the entire application.

### 07 - GitHub Installation

The application can be installed directly from GitHub releases. The application is configured to be published to GitHub using Electron Forge's GitHub publisher. This allows users to:
- Download the latest release from the GitHub repository
- Receive automatic updates when new versions are published
- Install the application on Windows, macOS, and Linux

To install the application from GitHub:
1. Go to the GitHub repository at https://github.com/thomassloboda/runner
2. Navigate to the Releases section
3. Download the appropriate installer for your operating system
4. Run the installer to install the application

For developers who want to publish the application to GitHub:
1. Ensure you have the necessary GitHub access token with appropriate permissions
2. Run `npm run publish` to build and publish the application to GitHub releases

## Upcoming Features

### More Languages

Planned enhancements include:
- Support for additional programming languages (Ruby, Go, etc.)
