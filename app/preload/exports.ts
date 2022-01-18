import {contextBridge} from "electron";
import autobetLib from "@autobet/autobetlib";
import util from "./util";

contextBridge.exposeInMainWorld('autobet', autobetLib);
contextBridge.exposeInMainWorld('util', util);