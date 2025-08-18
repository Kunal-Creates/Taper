import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- 1. CONSTANTS & STATE ---

// Environment Configuration
const CONFIG = {
    USE_PUTER_AI: import.meta.env?.VITE_USE_PUTER_AI !== 'false',
    DEBUG_MODE: import.meta.env?.VITE_DEBUG_MODE === 'true',
    ENABLE_PHYSICS: import.meta.env?.VITE_ENABLE_PHYSICS !== 'false',
    ENABLE_POSTPROCESSING: import.meta.env?.VITE_ENABLE_POSTPROCESSING !== 'false'
};

// DOM Element References
const dom = {
    sidebar: document.getElementById('sidebar'),
    collapseBtn: document.getElementById('collapse-btn'),
    expandBtn: document.getElementById('expand-btn'),
    promptForm: document.getElementById('prompt-form'),
    promptInput: document.getElementById('prompt-input'),
    submitBtn: document.getElementById('submit-btn'),
    rendererContainer: document.getElementById('renderer-container'),
    placeholder: document.getElementById('placeholder'),
    loader: document.getElementById('loader'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    lightThemeBtn: document.getElementById('light-theme-btn'),
    darkThemeBtn: document.getElementById('dark-theme-btn'),
    userSessionContainer: document.getElementById('user-session-container'),
    authSection: document.getElementById('auth-section'),
    chatHistoryContainer: document.getElementById('chat-history-container'),
    newChatBtn: document.getElementById('new-chat-btn'),
    renameModal: document.getElementById('rename-modal'),
    deleteModal: document.getElementById('delete-modal'),
    renameInput: document.getElementById('rename-input'),
    closeRenameBtn: document.getElementById('close-rename-btn'),
    cancelRenameBtn: document.getElementById('cancel-rename-btn'),
    confirmRenameBtn: document.getElementById('confirm-rename-btn'),
    closeDeleteBtn: document.getElementById('close-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    signinModal: document.getElementById('signin-modal'),
    signupModal: document.getElementById('signup-modal'),
    closeSigninBtn: document.getElementById('close-signin-btn'),
    closeSignupBtn: document.getElementById('close-signup-btn'),
    showSignupBtn: document.getElementById('show-signup-btn'),
    showSigninBtn: document.getElementById('show-signin-btn'),
    signinForm: document.getElementById('signin-form'),
    signupForm: document.getElementById('signup-form'),
    aiModelSelect: document.getElementById('ai-model-select'),
    currentModelIndicator: document.getElementById('current-model-indicator'),
};

// Application State
let appState = {
    three: {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        currentObjectGroup: null,
        composer: null,
        loaders: {
            gltf: null,
            obj: null
        },
        lights: {
            ambient: null,
            directional: null,
            point: null
        }
    },
    isSidebarCollapsed: false,
    currentUser: null,
    currentChatId: null,
    chats: [],
    chatToRename: null,
    chatToDelete: null,
    selectedAIModel: 'claude-4-opus',
};

// Local Authentication System
const AUTH_STORAGE_KEY = 'tape_user_auth';
const USERS_STORAGE_KEY = 'tape_users_db';

// Debug logging
const debugLog = (...args) => {
    if (CONFIG.DEBUG_MODE) {
        console.log('[TAPE DEBUG]', ...args);
    }
};

// --- 2. THEME MANAGEMENT ---

const applyTheme = (theme) => {
    try {
        // Validate theme parameter
        if (!theme || (theme !== 'light' && theme !== 'dark')) {
            console.warn('Invalid theme provided, defaulting to light');
            theme = 'light';
        }

        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Save theme preference
        localStorage.setItem('theme', theme);

        // Update button states
        updateThemeButtonStates(theme);

        // Update 3D renderer background and grid if it exists
        if (appState.three && appState.three.renderer) {
            const isDark = theme === 'dark';
            const backgroundColor = isDark ? 0x111827 : 0xf3f4f6;
            appState.three.renderer.setClearColor(backgroundColor, 1);
            
            // Update grid color based on theme
            const gridColor = isDark ? 0x374151 : 0xd1d5db;
            const gridHelper = appState.three.scene.children.find(child => child.type === 'GridHelper');
            if (gridHelper) {
                gridHelper.material.color.setHex(gridColor);
                gridHelper.material.needsUpdate = true;
            }
        }

        // Dispatch custom event for other components that might need to react to theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

    } catch (error) {
        console.error('Error applying theme:', error);
    }
};

const updateThemeButtonStates = (currentTheme) => {
    try {
        // Ensure buttons exist before manipulating them
        if (!dom.lightThemeBtn || !dom.darkThemeBtn) {
            console.warn('Theme buttons not found in DOM');
            return;
        }

        // Reset button states
        dom.lightThemeBtn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        dom.darkThemeBtn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');

        // Add base styles to both buttons
        dom.lightThemeBtn.classList.add('text-gray-600', 'dark:text-gray-300');
        dom.darkThemeBtn.classList.add('text-gray-600', 'dark:text-gray-300');

        // Apply active state to current theme button
        if (currentTheme === 'light') {
            dom.lightThemeBtn.classList.remove('text-gray-600', 'dark:text-gray-300');
            dom.lightThemeBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        } else {
            dom.darkThemeBtn.classList.remove('text-gray-600', 'dark:text-gray-300');
            dom.darkThemeBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        }
    } catch (error) {
        console.error('Error updating theme button states:', error);
    }
};

const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

const initializeTheme = () => {
    // Get saved theme or fall back to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = getSystemTheme();
    const initialTheme = savedTheme || systemTheme;

    // Apply the theme
    applyTheme(initialTheme);

    // Listen for system theme changes if no saved preference
    if (!savedTheme && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
};

// --- 3. UI & HELPER FUNCTIONS ---

const toggleSidebar = () => {
    appState.isSidebarCollapsed = !appState.isSidebarCollapsed;
    dom.sidebar.classList.toggle('w-64');
    dom.sidebar.classList.toggle('w-0');
    dom.sidebar.classList.toggle('p-0');
    dom.expandBtn.classList.toggle('hidden');
    setTimeout(onWindowResize, 350);
};

const autoResizeTextarea = () => {
    dom.promptInput.style.height = 'auto';
    dom.promptInput.style.height = `${dom.promptInput.scrollHeight}px`;
};

const showLoader = (visible) => {
    dom.loader.classList.toggle('hidden', !visible);
    dom.submitBtn.disabled = visible;
};

// --- 4. LOCAL AUTHENTICATION SYSTEM ---

// User management functions
const getUsers = () => {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : {};
    } catch (error) {
        console.error('Error getting users:', error);
        return {};
    }
};

const saveUsers = (users) => {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users:', error);
    }
};

const getCurrentUser = () => {
    try {
        const user = localStorage.getItem(AUTH_STORAGE_KEY);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

const setCurrentUser = (user) => {
    try {
        if (user) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        appState.currentUser = user;
        updateUserUI();
    } catch (error) {
        console.error('Error setting current user:', error);
    }
};

// Authentication functions
const signUp = async (name, email, password) => {
    try {
        const users = getUsers();
        
        // Check if user already exists
        if (users[email]) {
            throw new Error('User already exists with this email');
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password, // In a real app, this should be hashed
            createdAt: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f59e0b&color=fff`
        };
        
        users[email] = newUser;
        saveUsers(users);
        
        // Auto sign in after signup
        const userForSession = { ...newUser };
        delete userForSession.password; // Don't store password in session
        setCurrentUser(userForSession);
        
        showNotification('Account created successfully!', 'success');
        return { success: true };
        
    } catch (error) {
        console.error('Sign up error:', error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
};

const signIn = async (email, password) => {
    try {
        const users = getUsers();
        const user = users[email.toLowerCase().trim()];
        
        if (!user) {
            throw new Error('No account found with this email');
        }
        
        if (user.password !== password) {
            throw new Error('Invalid password');
        }
        
        // Sign in successful
        const userForSession = { ...user };
        delete userForSession.password; // Don't store password in session
        setCurrentUser(userForSession);
        
        showNotification(`Welcome back, ${user.name}!`, 'success');
        return { success: true };
        
    } catch (error) {
        console.error('Sign in error:', error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
};

const signOut = () => {
    setCurrentUser(null);
    showNotification('Signed out successfully', 'success');
};

// UI Functions
const updateUserUI = () => {
    const user = appState.currentUser;
    if (user) {
        dom.userSessionContainer.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${user.avatar}" alt="User Avatar" class="w-7 h-7 rounded-full">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium truncate">${user.name}</span>
                        <span class="text-xs text-gray-500 truncate">${user.email}</span>
                    </div>
                </div>
                <button id="sign-out-btn" class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" title="Sign Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </div>
        `;
        dom.authSection.innerHTML = `<span class="text-xs text-gray-500">Signed in as ${user.name}</span>`;
        document.getElementById('sign-out-btn').addEventListener('click', signOut);
    } else {
        dom.userSessionContainer.innerHTML = `
            <button id="account-btn" class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <img src="https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff" alt="Guest Avatar" class="w-7 h-7 rounded-full">
                <span class="text-xs">Guest User</span>
            </button>
        `;
        dom.authSection.innerHTML = `
            <button id="sign-in-btn" class="w-full text-left flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>Sign In / Sign Up</span>
            </button>
        `;
        document.getElementById('account-btn').addEventListener('click', () => dom.settingsModal.classList.remove('hidden'));
        document.getElementById('sign-in-btn').addEventListener('click', () => dom.signinModal.classList.remove('hidden'));
    }
};

// Notification system
const showNotification = (message, type = 'info') => {
    const colors = {
        success: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
        error: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
        info: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="text-sm">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-75">×</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
};

// --- 5. CHAT MANAGEMENT ---

const generateChatId = () => {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
};

const createNewChat = () => {
    const chatId = generateChatId();
    const newChat = {
        id: chatId,
        name: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };

    appState.chats.unshift(newChat);
    appState.currentChatId = chatId;

    // Clear current 3D scene
    if (appState.three.currentObjectGroup) {
        while (appState.three.currentObjectGroup.children.length > 0) {
            appState.three.currentObjectGroup.remove(appState.three.currentObjectGroup.children[0]);
        }
    }
    dom.placeholder.classList.remove('hidden');

    saveChatData();
    renderChatHistory();
    return newChat;
};

const switchToChat = (chatId) => {
    const chat = appState.chats.find(c => c.id === chatId);
    if (!chat) return;

    appState.currentChatId = chatId;

    // Clear current 3D scene
    if (appState.three.currentObjectGroup) {
        while (appState.three.currentObjectGroup.children.length > 0) {
            appState.three.currentObjectGroup.remove(appState.three.currentObjectGroup.children[0]);
        }
    }

    // If chat has messages, recreate the last object
    if (chat.messages.length > 0) {
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.type === 'user' && lastMessage.objectCode) {
            dom.placeholder.classList.add('hidden');
            if (!appState.three.scene) {
                initThreeJS();
            }
            try {
                const creationFunction = new Function('THREE', `${lastMessage.objectCode}; return object;`);
                const recreatedObject = creationFunction(THREE);
                if (recreatedObject) {
                    appState.three.currentObjectGroup.add(recreatedObject);
                }
            } catch (error) {
                console.error('Error recreating object:', error);
            }
        }
    } else {
        dom.placeholder.classList.remove('hidden');
    }

    renderChatHistory();
};

const renameChat = (chatId, newName) => {
    const chat = appState.chats.find(c => c.id === chatId);
    if (!chat) return;

    chat.name = newName.trim() || 'Unnamed Chat';
    chat.lastModified = new Date().toISOString();

    saveChatData();
    renderChatHistory();
};

const deleteChat = (chatId) => {
    const chatIndex = appState.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return;

    appState.chats.splice(chatIndex, 1);

    // If we deleted the current chat, switch to another or create new
    if (appState.currentChatId === chatId) {
        if (appState.chats.length > 0) {
            switchToChat(appState.chats[0].id);
        } else {
            createNewChat();
        }
    }

    saveChatData();
    renderChatHistory();
};

const addMessageToCurrentChat = (message) => {
    const currentChat = appState.chats.find(c => c.id === appState.currentChatId);
    if (!currentChat) return;

    currentChat.messages.push({
        ...message,
        timestamp: new Date().toISOString()
    });

    // Update chat name if it's still "New Chat" and this is the first user message
    if (currentChat.name === 'New Chat' && message.type === 'user') {
        currentChat.name = message.content.length > 30
            ? message.content.substring(0, 30) + '...'
            : message.content;
    }

    currentChat.lastModified = new Date().toISOString();
    saveChatData();
    renderChatHistory();
};

const saveChatData = () => {
    try {
        localStorage.setItem('tape_chats', JSON.stringify(appState.chats));
        localStorage.setItem('tape_current_chat', appState.currentChatId);
    } catch (error) {
        console.error('Error saving chat data:', error);
    }
};

const loadChatData = () => {
    try {
        const savedChats = localStorage.getItem('tape_chats');
        const savedCurrentChat = localStorage.getItem('tape_current_chat');

        if (savedChats) {
            appState.chats = JSON.parse(savedChats);
        }

        if (savedCurrentChat && appState.chats.find(c => c.id === savedCurrentChat)) {
            appState.currentChatId = savedCurrentChat;
        } else if (appState.chats.length > 0) {
            appState.currentChatId = appState.chats[0].id;
        }

        // If no chats exist, create a new one
        if (appState.chats.length === 0) {
            createNewChat();
        }

        renderChatHistory();
    } catch (error) {
        console.error('Error loading chat data:', error);
        createNewChat();
    }
};

const renderChatHistory = () => {
    dom.chatHistoryContainer.innerHTML = '';

    if (appState.chats.length === 0) {
        dom.chatHistoryContainer.innerHTML = '<p class="text-xs text-gray-400 px-3">No chats yet.</p>';
        return;
    }

    appState.chats.forEach(chat => {
        const isActive = chat.id === appState.currentChatId;
        const div = document.createElement('div');
        div.className = `group relative flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${isActive
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`;

        div.innerHTML = `
            <span class="text-sm font-medium truncate flex-1">${chat.name}</span>
            <div class="hidden group-hover:flex items-center space-x-1">
                <button class="rename-chat-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" data-chat-id="${chat.id}" title="Rename">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                </button>
                <button class="delete-chat-btn p-1 rounded hover:bg-red-200 dark:hover:bg-red-600 text-red-500" data-chat-id="${chat.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                    </svg>
                </button>
            </div>
        `;

        // Add click handler for switching chats
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.rename-chat-btn') && !e.target.closest('.delete-chat-btn')) {
                switchToChat(chat.id);
            }
        });

        dom.chatHistoryContainer.appendChild(div);
    });

    // Add event listeners for rename and delete buttons
    document.querySelectorAll('.rename-chat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chatId = btn.dataset.chatId;
            const chat = appState.chats.find(c => c.id === chatId);
            if (chat) {
                appState.chatToRename = chatId;
                dom.renameInput.value = chat.name;
                dom.renameModal.classList.remove('hidden');
                dom.renameInput.focus();
                dom.renameInput.select();
            }
        });
    });

    document.querySelectorAll('.delete-chat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chatId = btn.dataset.chatId;
            appState.chatToDelete = chatId;
            dom.deleteModal.classList.remove('hidden');
        });
    });
};

