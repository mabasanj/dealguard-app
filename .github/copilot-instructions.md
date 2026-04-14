<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	<!-- Flutter mobile app for escrow application -->

- [x] Scaffold the Project
	<!-- Flutter project structure created manually -->

- [x] Customize the Project
	<!-- Basic app structure with auth, wallet, escrow, chat, and dispute screens implemented -->

- [x] Install Required Extensions
	<!-- No extensions required for Flutter project -->

- [ ] Compile the Project
	<!-- Flutter not installed on system, manual structure created. Requires Flutter SDK installation to compile. -->

- [ ] Create and Run Task
	<!-- Skipped - Flutter not installed -->

- [ ] Launch the Project
	<!-- Skipped - Flutter not installed -->

- [x] Ensure Documentation is Complete
	<!-- README.md created with setup instructions -->

## Project Status

The Flutter mobile app project has been scaffolded with:
- Complete project structure (lib/, models/, providers/, screens/, services/)
- Authentication system with JWT
- Wallet management with payment integration
- Escrow creation and status tracking
- Chat system for buyer-seller communication
- Dispute resolution with evidence upload
- API integration layer for all features

## Next Steps

1. Install Flutter SDK
2. Run `flutter pub get` to install dependencies
3. Configure API endpoints in `lib/services/api_service.dart`
4. Test on Android/iOS emulator
5. Implement real-time chat with WebSocket
6. Add push notifications
7. Integrate Flutterwave/Paystack payment gateway
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.
- If the project setup information has additional rules, follow them strictly.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.
-->
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
- [x] Install Node.js & NPM - Node.js v24.14.1 installed
- [ ] Install Dependencies - npm install (manual installation needed)
- [ ] Setup Database - PostgreSQL with Prisma
- [ ] Create and Run Task - Setup dev server task
- [ ] Launch the Project - npm run dev
- [ ] Ensure Documentation is Complete

## Project Overview

A comprehensive escrow application for South Africa that facilitates secure trading between buyers and sellers.

### Key Features
- User authentication and verification (ID verification)
- Escrow transaction management
- Multiple payment methods (Card, Bank Transfer, Instant EFT, Crypto)
- Dispute resolution
- Rating and review system
- Wallet/balance management
- South Africa-specific compliance

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Payment**: Stripe (South Africa ZAR support)
- **Authentication**: NextAuth.js
- **State Management**: Zustand

### Database Models
- User (with SA-specific fields)
- Escrow (transaction management)
- Payment (multiple payment methods)
- Dispute (resolution handling)
- Review (user ratings)
- WalletBalance (account balance)
- Notification

## Next Steps
1. Install dependencies: `npm install`
2. Setup database connection in `.env.local`
3. Run Prisma migrations: `npm run prisma:migrate`
4. Start development server: `npm run dev`
