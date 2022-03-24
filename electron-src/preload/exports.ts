import {contextBridge} from "electron";
import autobetLib from "@autobet/autobetlib";
import util from "./util";
import store from "./store";
import electronWindow from "./electronWindow";
import BettingFunctionUtil from "./BettingFunctionUtil";
import licenses from "./licenses";

contextBridge.exposeInMainWorld('autobet', autobetLib);
contextBridge.exposeInMainWorld('util', util);
contextBridge.exposeInMainWorld('store', store);
contextBridge.exposeInMainWorld('electronWindow', electronWindow);
contextBridge.exposeInMainWorld('BettingFunctionUtil', BettingFunctionUtil);
contextBridge.exposeInMainWorld('licenses', licenses);