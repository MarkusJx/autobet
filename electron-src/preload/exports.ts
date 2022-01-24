import {contextBridge} from "electron";
import autobetLib from "@autobet/autobetlib";
import util from "./util";
import store from "./store";

contextBridge.exposeInMainWorld('autobet', autobetLib);
contextBridge.exposeInMainWorld('util', util);
contextBridge.exposeInMainWorld('store', store);