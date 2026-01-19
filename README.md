# Mutex

A beautiful Chrome extension that helps you stay focused by blocking distracting websites during focus sessions. Built with vanilla TypeScript and Manifest V3.

![Mutex](https://img.shields.io/badge/version-0.1.0-blue)
![Chrome Extension](https://img.shields.io/badge/platform-Chrome-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Focus Sessions**: Set custom timer durations (25, 45, 60, or 90 minutes) to block distracting sites
- **Smart Blocking**: Uses Chrome's Declarative Net Request API for efficient, system-level blocking
- **Beautiful UI**: Modern glassmorphism design with excellent contrast and readability
- **Custom Block List**: Easily manage which domains to block during focus sessions
- **Session Persistence**: Sessions continue even if you close the browser, thanks to Chrome Alarms
- **Visual Feedback**: Clear blocked page with countdown timer showing remaining focus time
- **Default Block List**: Pre-configured with 20+ common procrastination sites
- **Notifications**: Get notified when your focus session ends

## 🚀 Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/heinrisch/FocusFlow.git
cd FocusFlow
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Chrome browser

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run check

# Preview production build
npm run preview

# Build release package
npm run build:release
```

### Project Structure

```
Mutex/
├── src/
│   ├── background/        # Service worker (session management, blocking rules)
│   ├── blocked/          # Blocked page UI (shown when accessing blocked sites)
│   ├── options/          # Settings page (manage block list)
│   ├── popup/            # Extension popup (start/stop sessions)
│   ├── lib/              # Shared utilities (storage, blocking logic)
│   ├── styles/           # Global styles
│   └── assets/           # Static assets
├── icons/                # Extension icons
├── public/               # Public assets
├── scripts/              # Build scripts
├── dist/                 # Build output (load this in Chrome)
├── manifest.json         # Chrome extension manifest
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies and scripts
```

## 📖 Usage

### Starting a Focus Session

1. Click the Mutex icon in your Chrome toolbar
2. Select a duration (25, 45, 60, or 90 minutes) or enter a custom time
3. Click "Start Focus"
4. The extension will block all domains in your block list for the selected duration

### Managing Blocked Domains

1. Click the Mutex icon → "Configure Block List" (or go to Options)
2. Add domains by typing them in the input field (e.g., `youtube.com`)
3. Remove domains by clicking the trash icon next to each domain

### Default Block List

The extension comes pre-configured with these domains:
- Social Media: Facebook, Twitter, Instagram, Reddit, TikTok, Snapchat, Pinterest, Tumblr, LinkedIn, Discord
- Video/Streaming: YouTube, Twitch, Netflix, Hulu, Disney+
- Shopping: Amazon, eBay, Etsy
- Entertainment: 9GAG, BuzzFeed

You can customize this list to match your needs.

## 🏗️ Technology Stack

- **Frontend**: Vanilla TypeScript with DOM manipulation
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 7.3.0
- **Extension Framework**: [@crxjs/vite-plugin](https://crxjs.dev/) 2.0.0-beta.23
- **Chrome APIs**: 
  - `declarativeNetRequest` (blocking)
  - `storage` (settings & session state)
  - `alarms` (session timers)
  - `tabs` (navigation)
  - `notifications` (session alerts)

## 🎨 Design

Mutex features a modern glassmorphism design with:
- High contrast text for excellent readability
- Smooth animations and transitions
- Responsive layout that works on all screen sizes
- Beautiful gradient backgrounds
- Clear visual hierarchy
- Custom Inter font for a clean, professional look

## 🔒 Privacy & Security

- All data is stored locally in your browser (Chrome Storage API)
- No external servers or analytics
- No data collection or tracking
- Open source - you can audit the code yourself

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Known Issues

- None at the moment! If you find any issues, please open an issue on GitHub.

## 📧 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

Made with ❤️ to help you stay focused and productive.