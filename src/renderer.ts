/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import './index.css';
import * as monaco from 'monaco-editor';

// Define the API interface exposed by the preload script
declare global {
  interface Window {
    api: {
      runCode: (code: string, lang: string) => Promise<any>;
      getSettings: () => Promise<any>;
      saveSnippet: (snippet: any) => Promise<void>;
      listSnippets: () => Promise<any[]>;
      getTabs: () => Promise<any[]>;
      saveTab: (tab: any) => Promise<any>;
      deleteTab: (id: string) => Promise<void>;
      installPackages: (packages: string[], language: string) => Promise<any>;
    };
  }
}

// Define the Tab interface
interface Tab {
  id: string;
  title: string;
  editor: monaco.editor.IStandaloneCodeEditor;
  language: string;
  layout: string;
  debounceTimeout: NodeJS.Timeout | null;
  resultsContainer: HTMLElement;
}

// Global variables
const tabs: Tab[] = [];
let currentTabId: string | null = null;
let settings: any = {};
let tabCounter = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();

  // Load tabs from database
  await loadTabs();

  // Set up event listeners
  setupEventListeners();
});

// Load tabs from the database
async function loadTabs() {
  try {
    const savedTabs = await window.api.getTabs();
    console.log('Tabs loaded:', savedTabs);

    if (savedTabs.length === 0) {
      // Create a default tab if no tabs are saved
      createNewTab();
      return;
    }

    // Create tabs from saved data
    savedTabs.forEach(tabData => {
      createTabFromData(tabData);
    });

    // Switch to the first tab
    if (tabs.length > 0) {
      switchToTab(tabs[0].id);
    }
  } catch (error) {
    console.error('Error loading tabs:', error);
    // Create a default tab if there's an error
    createNewTab();
  }
}

