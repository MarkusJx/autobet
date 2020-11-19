const error_message_div = document.getElementById("error-message");

function setErrorMessage() {
    let err = autobet.getError();
    if (err != null && err.hasOwnProperty("message") && err.message.length > 0) {
        err = err.message.split("\n");
        let err_msg = "";
        for (let i = 0; i < err.length; i++) {
            let cur = err[i];
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

setErrorMessage();