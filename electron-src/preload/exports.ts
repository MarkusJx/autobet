import {contextBridge} from "electron";
import autobetLib from "@autobet/autobetlib";
import util from "./util";
import store from "./store";
import electronWindow from "./electronWindow";
import BettingFunctionUtil from "./BettingFunctionUtil";

contextBridge.exposeInMainWorld('autobet', autobetLib);
contextBridge.exposeInMainWorld('util', util);
contextBridge.exposeInMainWorld('store', store);
contextBridge.exposeInMainWorld('electronWindow', electronWindow);
contextBridge.exposeInMainWorld('BettingFunctionUtil', BettingFunctionUtil);