// Create a tab from saved data
function createTabFromData(tabData: any) {
  // Create tab element
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tabData.id;

  // Extract title from code if possible
  let title = tabData.title;
  const firstLine = tabData.code.split('\n')[0];
  const jsMatch = firstLine.match(/\/\/\s*Name:\s*(.*)/);
  const pyMatch = firstLine.match(/#\s*Name:\s*(.*)/);
  if (jsMatch || pyMatch) {
    const extractedTitle = (jsMatch ? jsMatch[1] : pyMatch[1]).trim();
    if (extractedTitle) {
      title = extractedTitle;
    }
  }

  tabElement.innerHTML = `
    <span>${title}</span>
    <span class="tab-close">×</span>
  `;

  // Insert tab before the new tab button
  const tabBar = document.querySelector('.tab-bar');
  const newTabButton = document.getElementById('new-tab-button');
  tabBar?.insertBefore(tabElement, newTabButton);

  // Create sandbox container
  const sandboxContainer = document.createElement('div');
  sandboxContainer.className = `main-container ${tabData.layout}`;
  sandboxContainer.dataset.tabId = tabData.id;
  sandboxContainer.style.display = 'none'; // Hide initially

  // Create editor and results containers
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  editorContainer.id = `editor-container-${tabData.id}`;

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'results-container';
  resultsContainer.id = `results-container-${tabData.id}`;
  resultsContainer.textContent = 'Results will appear here...';

  // Add containers to sandbox
  sandboxContainer.appendChild(editorContainer);
  sandboxContainer.appendChild(resultsContainer);

  // Add sandbox to the document
  document.getElementById('sandbox-containers')?.appendChild(sandboxContainer);

  // Initialize Monaco Editor for this tab
  const editor = initEditor(editorContainer, tabData.id, tabData.code);

  // Create tab object
  const tab: Tab = {
    id: tabData.id,
    title: title,
    editor,
    language: tabData.language,
    layout: tabData.layout,
    debounceTimeout: null,
    resultsContainer
  };

  // Add tab to tabs array
  tabs.push(tab);

  // Add event listeners
  tabElement.addEventListener('click', (e) => {
    // Ignore if the close button was clicked
    if ((e.target as HTMLElement).classList.contains('tab-close')) {
      return;
    }
    switchToTab(tabData.id);
  });

  tabElement.querySelector('.tab-close')?.addEventListener('click', () => {
    closeTab(tabData.id);
  });

  // Make tab renamable
  makeTabRenamable(tabElement, tabData.id);

  // Update tab counter if needed
  const tabNumber = parseInt(tabData.id.replace('tab-', ''), 10);
  if (!isNaN(tabNumber) && tabNumber > tabCounter) {
    tabCounter = tabNumber;
  }
}

// Make a tab renamable by adding double-click event listener to the title span
function makeTabRenamable(tabElement: HTMLElement, tabId: string) {
  const titleSpan = tabElement.querySelector('span:first-child');
  if (!titleSpan) return;

  titleSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();

    // Create input element for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = titleSpan.textContent || '';
    input.className = 'tab-title-input';
    input.style.width = `${Math.max(100, titleSpan.clientWidth + 20)}px`;
    input.style.border = 'none';
    input.style.padding = '2px 4px';
    input.style.margin = '0';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = 'inherit';
    input.style.backgroundColor = 'var(--bg-color)';
    input.style.color = 'var(--text-color)';

    // Replace span with input
    titleSpan.replaceWith(input);
    input.focus();
    input.select();

    // Function to save the new title
    const saveTitle = () => {
      const newTitle = input.value.trim() || `Tab ${tabId.replace('tab-', '')}`;
      const newTitleSpan = document.createElement('span');
      newTitleSpan.textContent = newTitle;

      // Replace input with span
      input.replaceWith(newTitleSpan);

      // Update tab object
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.title = newTitle;
        // Save tab to database
        saveTabToDatabase(tabId);
      }

      // Make the new span renamable
      makeTabRenamable(tabElement, tabId);
    };

    // Save on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTitle();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        input.replaceWith(titleSpan);
        // Re-add event listener to the original span
        makeTabRenamable(tabElement, tabId);
      }
    });

    // Save on blur (when clicking outside)
    input.addEventListener('blur', saveTitle);
  });
}

// Create a new tab
function createNewTab() {
  // Increment tab counter
  tabCounter++;

  // Create a unique ID for the tab
  const tabId = `tab-${tabCounter}`;

  // Create tab element
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tabId;
  tabElement.innerHTML = `
    <span>Tab ${tabCounter}</span>
    <span class="tab-close">×</span>
  `;

  // Insert tab before the new tab button
  const tabBar = document.querySelector('.tab-bar');
  const newTabButton = document.getElementById('new-tab-button');
  tabBar?.insertBefore(tabElement, newTabButton);

  // Create sandbox container
  const sandboxContainer = document.createElement('div');
  sandboxContainer.className = 'main-container horizontal';
  sandboxContainer.dataset.tabId = tabId;
  sandboxContainer.style.display = 'none'; // Hide initially

  // Create editor and results containers
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  editorContainer.id = `editor-container-${tabId}`;

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'results-container';
  resultsContainer.id = `results-container-${tabId}`;
  resultsContainer.textContent = 'Results will appear here...';

  // Add containers to sandbox
  sandboxContainer.appendChild(editorContainer);
  sandboxContainer.appendChild(resultsContainer);

  // Add sandbox to the document
  document.getElementById('sandbox-containers')?.appendChild(sandboxContainer);

  // Initialize Monaco Editor for this tab
  const editor = initEditor(editorContainer, tabId);

  // Create tab object with last used language if available
  const defaultLanguage = settings.lastLanguage || 'ts';
  const tab: Tab = {
    id: tabId,
    title: `Tab ${tabCounter}`,
    editor,
    language: defaultLanguage,
    layout: 'horizontal',
    debounceTimeout: null,
    resultsContainer
  };

  // Add tab to tabs array
  tabs.push(tab);

  // Set as current tab
  switchToTab(tabId);

  // Add event listeners
  tabElement.addEventListener('click', (e) => {
    // Ignore if the close button was clicked
    if ((e.target as HTMLElement).classList.contains('tab-close')) {
      return;
    }
    switchToTab(tabId);
  });

  tabElement.querySelector('.tab-close')?.addEventListener('click', () => {
    closeTab(tabId);
  });

  // Make tab renamable
  makeTabRenamable(tabElement, tabId);

  // Save tab to database
  saveTabToDatabase(tabId);

  return tabId;
}

