import {ipcRenderer} from 'electron';

function getError(): Error | null {
    return ipcRenderer.sendSync('get-error');
}

function setErrorMessage(): void {
    const error_message_div: HTMLElement = document.getElementById("error-message");
    const error: Error = getError();
    if (error != null && error.hasOwnProperty("message") && error.message.length > 0) {
        const err: string[] = error.message.split("\n");
        let err_msg: string = "";
        for (let i: number = 0; i < err.length; i++) {
            let cur: string = err[i];
            if (cur.startsWith("- ")) {
                cur = cur.substring(1, cur.length);
            }

            if (i == err.length - 1) {
                err_msg += cur;
            } else {
                err_msg += `${cur}\n`;
            }
        }

        error_message_div.innerText = err_msg;
    } else {
        error_message_div.innerText = "Not available";
    }
}

window.addEventListener('DOMContentLoaded', setErrorMessage);