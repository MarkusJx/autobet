import path from "path";
import ace from "ace-builds";
import { contextBridge } from "electron";

// Set the ace root to node_modules/ace-builds/src-noconflict
const ace_root: string = path.join(require.resolve('ace-builds'), '..');

// Expose ace to the renderer process
contextBridge.exposeInMainWorld('ace', ace);

// Import ace/ext/language_tools, ace/mode/javascript and ace/theme/chrome
import(path.join(ace_root, 'ext-language_tools.js'));
import(path.join(ace_root, 'mode-javascript.js'));
import(path.join(ace_root, 'theme-chrome.js'));

// Set the base path to ace_root
ace.config.set('basePath', ace_root);

// Require ace/ext/language_tools
ace.require("ace/ext/language_tools");

/**
 * The ace editor.
 * 
 * This is actually typeof import("ace-build"), but it seems
 * like some attributes are added dynamically, so the typescript
 * compiler would not compe the *.ts files as there would be
 * unresolved symbols, so the type of the editor has to be
 * casted to any at some points.
 */
export const editor: ace.Ace.Editor = ace.edit("editor");