// Generate default code for a given language and tab title
function generateDefaultCode(language: string, tabTitle: string): string {
  if (language === 'py') {
    return `# Name: ${tabTitle}\n\n# Write your code here\nprint("Hello, World!")\n`;
  } else {
    return `// Name: ${tabTitle}\n\n// Write your code here\nconsole.log("Hello, World!");\n`;
  }
}

// Check if the code is the default code for the given language
function isDefaultCode(code: string, language: string): boolean {
  const firstLine = code.split('\n')[0];
  const titleMatch = language === 'py'
    ? firstLine.match(/#\s*Name:\s*(.*)/)
    : firstLine.match(/\/\/\s*Name:\s*(.*)/);

  if (!titleMatch) return false;

  const restOfCode = code.split('\n').slice(1).join('\n');

  if (language === 'py') {
    return restOfCode.includes('# Write your code here') &&
           restOfCode.includes('print("Hello, World!")');
  } else {
    return restOfCode.includes('// Write your code here') &&
           restOfCode.includes('console.log("Hello, World!");');
  }
}

// Initialize Monaco Editor for a specific tab
function initEditor(container: HTMLElement, tabId: string, initialCode?: string) {
  // Get the tab's language
  const tab = tabs.find(t => t.id === tabId);
  const language = tab?.language || 'ts';

  // Set default code with a comment containing the tab name
  let defaultCode = '';
  if (!initialCode) {
    const tabTitle = `Tab ${tabCounter}`;
    // Use the last used language if available and no tab language is set
    const codeLanguage = language || (settings.lastLanguage || 'ts');
    defaultCode = generateDefaultCode(codeLanguage, tabTitle);
  }

  // Use the last used language if available and no tab language is set
  const editorLanguage = language || (settings.lastLanguage || 'ts');

  const editor = monaco.editor.create(container, {
    value: initialCode || defaultCode,
    language: editorLanguage === 'ts' ? 'typescript' : 'python',
    automaticLayout: true,
    minimap: {
      enabled: false
    }
  });

  // Set up editor change listener with debounce
  editor.onDidChangeModelContent((e) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Check for snippet references and replace them
    const model = editor.getModel();
    if (model) {
      const changes = e.changes;
      for (const change of changes) {
        // Only process if content was added (not deleted)
        if (change.text) {
          const position = model.getPositionAt(change.rangeOffset + change.text.length);
          const lineContent = model.getLineContent(position.lineNumber);

          // Check if we just completed a snippet reference pattern
          const match = lineContent.match(/@\{([^}]+)\}$/);
          if (match) {
            const snippetTitle = match[1];
            const snippet = snippets.find(s => s.title === snippetTitle);

            if (snippet) {
              // Calculate the range to replace
              const startColumn = position.column - match[0].length;
              const endColumn = position.column;
              const range = new monaco.Range(
                position.lineNumber,
                startColumn,
                position.lineNumber,
                endColumn
              );

              // Replace the snippet reference with the snippet code
              editor.executeEdits('snippet-replacement', [{
                range: range,
                text: snippet.code,
                forceMoveMarkers: true
              }]);
            }
          }
        }
      }
    }

    if (tab.debounceTimeout) {
      clearTimeout(tab.debounceTimeout);
    }

    tab.debounceTimeout = setTimeout(() => {
      // Update tab title based on first line if it matches the pattern
      updateTabTitle(tabId);

      // Save tab to database
      saveTabToDatabase(tabId);

      if (currentTabId === tabId) {
        runCode();
      }
    }, 1000); // 1 second debounce
  });

  return editor;
}