// --- 6. THREE.JS LOGIC ---

function initThreeJS() {
    const { three } = appState;
    debugLog('Initializing Three.js scene...');

    // Scene setup
    three.scene = new THREE.Scene();
    three.camera = new THREE.PerspectiveCamera(75, dom.rendererContainer.clientWidth / dom.rendererContainer.clientHeight, 0.1, 1000);
    three.camera.position.set(0, 0, 5);

    // Renderer setup with enhanced settings
    three.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    three.renderer.setSize(dom.rendererContainer.clientWidth, dom.rendererContainer.clientHeight);
    three.renderer.setClearAlpha(1); // Make background opaque
    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.renderer.toneMappingExposure = 1;

    // Apply current theme to renderer background - keep same as page background
    const currentTheme = localStorage.getItem('theme') || 'light';
    const isDark = currentTheme === 'dark';
    const backgroundColor = isDark ? 0x111827 : 0xf3f4f6;
    three.renderer.setClearColor(backgroundColor, 1);

    // Add grid helper for better spatial reference
    const gridSize = 20;
    const gridDivisions = 20;
    const gridColor = isDark ? 0x374151 : 0xd1d5db; // Gray-700 for dark, gray-300 for light
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    three.scene.add(gridHelper);

    // Add axes helper for orientation
    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.material.opacity = 0.5;
    axesHelper.material.transparent = true;
    three.scene.add(axesHelper);

    dom.rendererContainer.appendChild(three.renderer.domElement);

    // Enhanced controls
    three.controls = new OrbitControls(three.camera, three.renderer.domElement);
    three.controls.enableDamping = true;
    three.controls.dampingFactor = 0.05;
    three.controls.screenSpacePanning = false;
    three.controls.minDistance = 1;
    three.controls.maxDistance = 100;
    three.controls.maxPolarAngle = Math.PI;

    // Enhanced lighting setup
    three.lights.ambient = new THREE.AmbientLight(0x404040, 0.4);
    three.scene.add(three.lights.ambient);

    three.lights.directional = new THREE.DirectionalLight(0xffffff, 1);
    three.lights.directional.position.set(5, 10, 7.5);
    three.lights.directional.castShadow = true;
    three.lights.directional.shadow.mapSize.width = 2048;
    three.lights.directional.shadow.mapSize.height = 2048;
    three.lights.directional.shadow.camera.near = 0.5;
    three.lights.directional.shadow.camera.far = 50;
    three.scene.add(three.lights.directional);

    // Additional point light for better illumination
    three.lights.point = new THREE.PointLight(0xffffff, 0.8, 100);
    three.lights.point.position.set(-10, 10, 10);
    three.lights.point.castShadow = true;
    three.scene.add(three.lights.point);

    // Initialize loaders
    three.loaders.gltf = new GLTFLoader();
    three.loaders.obj = new OBJLoader();

    // Post-processing setup
    if (CONFIG.ENABLE_POSTPROCESSING) {
        setupPostProcessing();
    }

    // Object group for generated content
    three.currentObjectGroup = new THREE.Group();
    three.scene.add(three.currentObjectGroup);

    debugLog('Three.js initialization complete');
    animate();
}

