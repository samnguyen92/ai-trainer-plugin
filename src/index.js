/**
 * AI Trainer Plugin - Main Source Entry Point
 * 
 * This file serves as the main entry point for the AI Trainer plugin's
 * frontend assets. It imports the core SCSS styles and serves as the
 * foundation for any future JavaScript functionality.
 * 
 * BUILD SYSTEM:
 * - Uses WordPress Scripts (wp-scripts) for compilation
 * - Processes SCSS files into optimized CSS
 * - Generates source maps for development
 * - Outputs to the build/ directory
 * 
 * CURRENT FUNCTIONALITY:
 * - Imports core SCSS styles for the plugin
 * - Provides foundation for future JavaScript modules
 * - Integrates with WordPress asset management
 * 
 * DEVELOPMENT WORKFLOW:
 * - Run 'npm run start' for development with hot reloading
 * - Run 'npm run build' for production builds
 * - Use 'npm run format' for code formatting
 * - Use 'npm run lint:js' and 'npm run lint:css' for code quality
 * 
 * @package AI_Trainer
 * @version 1.0
 * @since 2025
 */

// Import core SCSS styles for the plugin
import "../assets/css/core.scss";

// Future JavaScript functionality can be added here
// Example: import { initializeAI } from './modules/ai-core';
// Example: import { setupReactions } from './modules/reactions';