// Update tab title based on first line if it matches the pattern
function updateTabTitle(tabId: string) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const code = tab.editor.getValue();
  const firstLine = code.split('\n')[0];

  // Check for JavaScript/TypeScript style comment
  const jsMatch = firstLine.match(/\/\/\s*Name:\s*(.*)/);
  if (jsMatch) {
    const title = jsMatch[1].trim();
    if (title) {
      tab.title = title;
      const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"] span:first-child`);
      if (tabElement) {
        tabElement.textContent = title;
      }
      return;
    }
  }

  // Check for Python style comment
  const pyMatch = firstLine.match(/#\s*Name:\s*(.*)/);
  if (pyMatch) {
    const title = pyMatch[1].trim();
    if (title) {
      tab.title = title;
      const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"] span:first-child`);
      if (tabElement) {
        tabElement.textContent = title;
      }
      return;
    }
  }

  // If no match, use tab index
  const tabIndex = tabId.replace('tab-', '');
  tab.title = `Tab ${tabIndex}`;
  const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"] span:first-child`);
  if (tabElement) {
    tabElement.textContent = `Tab ${tabIndex}`;
  }
}

// Save tab to database
async function saveTabToDatabase(tabId: string) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  try {
    await window.api.saveTab({
      id: tab.id,
      title: tab.title,
      language: tab.language,
      code: tab.editor.getValue(),
      layout: tab.layout
    });
    console.log('Tab saved:', tab.id);
  } catch (error) {
    console.error('Error saving tab:', error);
  }
}

// Switch to a specific tab
function switchToTab(tabId: string) {
  // Hide all sandbox containers
  document.querySelectorAll('.main-container').forEach(container => {
    container.style.display = 'none';
  });

  // Show the selected sandbox container
  const container = document.querySelector(`.main-container[data-tab-id="${tabId}"]`);
  if (container) {
    container.style.display = 'flex';
  }

  // Update tab classes
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.classList.add('active');
  }

  // Update current tab ID
  currentTabId = tabId;

  // Update UI based on tab settings
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    // Update language toggle
    document.querySelectorAll('.language-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeLanguageBtn = document.querySelector(`.language-toggle-btn[data-language="${tab.language}"]`);
    if (activeLanguageBtn) {
      activeLanguageBtn.classList.add('active');
    }

    // Update version selector
    updateVersionSelector(tab.language);

    // Update display toggle
    document.querySelectorAll('.display-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeLayoutBtn = document.querySelector(`.display-toggle-btn[data-layout="${tab.layout}"]`);
    if (activeLayoutBtn) {
      activeLayoutBtn.classList.add('active');
    }
  }
}

// Close a tab
function closeTab(tabId: string) {
  // Find the tab index
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  // Remove the tab from the DOM
  const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  tabElement?.remove();

  // Remove the sandbox container from the DOM
  const container = document.querySelector(`.main-container[data-tab-id="${tabId}"]`);
  container?.remove();

  // Dispose the editor
  tabs[tabIndex].editor.dispose();

  // Delete the tab from the database
  window.api.deleteTab(tabId).catch(error => {
    console.error('Error deleting tab from database:', error);
  });

  // Remove the tab from the tabs array
  tabs.splice(tabIndex, 1);

  // If this was the current tab, switch to another tab
  if (currentTabId === tabId) {
    if (tabs.length > 0) {
      switchToTab(tabs[0].id);
    } else {
      // If no tabs left, create a new one
      createNewTab();
    }
  }
}