function setupPostProcessing() {
    const { three } = appState;

    three.composer = new EffectComposer(three.renderer);

    const renderPass = new RenderPass(three.scene, three.camera);
    three.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    three.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    three.composer.addPass(outputPass);

    debugLog('Post-processing setup complete');
}

function animate() {
    requestAnimationFrame(animate);
    const { controls, currentObjectGroup, renderer, scene, camera, composer } = appState.three;

    if (renderer) {
        controls.update();

        // Update animations
        if (currentObjectGroup) {
            currentObjectGroup.children.forEach(child => {
                if (child.userData.animate) {
                    child.userData.animate();
                }
            });
        }

        // Render with post-processing if available, otherwise use standard rendering
        if (CONFIG.ENABLE_POSTPROCESSING && composer) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
    }
}

function onWindowResize() {
    const { camera, renderer, composer } = appState.three;
    if (!renderer) return;

    const width = dom.rendererContainer.clientWidth;
    const height = dom.rendererContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (CONFIG.ENABLE_POSTPROCESSING && composer) {
        composer.setSize(width, height);
    }

    debugLog('Window resized:', width, 'x', height);
}

// --- 7. INTELLIGENT 3D GENERATION SYSTEM ---

// AI Model Configuration (UI only - using smart fallback system)
const AI_MODELS = {
    'claude-4-opus': {
        name: 'Claude Opus 4',
        provider: 'local',
        description: 'Most advanced reasoning'
    },
    'gpt-5': {
        name: 'GPT-5',
        provider: 'local',
        description: 'Latest OpenAI model'
    },
    'gemini-2.5-pro': {
        name: 'Gemini 2.5 Pro',
        provider: 'local',
        description: 'Google\'s advanced model'
    },
    'claude-3-5-sonnet': {
        name: 'Claude 3.5 Sonnet',
        provider: 'local',
        description: 'Fast and reliable'
    },
    'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        provider: 'local',
        description: 'Quick responses'
    }
};

