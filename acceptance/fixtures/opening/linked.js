/**
 * The application's entry as a development server that has not restarted since its package changed
 * serves it: it names an export its dependency lacks, so the module never links and nothing of it runs.
 */
import { absent } from './parts.js';

absent();