// Load settings from the backend
async function loadSettings() {
  try {
    settings = await window.api.getSettings();
    console.log('Settings loaded:', settings);

    // Apply settings
    if (settings.theme) {
      // Update theme toggle buttons
      document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // If theme is 'auto', set the auto button as active and apply theme based on system preference
      if (settings.theme === 'auto') {
        const autoThemeBtn = document.querySelector('.theme-toggle-btn[data-theme="auto"]');
        if (autoThemeBtn) {
          autoThemeBtn.classList.add('active');
        }

        // Apply theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Apply to Monaco editor
        monaco.editor.setTheme(prefersDark ? 'vs-dark' : 'vs');

        // Apply to body
        document.body.classList.remove('dark-theme');
        if (prefersDark) {
          document.body.classList.add('dark-theme');
        }
      } else {
        // Otherwise, set the corresponding theme button as active
        const activeThemeBtn = document.querySelector(`.theme-toggle-btn[data-theme="${settings.theme}"]`);
        if (activeThemeBtn) {
          activeThemeBtn.classList.add('active');
        }

        // Apply theme
        monaco.editor.setTheme(settings.theme);

        // Apply to body
        document.body.classList.remove('dark-theme');
        if (settings.theme === 'vs-dark' || settings.theme === 'hc-black') {
          document.body.classList.add('dark-theme');
        }
      }
    }

    // Apply last used language if available
    if (settings.lastLanguage) {
      // Update language toggle buttons
      document.querySelectorAll('.language-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Set the corresponding language button as active
      const activeLanguageBtn = document.querySelector(`.language-toggle-btn[data-language="${settings.lastLanguage}"]`);
      if (activeLanguageBtn) {
        activeLanguageBtn.classList.add('active');
      }

      // Update version selector for the last used language
      updateVersionSelector(settings.lastLanguage);
    }

    // Populate TypeScript versions
    const tsVersionSelector = document.getElementById('ts-version-selector') as HTMLSelectElement;
    ['4.5.4', '4.6.4', '4.7.4', '4.8.4'].forEach(version => {
      const option = document.createElement('option');
      option.value = version;
      option.textContent = version;
      tsVersionSelector.appendChild(option);
    });

    // Populate Node.js versions (in a real app, these would be fetched from NVM)
    const nodeVersionSelector = document.getElementById('node-version') as HTMLSelectElement;
    ['14.17.0', '16.13.0', '18.12.1'].forEach(version => {
      const option = document.createElement('option');
      option.value = version;
      option.textContent = version;
      nodeVersionSelector.appendChild(option);
    });

    if (settings.nodeVersion && settings.nodeVersion !== 'system') {
      nodeVersionSelector.value = settings.nodeVersion;
    }

    // Populate Python versions (in a real app, these would be fetched from the system)
    const pythonVersionSelector = document.getElementById('python-version') as HTMLSelectElement;
    const pyVersionSelector = document.getElementById('py-version-selector') as HTMLSelectElement;

    ['3.8', '3.9', '3.10', '3.11'].forEach(version => {
      // Add to settings modal
      const option1 = document.createElement('option');
      option1.value = version;
      option1.textContent = version;
      pythonVersionSelector.appendChild(option1);

      // Add to toolbar version selector
      const option2 = document.createElement('option');
      option2.value = version;
      option2.textContent = version;
      pyVersionSelector.appendChild(option2);
    });

    if (settings.pythonVersion && settings.pythonVersion !== 'system') {
      pythonVersionSelector.value = settings.pythonVersion;
      pyVersionSelector.value = settings.pythonVersion;
    }

    // Set version selectors based on saved preferences
    if (settings.tsVersion) {
      tsVersionSelector.value = settings.tsVersion;
    }

    if (settings.pyVersion) {
      pyVersionSelector.value = settings.pyVersion;
    }

    // Initialize UI elements
    initializeUI();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Initialize UI elements
function initializeUI() {
  // Set initial active language toggle button
  if (currentTabId) {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab) {
      // Set active language button
      document.querySelectorAll('.language-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeLanguageBtn = document.querySelector(`.language-toggle-btn[data-language="${tab.language}"]`);
      if (activeLanguageBtn) {
        activeLanguageBtn.classList.add('active');
      }

      // Show appropriate version selector
      updateVersionSelector(tab.language);

      // Set active layout button
      document.querySelectorAll('.display-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeLayoutBtn = document.querySelector(`.display-toggle-btn[data-layout="${tab.layout}"]`);
      if (activeLayoutBtn) {
        activeLayoutBtn.classList.add('active');
      }
    }
  }
}


// Set up event listeners for UI components
function setupEventListeners() {
  // New tab button
  const newTabButton = document.getElementById('new-tab-button');
  newTabButton?.addEventListener('click', () => {
    createNewTab();
  });

  // Language toggle buttons
  const languageToggleButtons = document.querySelectorAll('.language-toggle-btn');
  languageToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!currentTabId) return;

      const tab = tabs.find(t => t.id === currentTabId);
      if (!tab) return;

      const currentCode = tab.editor.getValue();
      const oldLanguage = tab.language;
      const newLanguage = (button as HTMLElement).dataset.language || 'ts';

      // Don't do anything if the language is already selected
      if (oldLanguage === newLanguage) return;

      // Update the tab's language
      tab.language = newLanguage;

      // Update the active language toggle button
      document.querySelectorAll('.language-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Show/hide the appropriate version selector
      updateVersionSelector(newLanguage);

      // Check if the current code is the default code for the old language
      if (isDefaultCode(currentCode, oldLanguage)) {
        // Extract the tab title from the first line
        const firstLine = currentCode.split('\n')[0];
        const titleMatch = oldLanguage === 'py'
          ? firstLine.match(/#\s*Name:\s*(.*)/)
          : firstLine.match(/\/\/\s*Name:\s*(.*)/);

        const tabTitle = titleMatch ? titleMatch[1].trim() : tab.title;

        // Generate new default code for the new language with the same title
        const newCode = generateDefaultCode(newLanguage, tabTitle);

        // Update the editor content
        tab.editor.setValue(newCode);
      }

      // Update the editor language and run the code
      updateEditorLanguage();
      runCode();

      // Save the language setting
      saveLanguageSetting(newLanguage);
    });
  });

  // Version selectors
  const tsVersionSelector = document.getElementById('ts-version-selector') as HTMLSelectElement;
  const pyVersionSelector = document.getElementById('py-version-selector') as HTMLSelectElement;

  tsVersionSelector.addEventListener('change', () => {
    // Handle TypeScript version change
    console.log('TypeScript version changed to:', tsVersionSelector.value);
    // Save the TypeScript version setting
    saveLanguageVersionSetting('ts', tsVersionSelector.value);
  });

  pyVersionSelector.addEventListener('change', () => {
    // Handle Python version change
    console.log('Python version changed to:', pyVersionSelector.value);
    // Save the Python version setting
    saveLanguageVersionSetting('py', pyVersionSelector.value);
  });

  // Display toggle buttons
  const displayToggleButtons = document.querySelectorAll('.display-toggle-btn');
  displayToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!currentTabId) return;

      const tab = tabs.find(t => t.id === currentTabId);
      if (!tab) return;

      const layout = (button as HTMLElement).dataset.layout || 'horizontal';

      // Don't do anything if the layout is already selected
      if (tab.layout === layout) return;

      // Update the tab's layout
      tab.layout = layout;

      // Update the active display toggle button
      document.querySelectorAll('.display-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Update the layout
      updateLayout();
    });
  });

  // Theme toggle buttons
  const themeToggleButtons = document.querySelectorAll('.theme-toggle-btn');
  themeToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = (button as HTMLElement).dataset.theme || 'vs-dark';

      // Update the active theme toggle button
      document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Apply the theme to the entire application
      if (theme === 'auto') {
        // Auto theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Apply to Monaco editor
        monaco.editor.setTheme(prefersDark ? 'vs-dark' : 'vs');

        // Apply to body
        document.body.classList.remove('dark-theme');
        if (prefersDark) {
          document.body.classList.add('dark-theme');
        }
      } else {
        // Apply to Monaco editor
        monaco.editor.setTheme(theme);

        // Apply to body
        document.body.classList.remove('dark-theme');
        if (theme === 'vs-dark' || theme === 'hc-black') {
          document.body.classList.add('dark-theme');
        }
      }

      // Save the theme setting
      saveThemeSetting(theme);
    });
  });

  // Settings button removed as all settings are now in the top bar


  // Close buttons for modals
  const closeButtons = document.querySelectorAll('.close-button');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.settings-modal') as HTMLElement;
      modal.style.display = 'none';
    });
  });

  // Save settings button
  const saveSettingsButton = document.getElementById('save-settings');
  saveSettingsButton?.addEventListener('click', saveSettings);


  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    const settingsModal = document.querySelector('.settings-modal') as HTMLElement;

    if (event.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });
}