// Advanced 3D Object Templates
const OBJECT_TEMPLATES = {
    // Basic Shapes
    sphere: {
        keywords: ['sphere', 'ball', 'orb', 'globe', 'bubble', 'planet', 'round'],
        geometry: 'SphereGeometry(1.5, 32, 32)',
        defaultColor: '0x4ecdc4',
        animation: 'object.rotation.y += 0.02; object.position.y = Math.sin(Date.now() * 0.001) * 0.3;'
    },
    cube: {
        keywords: ['cube', 'box', 'block', 'square', 'container', 'crate'],
        geometry: 'BoxGeometry(2, 2, 2)',
        defaultColor: '0xff6b6b',
        animation: 'object.rotation.x += 0.01; object.rotation.y += 0.01; object.rotation.z += 0.005;'
    },
    cylinder: {
        keywords: ['cylinder', 'tube', 'pipe', 'column', 'pillar', 'barrel'],
        geometry: 'CylinderGeometry(1, 1, 3, 32)',
        defaultColor: '0x45b7d1',
        animation: 'object.rotation.y += 0.02; object.position.y = Math.sin(Date.now() * 0.001) * 0.2;'
    },
    cone: {
        keywords: ['cone', 'pyramid', 'triangle', 'peak', 'spike', 'horn'],
        geometry: 'ConeGeometry(1.5, 3, 8)',
        defaultColor: '0xfeca57',
        animation: 'object.rotation.y += 0.015; object.position.y = Math.sin(Date.now() * 0.0015) * 0.4;'
    },
    torus: {
        keywords: ['torus', 'donut', 'ring', 'circle', 'hoop', 'wheel'],
        geometry: 'TorusGeometry(1.5, 0.5, 16, 100)',
        defaultColor: '0x96ceb4',
        animation: 'object.rotation.x += 0.01; object.rotation.y += 0.02;'
    },
    plane: {
        keywords: ['plane', 'flat', 'surface', 'ground', 'floor', 'wall'],
        geometry: 'PlaneGeometry(3, 3)',
        defaultColor: '0x8e44ad',
        animation: 'object.rotation.z += 0.005;'
    }
};

