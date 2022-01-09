import {contextBridge} from "electron";
import autobetLib from "@autobet/autobetlib";

contextBridge.exposeInMainWorld('autobet', autobetLib);