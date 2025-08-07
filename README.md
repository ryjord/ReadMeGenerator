# README Generator CLI 🛠️

A simple command-line tool to automatically generate a basic `README.md` file for your projects. Designed to help developers kick-start documentation with minimal setup.

## ✨ Features (v1)

- **📛 Title Generation**  
  Automatically sets the project title based on the root directory name.

- **📝 Basic Description**  
  Inserts a placeholder section for project description.

- **🧠 Language Detection**  
  Detects main programming languages in the project and adds corresponding badges.

- **📁 File Creation**  
  Generates a `README.md` file in the root directory.

- **🖥️ Cross-Platform Support**  
  Works seamlessly across Windows, macOS, and Linux.

## 🚀 Tech Stack

This CLI tool is built using **Node.js**, ensuring speed, portability, and wide developer adoption.

### Dependencies

| Package       | Purpose                            |
|---------------|------------------------------------|
| `chalk`       | For clean, colored terminal output |
| `language-detect` | Detects project languages        |

> _Note: `inquirer` and `simple-git` are planned for future versions to add interactive setup and Git detection._

## 📦 Installation

```bash
git clone https://github.com/your-username/readme-generator-cli.git
cd readme-generator-cli
npm install