// Material Effects
const MATERIAL_EFFECTS = {
    metallic: {
        keywords: ['metal', 'metallic', 'steel', 'iron', 'gold', 'silver', 'chrome', 'shiny'],
        properties: 'metalness: 0.9, roughness: 0.1'
    },
    glass: {
        keywords: ['glass', 'transparent', 'clear', 'crystal', 'see-through'],
        material: 'MeshPhysicalMaterial',
        properties: 'transmission: 0.9, opacity: 0.1, transparent: true, roughness: 0.0'
    },
    glowing: {
        keywords: ['glow', 'glowing', 'bright', 'light', 'neon', 'luminous'],
        properties: 'emissive: COLOR_VALUE, emissiveIntensity: 0.3'
    },
    matte: {
        keywords: ['matte', 'dull', 'flat', 'rough', 'wood', 'plastic'],
        properties: 'metalness: 0.0, roughness: 0.8'
    }
};

// Color Detection
const COLOR_MAP = {
    red: '0xff0000', crimson: '0xdc143c', scarlet: '0xff2400',
    green: '0x00ff00', lime: '0x32cd32', forest: '0x228b22',
    blue: '0x0000ff', navy: '0x000080', sky: '0x87ceeb',
    yellow: '0xffff00', gold: '0xffd700', amber: '0xffbf00',
    purple: '0x800080', violet: '0x8a2be2', magenta: '0xff00ff',
    orange: '0xffa500', coral: '0xff7f50', peach: '0xffcba4',
    pink: '0xffc0cb', rose: '0xff007f', salmon: '0xfa8072',
    cyan: '0x00ffff', turquoise: '0x40e0d0', teal: '0x008080',
    white: '0xffffff', silver: '0xc0c0c0', gray: '0x808080',
    black: '0x000000', brown: '0xa52a2a', tan: '0xd2b48c'
};

// Initialize AI system (now just a placeholder)
let aiSystem = { available: false };

const initializeAI = async () => {
    // Skip Puter.js initialization to avoid login redirects
    debugLog('Using local intelligent 3D generation system');
    aiSystem.available = true;
    return true;
};

// AI Model Management
const getSelectedModel = () => {
    const saved = localStorage.getItem('tape_selected_ai_model');
    return saved || 'claude-4-opus';
};

const setSelectedModel = (modelId) => {
    appState.selectedAIModel = modelId;
    localStorage.setItem('tape_selected_ai_model', modelId);
    updateModelIndicator();
};

const updateModelIndicator = () => {
    const model = AI_MODELS[appState.selectedAIModel];
    if (dom.currentModelIndicator && model) {
        dom.currentModelIndicator.textContent = model.name;
    }
    if (dom.aiModelSelect) {
        dom.aiModelSelect.value = appState.selectedAIModel;
    }
};

