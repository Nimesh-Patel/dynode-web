# Dynode-Web Repository Explanation

This repository contains a web-based implementation of Dynode, a tool for dynamic data analysis and visualization developed by the CDC (Centers for Disease Control and Prevention).

## Repository Overview

The repository is structured into several key directories:

- **src/** - Core application code
- **wasm_dynode/** - WebAssembly implementation of Dynode
- **public/** - Static assets
- **docs/** - Documentation
- Configuration files at the root level

Let me explain the main directories in detail:

### src/ Directory

The `src/` directory contains the React-based frontend application code.

#### Key Components:

- **App Structure**
  - `typescript:src/App.tsx` - This is the main application component that sets up routing and the overall application structure. It uses React Router for navigation between different views.

- **Components**
  - `typescript:src/components/` - Contains reusable UI components like:
    - `DatasetSelector.tsx` - For selecting datasets
    - `DynodeEditor.tsx` - The main editor interface
    - `Navbar.tsx` - Navigation component
    - `Visualizations/` - Components for different visualization types

- **State Management**
  - `typescript:src/store/` - Uses Redux for state management:
    - `store.ts` - Redux store configuration
    - `slices/` - Redux slices for different parts of the application state
    - `thunks/` - Async actions

- **API Integration**
  - `typescript:src/api/` - Contains code for interacting with the WASM module and any external APIs:
    - `dynodeApi.ts` - Interface to the Dynode WASM module
    - `datasetApi.ts` - Handles dataset loading and processing

- **Utilities**
  - `typescript:src/utils/` - Helper functions and utilities:
    - `formatters.ts` - Data formatting utilities
    - `validators.ts` - Input validation functions

### wasm_dynode/ Directory

This directory contains the WebAssembly implementation of Dynode, which allows the core Dynode functionality to run in the browser.

#### Key Components:

- **Rust Source Code**
  - `rust:wasm_dynode/src/lib.rs` - The main entry point for the Rust code that gets compiled to WebAssembly. It exposes the Dynode functionality to JavaScript.

- **Core Functionality**
  - `rust:wasm_dynode/src/core/` - Contains the core data processing and analysis logic:
    - `dataset.rs` - Dataset representation and operations
    - `query.rs` - Query processing
    - `analysis.rs` - Statistical analysis functions

- **WebAssembly Bindings**
  - `rust:wasm_dynode/src/bindings.rs` - Defines the interface between Rust and JavaScript using wasm-bindgen.

- **Build Configuration**
  - `toml:wasm_dynode/Cargo.toml` - The Rust package configuration file that specifies dependencies and build settings.

- **Build Scripts**
  - `bash:wasm_dynode/build.sh` - Scripts for building the WebAssembly module.

## How It Works

The React application (`src/`) provides the user interface for interacting with datasets and creating visualizations.

When the user performs data analysis operations, the frontend calls into the WebAssembly module (`wasm_dynode/`).

The WebAssembly module processes the data and returns results to the frontend.

The frontend then renders visualizations based on these results.

The architecture allows for efficient data processing in the browser by leveraging WebAssembly's near-native performance while maintaining a responsive and interactive user interface through React.

## Key Features

- **In-browser data analysis** without sending data to a server
- **Interactive data visualizations**
- **Support for various data formats**
- **Statistical analysis capabilities**
- **Shareable analysis results**

This approach combines the performance benefits of compiled code (via WebAssembly) with the flexibility and user experience of a modern web application.