// Update the version selector based on the selected language
function updateVersionSelector(language: string) {
  const tsVersionSelector = document.getElementById('ts-version-selector') as HTMLSelectElement;
  const pyVersionSelector = document.getElementById('py-version-selector') as HTMLSelectElement;

  // Hide all version selectors
  tsVersionSelector.classList.remove('visible');
  pyVersionSelector.classList.remove('visible');

  // Show the appropriate version selector
  if (language === 'ts') {
    tsVersionSelector.classList.add('visible');
  } else if (language === 'py') {
    pyVersionSelector.classList.add('visible');
  }
}

// Update the editor language based on the current tab's language
function updateEditorLanguage() {
  if (!currentTabId) return;

  const tab = tabs.find(t => t.id === currentTabId);
  if (!tab) return;

  const model = tab.editor.getModel();
  if (!model) return;

  let editorLanguage = 'python';
  if (tab.language === 'ts') {
    editorLanguage = 'typescript';
  }

  monaco.editor.setModelLanguage(model, editorLanguage);
}

// Update the layout based on the current tab's layout
function updateLayout() {
  if (!currentTabId) return;

  const tab = tabs.find(t => t.id === currentTabId);
  if (!tab) return;

  const mainContainer = document.querySelector(`.main-container[data-tab-id="${currentTabId}"]`);
  if (!mainContainer) return;

  mainContainer.className = `main-container ${tab.layout}`;
}

