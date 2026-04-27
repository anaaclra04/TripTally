# TripTally

A full-stack web app that helps groups track and split shared expenses while traveling.

## Overview

TripTally is a group expense management application designed to simplify cost sharing during trips. Users can create groups, add members, log expenses, and see balances automatically calculated between members.

## Features

- Create and manage travel groups
- Add members to each group
- Log shared expenses with descriptions and amounts
- Track who paid for each expense
- Automatically calculate balances between members

## Tech Stack

**Frontend**
- React (v19)
- TypeScript
- Tailwind CSS
- Vite (with React SWC plugin)

**Backend**
- Python (Flask)

**Other**
- Axios (API requests)

## Prerequisites

- Node.js (v16 or higher)
- npm
- Python (v3.9 or higher)
- pip

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/anaaclra04/TripTally.git
cd TripTally
```

### 2. Start the backend

```bash
cd server
source venv/bin/activate
python app.py
```

### 3. Start the frontend

```bash
cd client
npm run dev
```

## Available Scripts (Frontend)

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |
