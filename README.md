# Koude Oorlog Presentation

An interactive, 3D-enhanced presentation platform focused on the history of the Cold War. Built with React, Three.js, and Express.

## Features

- **Interactive Slides**: Built with React and Framer Motion for smooth transitions.
- **3D Visualizations**: Integrated Three.js scenes (e.g., Berlin Wall, USSR Stagnation) to bring historical data to life.
- **Dual-Layer Architecture**: A Vite-powered frontend and an Express backend.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. Clone the repository.
2. Install dependencies for all workspaces:

```bash
npm install
```

## Running the App

### Development

To start both the client (Vite) and the server in development mode:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:3001](http://localhost:3001)

### Production

To build the project and run it in production mode:

1. **Build the client**:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm run start
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

Alternatively, you can use the preview command:
```bash
npm run preview
```

### Production with PM2

The project includes a `ecosystem.config.js` for process management with [PM2](https://pm2.keymetrics.io/).

To start the app with PM2:

```bash
# Install PM2 globally if you haven't
npm install -g pm2

# Build the client first
npm run build

# Start the application
npm run pm2
```

By default, PM2 will run the app on port `6767` (as configured in `ecosystem.config.js`). You can manage the process using:

```bash
pm2 list
pm2 logs koude-oorlog
pm2 stop koude-oorlog
```

## Project Structure

- `client/`: React frontend (Vite).
- `server/`: Express backend.
- `public/`: Static assets.
- `*.html`: Standalone prototypes and experiments (Berlin Wall, USSR Stagnation, etc.).

## Technologies Used

- **Frontend**: React 19, Vite, Framer Motion, Tailwind CSS, Three.js.
- **Backend**: Express.
- **Tooling**: Concurrently, ESLint.