// Run the code in the current tab's editor
async function runCode() {
  if (!currentTabId) return;

  const tab = tabs.find(t => t.id === currentTabId);
  if (!tab) return;

  const code = tab.editor.getValue();

  const resultsContainer = tab.resultsContainer;
  if (!resultsContainer) return;

  resultsContainer.innerHTML = 'Running...';

  try {
    const result = await window.api.runCode(code, tab.language);

    let output = '';

    // Check for missing packages
    if (result.missingPackages && result.missingPackages.length > 0) {
      // Create a tooltip to ask the user if they want to install the missing packages
      const packageList = result.missingPackages.join(', ');
      const packageType = tab.language === 'py' ? 'Python' : 'npm';

      output = `
        <div style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
          <p>Missing ${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'}: <strong>${packageList}</strong></p>
          <p>Would you like to install ${result.missingPackages.length > 1 ? 'them' : 'it'}?</p>
          <button id="install-packages-btn" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Install</button>
          <button id="skip-packages-btn" style="background-color: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Skip</button>
        </div>
      `;

      resultsContainer.innerHTML = output;

      // Add event listeners to the buttons
      document.getElementById('install-packages-btn')?.addEventListener('click', async () => {
        resultsContainer.innerHTML = `Installing ${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'}: ${packageList}...`;

        try {
          const installResult = await window.api.installPackages(result.missingPackages, tab.language);

          if (installResult.success) {
            resultsContainer.innerHTML = `${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'} installed successfully. Running code again...`;

            // Run the code again after installing the packages
            setTimeout(() => runCode(), 1000);
          } else {
            resultsContainer.innerHTML = `<span style="color: red;">Error installing ${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'}: ${installResult.error}</span>`;
          }
        } catch (error) {
          resultsContainer.innerHTML = `<span style="color: red;">Error installing ${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'}: ${error.message}</span>`;
        }
      });

      document.getElementById('skip-packages-btn')?.addEventListener('click', () => {
        resultsContainer.innerHTML = `<span style="color: orange;">Skipped installation of ${packageType} ${result.missingPackages.length > 1 ? 'packages' : 'package'}: ${packageList}</span>`;
      });

      return;
    }

    if (result.error) {
      output = `<span style="color: red;">Error: ${result.error}</span>`;
    } else {
      if (result.stdout) {
        output += `<span style="color: green;">Output:</span>\n${result.stdout}\n`;
      }

      if (result.stderr) {
        output += `<span style="color: red;">Error:</span>\n${result.stderr}\n`;
      }
    }

    resultsContainer.innerHTML = output || 'No output';
  } catch (error) {
    resultsContainer.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
  }
}

// Save settings to the backend
async function saveSettings() {
  // Get the active theme from the theme toggle buttons
  let theme = 'vs-dark'; // Default theme
  const activeThemeBtn = document.querySelector('.theme-toggle-btn.active') as HTMLElement;
  if (activeThemeBtn && activeThemeBtn.dataset.theme) {
    theme = activeThemeBtn.dataset.theme;
  }

  // Get the language version selectors
  const tsVersionSelector = document.getElementById('ts-version-selector') as HTMLSelectElement;
  const pyVersionSelector = document.getElementById('py-version-selector') as HTMLSelectElement;

  const newSettings = {
    theme: theme,
    tsVersion: tsVersionSelector.value,
    pyVersion: pyVersionSelector.value
  };

  try {
    await window.api.saveSettings(newSettings);

    // Apply the new theme to the entire application
    if (theme === 'auto') {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Apply to Monaco editor
      monaco.editor.setTheme(prefersDark ? 'vs-dark' : 'vs');

      // Apply to body
      document.body.classList.remove('dark-theme');
      if (prefersDark) {
        document.body.classList.add('dark-theme');
      }
    } else {
      // Apply to Monaco editor
      monaco.editor.setTheme(theme);

      // Apply to body
      document.body.classList.remove('dark-theme');
      if (theme === 'vs-dark' || theme === 'hc-black') {
        document.body.classList.add('dark-theme');
      }
    }

    console.log('Settings saved:', newSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}


// Save theme setting to the database
async function saveThemeSetting(theme: string) {
  try {
    // Save theme setting directly
    await window.api.setSetting('theme', theme);
    console.log('Theme setting saved:', theme);
  } catch (error) {
    console.error('Error saving theme setting:', error);
  }
}

// Save language setting to the database
async function saveLanguageSetting(language: string) {
  try {
    // Save language setting directly
    await window.api.setSetting('lastLanguage', language);
    console.log('Language setting saved:', language);
  } catch (error) {
    console.error('Error saving language setting:', error);
  }
}

// Save language version setting to the database
async function saveLanguageVersionSetting(language: string, version: string) {
  try {
    // Save language version setting directly
    if (language === 'ts') {
      await window.api.setSetting('tsVersion', version);
    } else if (language === 'py') {
      await window.api.setSetting('pyVersion', version);
    } else if (language === 'node') {
      await window.api.setSetting('nodeVersion', version);
    } else if (language === 'python') {
      await window.api.setSetting('pythonVersion', version);
    }

    console.log(`${language} version setting saved:`, version);
  } catch (error) {
    console.error(`Error saving ${language} version setting:`, error);
  }
}