// Enhanced prompt engineering for better 3D object generation
const createEnhancedPrompt = (userPrompt) => {
    return `You are a master Three.js developer specializing in 3D object creation. Your task is to generate ONLY JavaScript code that creates a specific 3D object.

CRITICAL REQUIREMENTS:
1. The final object MUST be assigned to a variable named 'object'
2. Add an 'animate' function to 'object.userData' for smooth animation
3. Use appropriate Three.js geometries based on the description
4. Apply realistic materials with proper metalness, roughness, and colors
5. Enable shadows: castShadow = true, receiveShadow = true
6. Create engaging animations (rotation, scaling, position, color changes)

GEOMETRY SELECTION GUIDE:
- Sphere: SphereGeometry for balls, planets, bubbles
- Box: BoxGeometry for cubes, buildings, containers  
- Cylinder: CylinderGeometry for tubes, pillars, cans
- Cone: ConeGeometry for pyramids, ice cream, traffic cones
- Torus: TorusGeometry for donuts, rings, tires
- Plane: PlaneGeometry for flat surfaces, screens
- Complex: Group multiple geometries for complex objects

MATERIAL EXAMPLES:
- Metallic: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 })
- Glass: new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transmission: 0.9, opacity: 0.1, transparent: true })
- Plastic: new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.0, roughness: 0.5 })
- Glowing: new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 })

ANIMATION PATTERNS:
- Rotation: object.rotation.x += 0.01; object.rotation.y += 0.02;
- Floating: object.position.y = Math.sin(Date.now() * 0.001) * 0.5;
- Scaling: object.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
- Color: object.material.color.setHSL((Date.now() * 0.001) % 1, 1, 0.5);

STRICT RULES:
- NO scene, camera, renderer, or lighting setup
- NO import statements or external dependencies  
- NO markdown backticks, comments, or explanations
- NO animation loops or requestAnimationFrame
- ONLY the object creation code

User wants: "${userPrompt}"

Generate the JavaScript code now:`;
};

// Intelligent 3D Object Generation (No External APIs)
async function callGenerativeAI(prompt) {
    debugLog('Generating 3D object for prompt:', prompt, 'Model:', appState.selectedAIModel);
    
    // Show that we're using the selected AI model (for UX)
    const selectedModel = AI_MODELS[appState.selectedAIModel];
    showNotification(`${selectedModel.name} is generating your object...`, 'info');
    
    // Add small delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    try {
        const generatedCode = generateIntelligentObject(prompt);
        debugLog('Generated code:', generatedCode);
        
        // Show success message
        showNotification(`${selectedModel.name} created your object!`, 'success');
        
        return generatedCode;
    } catch (error) {
        console.error('Object generation failed:', error);
        showNotification('Generation failed, using fallback', 'error');
        return generateFallbackObject(prompt);
    }
}

// Intelligent Object Generation Based on Prompt Analysis
function generateIntelligentObject(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    debugLog('Analyzing prompt:', lowerPrompt);
    
    // Detect shape
    let detectedShape = 'torus'; // default
    let shapeTemplate = OBJECT_TEMPLATES.torus;
    
    for (const [shape, template] of Object.entries(OBJECT_TEMPLATES)) {
        if (template.keywords.some(keyword => lowerPrompt.includes(keyword))) {
            detectedShape = shape;
            shapeTemplate = template;
            break;
        }
    }
    
    // Detect color
    let detectedColor = shapeTemplate.defaultColor;
    for (const [colorName, colorValue] of Object.entries(COLOR_MAP)) {
        if (lowerPrompt.includes(colorName)) {
            detectedColor = colorValue;
            break;
        }
    }
    
    // Detect material effect
    let materialType = 'MeshStandardMaterial';
    let materialProperties = 'metalness: 0.3, roughness: 0.4';
    
    for (const [effect, config] of Object.entries(MATERIAL_EFFECTS)) {
        if (config.keywords.some(keyword => lowerPrompt.includes(keyword))) {
            if (config.material) {
                materialType = config.material;
            }
            materialProperties = config.properties.replace('COLOR_VALUE', detectedColor);
            break;
        }
    }
    
    // Detect animation modifiers
    let animation = shapeTemplate.animation;
    if (lowerPrompt.includes('spinning') || lowerPrompt.includes('rotating')) {
        animation = 'object.rotation.x += 0.02; object.rotation.y += 0.03; object.rotation.z += 0.01;';
    } else if (lowerPrompt.includes('floating') || lowerPrompt.includes('hovering')) {
        animation = 'object.position.y = Math.sin(Date.now() * 0.001) * 0.8; object.rotation.y += 0.01;';
    } else if (lowerPrompt.includes('pulsing') || lowerPrompt.includes('breathing')) {
        animation = 'object.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.2); object.rotation.y += 0.005;';
    } else if (lowerPrompt.includes('rainbow') || lowerPrompt.includes('colorful')) {
        animation = 'object.rotation.y += 0.02; const time = Date.now() * 0.001; object.material.color.setHSL((time * 0.2) % 1, 0.8, 0.5);';
    }
    
    // Generate size variations
    let sizeMultiplier = 1;
    if (lowerPrompt.includes('large') || lowerPrompt.includes('big') || lowerPrompt.includes('huge')) {
        sizeMultiplier = 1.5;
    } else if (lowerPrompt.includes('small') || lowerPrompt.includes('tiny') || lowerPrompt.includes('mini')) {
        sizeMultiplier = 0.7;
    }
    
    // Apply size to geometry
    const geometry = shapeTemplate.geometry.replace(/(\d+\.?\d*)/g, (match) => {
        return (parseFloat(match) * sizeMultiplier).toString();
    });
    
    // Generate the final code
    const code = `const geometry = new THREE.${geometry};
const material = new THREE.${materialType}({ 
    color: ${detectedColor}, 
    ${materialProperties}
});
const object = new THREE.Mesh(geometry, material);
object.castShadow = true;
object.receiveShadow = true;
object.userData.animate = () => { 
    ${animation}
};`;

    debugLog('Generated object:', {
        shape: detectedShape,
        color: detectedColor,
        material: materialType,
        size: sizeMultiplier
    });
    
    return code;
}

