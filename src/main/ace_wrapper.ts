import path from "path";
import ace from "ace-builds";

// Set the ace root to node_modules/ace-builds/src-noconflict
const ace_root = path.join(require.resolve('ace-builds'), '..');

// Import ace/ext/language_tools, ace/mode/javascript and ace/theme/chrome
import(path.join(ace_root, 'ext-language_tools.js'));
import(path.join(ace_root, 'mode-javascript.js'));
import(path.join(ace_root, 'theme-chrome.js'));

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