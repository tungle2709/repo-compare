# RepoDiffMatch

A powerful command-line tool to compare GitHub repositories and detect potential plagiarism by analyzing source code similarities.

## Features

- Compare any two public GitHub repositories
- Accept both GitHub URLs and owner/repo format
- Analyze multiple source code formats (JS, TS, Python, Java, C++, C#, PHP, Ruby, Go, Rust)
- Smart code normalization (removes comments, whitespace, formatting)
- Advanced similarity calculation using Levenshtein distance algorithm
- Color-coded similarity reports with visual indicators
- Automated plagiarism risk assessment
- Auto-skip identical files and common directories (node_modules, dist, build)
- No authentication required

## Installation

### Quick Install (Recommended)

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/tungle2709/RepoDiffMatch/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/tungle2709/RepoDiffMatch/main/install.ps1 | iex
```

### Package Managers

**Homebrew (macOS/Linux):**
```bash
# Coming soon - Homebrew formula pending
brew tap tungle2709/repodiffmatch
brew install repodiffmatch
```

**npm (Cross-platform):**
```bash
npm install -g repodiffmatch
```

### Manual Installation

1. **Clone the repository:**
```bash
git clone https://github.com/tungle2709/RepoDiffMatch.git
cd RepoDiffMatch
```

2. **Install dependencies:**
```bash
npm install
```

3. **Make globally available:**
```bash
npm link
```

### Prerequisites
- Node.js (v14.0.0 or higher)
- Internet connection for GitHub API access

### Basic Usage

```bash
# Using owner/repo format
repodm compare facebook/react preactjs/preact

# Using full GitHub URLs
repodm compare https://github.com/facebook/react https://github.com/preactjs/preact

# More examples
repodm compare expressjs/express koajs/koa
repodm compare https://github.com/microsoft/vscode https://github.com/atom/atom
```

## Authentication

No authentication required! The tool works with GitHub's public API without needing any tokens or credentials.

## Understanding Results

### Similarity Levels
- **>90%**: High plagiarism risk
- **80-90%**: Moderate similarity 
- **70-80%**: Low-moderate similarity
- **<70%**: Minimal similarity (not displayed)

### Sample Output
```
Comparing repositories:
  Source: facebook/react
  Target: preactjs/preact

Similarity Report

Identical files (skipped): 3
  package.json ↔ package.json
  .gitignore ↔ .gitignore
  LICENSE ↔ LICENSE

85.2% similarity
  src/component.js ↔ src/component/index.js

78.9% similarity  
  src/hooks.js ↔ hooks/src/index.js

Summary:
  Similar files: 12
  Identical files (skipped): 3
  High similarity (>90%): 2
  Average similarity: 73.4%

Moderate similarity detected
```

## Advanced Usage

### Command Options
```bash
# Basic comparison (owner/repo format)
repodm compare <repo1> <repo2>

# Using GitHub URLs
repodm compare <github-url1> <github-url2>

# Get help
repodm --help

# Check version
repodm --version
```

### Supported File Types
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp, .h)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RepoDiffMatch CLI                        │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Command Parser (Commander.js)              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   compare cmd   │  │   --help cmd    │  │  --version cmd  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RepoComparer Class                        │
│                                                                 │
│  ┌─────────────────┐           ┌─────────────────┐             │
│  │  parseGitHubUrl │           │ compareRepos    │             │
│  │                 │           │                 │             │
│  │ • URL parsing   │           │ • Batch process │             │
│  │ • Format check  │           │ • Memory mgmt   │             │
│  └─────────────────┘           └─────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub API Integration                      │
│                                                                 │
│  ┌─────────────────┐           ┌─────────────────┐             │
│  │  getRepoFiles   │           │ getFileContent  │             │
│  │                 │           │                 │             │
│  │ • Fetch tree    │           │ • Get blob data │             │
│  │ • Filter files  │           │ • Handle errors │             │
│  │ • Error handle  │           │ • Size limits   │             │
│  └─────────────────┘           └─────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Code Analysis Engine                         │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ normalizeCode   │  │calculateSimilar │  │ quickSimilarity │ │
│  │                 │  │                 │  │                 │ │
│  │ • Remove comments│  │ • Levenshtein   │  │ • Char frequency│ │
│  │ • Strip format  │  │ • Distance calc │  │ • Large files   │ │
│  │ • Size limits   │  │ • Similarity %  │  │ • Fast compare  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Results Processing                         │
│                                                                 │
│  ┌─────────────────┐           ┌─────────────────┐             │
│  │ displayResults  │           │ Risk Assessment │             │
│  │                 │           │                 │             │
│  │ • Color coding  │           │ • High (>80%)   │             │
│  │ • Formatting    │           │ • Moderate      │             │
│  │ • Statistics    │           │ • Low risk      │             │
│  └─────────────────┘           └─────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Terminal Output                          │
│                                                                 │
│  • Similarity percentages with color coding                    │
│  • File-by-file comparison results                             │
│  • Summary statistics and risk assessment                      │
│  • Error messages with solutions                               │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
Input URLs → Parse → Fetch Files → Normalize Code → Compare → Results
```

## How It Works

1. **Repository Fetching**: Uses GitHub API to recursively fetch all source files
2. **Smart Filtering**: Automatically excludes node_modules, dist, build, and .git directories
3. **Code Normalization**: Removes comments, normalizes whitespace, strips formatting
4. **Similarity Analysis**: Calculates Levenshtein distance between normalized code
5. **Identical File Detection**: Identifies and skips 100% identical files
6. **Risk Assessment**: Analyzes patterns and provides plagiarism risk evaluation
7. **Report Generation**: Creates detailed, color-coded similarity reports

## Core Components

### CLI Interface (`index.js`)
- **Commander.js**: Command-line argument parsing and help system
- **Entry Point**: Main application logic and error handling
- **Memory Management**: Node.js heap optimization for large repositories

### RepoComparer Class
- **URL Parser**: Handles both GitHub URLs and owner/repo format
- **API Client**: GitHub REST API integration with rate limit handling
- **Batch Processor**: Memory-efficient file processing in chunks

### Analysis Engine
- **Code Normalizer**: Strips comments, formatting, and normalizes syntax
- **Similarity Calculator**: Levenshtein distance algorithm for precise comparison
- **Quick Similarity**: Character frequency analysis for large files
- **Filter System**: Excludes common directories and binary files

### Output System
- **Chalk.js**: Color-coded terminal output for better readability
- **Ora.js**: Progress spinners and status indicators
- **Results Formatter**: Structured similarity reports and statistics

## Requirements

- **Node.js**: v14.0.0 or higher
- **Internet**: Required for GitHub API access

## Limitations

- Only works with **public repositories**
- Subject to **GitHub API rate limits** (60 requests/hour per IP)
- Focuses on **structural similarity**, not semantic analysis
- Large repositories may take longer to analyze
- Does not detect refactored or heavily modified code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

**"API rate limit exceeded"**
- Wait for rate limit reset (1 hour)
- Try again later or use fewer requests

**"Repository not found"**
- Ensure repository is public
- Check repository name format: `owner/repo` or full GitHub URL
- Verify repository exists

**"No source files found"**
- Repository may not contain supported file types
- Check if repository has source code in main/master branch

### Getting Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review this README for setup instructions

### Uninstall

**Quick uninstall:**
```bash
curl -fsSL https://raw.githubusercontent.com/tungle2709/RepoDiffMatch/main/uninstall.sh | bash
```

**npm:**
```bash
npm uninstall -g repodiffmatch
```

---

Made with care for developers who value code integrity