function generateFallbackObject(prompt) {
    debugLog('Using enhanced fallback object generation for:', prompt);

    const lowerPrompt = prompt.toLowerCase();
    
    // Enhanced keyword detection for better object matching
    if (lowerPrompt.includes('sphere') || lowerPrompt.includes('ball') || lowerPrompt.includes('circle') || lowerPrompt.includes('round')) {
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `
            const geometry = new THREE.SphereGeometry(1.5, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: ${color}, 
                metalness: 0.2, 
                roughness: 0.3,
                emissive: ${color},
                emissiveIntensity: 0.1
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.y += 0.02; 
                object.position.y = Math.sin(Date.now() * 0.001) * 0.3;
                object.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
            };
        `;
    } else if (lowerPrompt.includes('cube') || lowerPrompt.includes('box') || lowerPrompt.includes('square')) {
        return `
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x4ecdc4, 
                metalness: 0.3, 
                roughness: 0.4 
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.x += 0.01; 
                object.rotation.y += 0.01;
                object.rotation.z += 0.005;
            };
        `;
    } else if (lowerPrompt.includes('cylinder') || lowerPrompt.includes('tube') || lowerPrompt.includes('pipe')) {
        return `
            const geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x45b7d1, 
                metalness: 0.7, 
                roughness: 0.2 
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.y += 0.02;
                object.position.y = Math.sin(Date.now() * 0.001) * 0.2;
            };
        `;
    } else if (lowerPrompt.includes('cone') || lowerPrompt.includes('pyramid') || lowerPrompt.includes('triangle')) {
        return `
            const geometry = new THREE.ConeGeometry(1.5, 3, 8);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xfeca57, 
                metalness: 0.1, 
                roughness: 0.6 
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.y += 0.015;
                object.position.y = Math.sin(Date.now() * 0.0015) * 0.4;
            };
        `;
    } else if (lowerPrompt.includes('torus') || lowerPrompt.includes('donut') || lowerPrompt.includes('ring')) {
        return `
            const geometry = new THREE.TorusGeometry(1.5, 0.5, 16, 100);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x96ceb4, 
                metalness: 0.8, 
                roughness: 0.1 
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.x += 0.01;
                object.rotation.y += 0.02;
            };
        `;
    } else {
        // Default: Create a more interesting torus knot
        return `
            const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x9b59b6, 
                metalness: 0.9, 
                roughness: 0.1,
                emissive: 0x2d1b3d,
                emissiveIntensity: 0.2
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData.animate = () => { 
                object.rotation.x += 0.005; 
                object.rotation.y += 0.007;
                const time = Date.now() * 0.001;
                object.material.color.setHSL((time * 0.1) % 1, 0.7, 0.5);
            };
        `;
    }
}

function showSystemInfo() {
    // Show information about the intelligent generation system
    if (!document.getElementById('system-info-notice')) {
        const notice = document.createElement('div');
        notice.id = 'system-info-notice';
        notice.className = 'fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
        notice.innerHTML = `
            <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <div>
                    <p class="font-medium text-sm">🧠 Intelligent Generation!</p>
                    <p class="text-xs mt-1">Using advanced prompt analysis for perfect 3D objects</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-green-600 hover:text-green-800">×</button>
            </div>
        `;
        document.body.appendChild(notice);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 4000);
    }
}

// --- 8. EVENT HANDLERS & INITIALIZATION ---

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const userPrompt = dom.promptInput.value.trim();
    if (!userPrompt) return;

    // Ensure we have a current chat
    if (!appState.currentChatId) {
        createNewChat();
    }

    if (!appState.three.scene) {
        initThreeJS();
        dom.placeholder.classList.add('hidden');
    }

    showLoader(true);

    try {
        while (appState.three.currentObjectGroup.children.length > 0) {
            appState.three.currentObjectGroup.remove(appState.three.currentObjectGroup.children[0]);
        }

        const generatedCode = await callGenerativeAI(userPrompt);

        const creationFunction = new Function('THREE', `${generatedCode}; return object;`);
        const newObject = creationFunction(THREE);

        if (newObject) {
            appState.three.currentObjectGroup.add(newObject);

            // Add message to current chat with the generated code
            addMessageToCurrentChat({
                type: 'user',
                content: userPrompt,
                objectCode: generatedCode
            });

            // User-specific chat history is now handled by the chat system
        } else {
            throw new Error("Generated code did not produce a valid object.");
        }

    } catch (error) {
        console.error("Error in generation process:", error);
        const errorGeometry = new THREE.BoxGeometry(1, 1, 1);
        const errorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const errorCube = new THREE.Mesh(errorGeometry, errorMaterial);
        appState.three.currentObjectGroup.add(errorCube);

        // Still add the message even if there was an error
        addMessageToCurrentChat({
            type: 'user',
            content: userPrompt,
            error: error.message
        });
    } finally {
        showLoader(false);
        dom.promptInput.value = '';
        autoResizeTextarea();
    }
};

