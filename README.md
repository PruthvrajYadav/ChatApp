# WhatsApp-like Chat Application

A full-stack real-time chat application with group messaging, "seen" status tracking, and file sharing.

## Features
- **Real-time Messaging**: Powered by Socket.io.
- **Group Chats**: Create and manage groups.
- **Message Status**: WhatsApp-like ticks (Sent, Delivered, Seen by all).
- **Unread Counts**: Live updates for unread messages in the sidebar.
- **Responsive UI**: Modern design built with React and TailwindCSS.

## Tech Stack
- **Frontend**: React, Vite, Context API, TailwindCSS.
- **Backend**: Node.js, Express, Socket.io, MongoDB (Mongoose).
- **Deployment**: Vercel (Frontend), Render (Backend).
- **DevOps**: Docker, GitHub Actions (CI/CD).

## CI/CD Pipeline
This project uses **GitHub Actions** for Continuous Integration and Deployment:
1. **Build Test**: On every push, a Docker image is built to ensure the backend is stable.
2. **Auto-Deploy**: Once the build succeeds, a deployment trigger is sent to Render to update the live backend.

## Docker Setup
To run the server locally using Docker:
```bash
docker-compose up --build
```
This ensures the app runs in the same environment as production.

## Interview Talking Points
- **Containerization**: "I containerized the backend using Docker to ensure environment consistency across development and production."
- **CI/CD**: "Implemented a CI/CD pipeline with GitHub Actions to automate build verification and deployment triggers."
- **Real-time Synchronization**: "Optimized Socket.io events for accurate message status tracking in groups."