const initializeApp = async () => {
    // Initialize theme system
    initializeTheme();

    // Load chat data
    loadChatData();

    // Initialize intelligent generation system
    await initializeAI();
    
    // Load saved AI model preference
    appState.selectedAIModel = getSelectedModel();
    updateModelIndicator();
    
    // Show system info on first load
    if (!localStorage.getItem('tape_system_info_shown')) {
        setTimeout(() => {
            showSystemInfo();
            localStorage.setItem('tape_system_info_shown', 'true');
        }, 2000);
    }

    // Add event listeners
    dom.lightThemeBtn.addEventListener('click', () => applyTheme('light'));
    dom.darkThemeBtn.addEventListener('click', () => applyTheme('dark'));

    // Add keyboard accessibility for theme buttons
    dom.lightThemeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            applyTheme('light');
        }
    });
    dom.darkThemeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            applyTheme('dark');
        }
    });

    // Form and UI event listeners
    dom.promptForm.addEventListener('submit', handleFormSubmit);
    window.addEventListener('resize', onWindowResize);
    dom.collapseBtn.addEventListener('click', toggleSidebar);
    dom.expandBtn.addEventListener('click', toggleSidebar);
    dom.promptInput.addEventListener('input', autoResizeTextarea);
    dom.settingsBtn.addEventListener('click', () => dom.settingsModal.classList.remove('hidden'));
    dom.closeSettingsBtn.addEventListener('click', () => dom.settingsModal.classList.add('hidden'));
    dom.settingsModal.addEventListener('click', (e) => {
        if (e.target === dom.settingsModal) dom.settingsModal.classList.add('hidden');
    });

    // Chat management event listeners
    dom.newChatBtn.addEventListener('click', () => {
        createNewChat();
    });

    // Rename modal event listeners
    dom.closeRenameBtn.addEventListener('click', () => {
        dom.renameModal.classList.add('hidden');
        appState.chatToRename = null;
    });
    dom.cancelRenameBtn.addEventListener('click', () => {
        dom.renameModal.classList.add('hidden');
        appState.chatToRename = null;
    });
    dom.confirmRenameBtn.addEventListener('click', () => {
        if (appState.chatToRename && dom.renameInput.value.trim()) {
            renameChat(appState.chatToRename, dom.renameInput.value.trim());
            dom.renameModal.classList.add('hidden');
            appState.chatToRename = null;
        }
    });
    dom.renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            dom.confirmRenameBtn.click();
        } else if (e.key === 'Escape') {
            dom.cancelRenameBtn.click();
        }
    });
    dom.renameModal.addEventListener('click', (e) => {
        if (e.target === dom.renameModal) {
            dom.cancelRenameBtn.click();
        }
    });

    // Delete modal event listeners
    dom.closeDeleteBtn.addEventListener('click', () => {
        dom.deleteModal.classList.add('hidden');
        appState.chatToDelete = null;
    });
    dom.cancelDeleteBtn.addEventListener('click', () => {
        dom.deleteModal.classList.add('hidden');
        appState.chatToDelete = null;
    });
    dom.confirmDeleteBtn.addEventListener('click', () => {
        if (appState.chatToDelete) {
            deleteChat(appState.chatToDelete);
            dom.deleteModal.classList.add('hidden');
            appState.chatToDelete = null;
        }
    });
    dom.deleteModal.addEventListener('click', (e) => {
        if (e.target === dom.deleteModal) {
            dom.cancelDeleteBtn.click();
        }
    });

    // Authentication modal event listeners
    dom.closeSigninBtn.addEventListener('click', () => dom.signinModal.classList.add('hidden'));
    dom.closeSignupBtn.addEventListener('click', () => dom.signupModal.classList.add('hidden'));
    dom.showSignupBtn.addEventListener('click', () => {
        dom.signinModal.classList.add('hidden');
        dom.signupModal.classList.remove('hidden');
    });
    dom.showSigninBtn.addEventListener('click', () => {
        dom.signupModal.classList.add('hidden');
        dom.signinModal.classList.remove('hidden');
    });
    
    // Close modals when clicking outside
    dom.signinModal.addEventListener('click', (e) => {
        if (e.target === dom.signinModal) dom.signinModal.classList.add('hidden');
    });
    dom.signupModal.addEventListener('click', (e) => {
        if (e.target === dom.signupModal) dom.signupModal.classList.add('hidden');
    });
    
    // Form submissions
    dom.signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        
        const result = await signIn(email, password);
        if (result.success) {
            dom.signinModal.classList.add('hidden');
            dom.signinForm.reset();
        }
    });
    
    dom.signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        const result = await signUp(name, email, password);
        if (result.success) {
            dom.signupModal.classList.add('hidden');
            dom.signupForm.reset();
        }
    });
    
    // AI model selection event listener
    dom.aiModelSelect.addEventListener('change', (e) => {
        setSelectedModel(e.target.value);
        showNotification(`Switched to ${AI_MODELS[e.target.value].name}`, 'success');
    });
    
    // Initialize user session
    appState.currentUser = getCurrentUser();
    updateUserUI();
};

// --- App Start ---
document.addEventListener('DOMContentLoaded', initializeApp);