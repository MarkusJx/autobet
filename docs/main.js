const download_button = document.getElementById("download-button");
const download_now = document.getElementById("download-now");
const show_tag = document.getElementById("show-tag");

setTimeout(() => {
    if (!isWindows()) {
        document.getElementById("main-download-container-unsupported").style.visibility = "visible";
        document.getElementById("main-download-container-unsupported").style.position = "unset";
        document.getElementById("main-download-container-unsupported").style.display = "block"

        document.getElementById("main-download-container").style.visibility = "hidden";
        document.getElementById("main-download-container").style.position = "absolute";
        document.getElementById("main-download-container").style.display = "none";
    }
}, 500);

new mdc.ripple.MDCRipple(download_button);
new mdc.ripple.MDCRipple(download_now);
new mdc.ripple.MDCRipple(show_tag);
new mdc.ripple.MDCRipple(document.getElementById("goto-gh-issues"));
new mdc.ripple.MDCRipple(document.getElementById("goto-downloads-unsupported"));
let license_dialog = new mdc.dialog.MDCDialog(document.getElementById("license-dialog"));

let is_dark = false;
let recentlyChanged = false;

function changeTheme(val) {
    if (val) {
        document.body.classList.remove("darktheme");
        document.getElementById("theme-change-icon").classList.remove("darktheme");
        document.getElementById("change-theme").classList.remove("darktheme");

        let elements = document.getElementsByClassName("code-background");
        for (let i = 0; i < elements.length; i++) {
            elements.item(i).classList.remove("darktheme");
        }

        is_dark = false;
        window.localStorage.setItem("darktheme", "false");
    } else {
        document.body.classList.add("darktheme");
        document.getElementById("theme-change-icon").classList.add("darktheme");
        document.getElementById("change-theme").classList.add("darktheme");

        let elements = document.getElementsByClassName("code-background");
        for (let i = 0; i < elements.length; i++) {
            elements.item(i).classList.add("darktheme");
        }

        is_dark = true;
        window.localStorage.setItem("darktheme", "true");
    }
}

document.getElementById("change-theme").addEventListener('click', () => {
    if (!recentlyChanged) {
        changeTheme(is_dark);
        recentlyChanged = true;
        setTimeout(() => {
            recentlyChanged = false;
        }, 300);
    }
});

document.getElementById("copyright-footer").addEventListener('click', () => {
    license_dialog.open();
    document.body.style.overflowY = 'hidden';
});

license_dialog.listen("MDCDialog:closing", () => {
    document.body.style.overflowY = 'visible';
});

download_button.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

let scrolled = false;

function showDownloadButton(e) {
    if (/*(e == null || e.originalEvent.deltaY > 0) && */!scrolled) {
        $("#heading-download-container").addClass("scrolled");
        $("#heading-download-background").addClass("scrolled");
        setTimeout(() => {
            $("#download-button").addClass("scrolled");
            $("#download-button").prop('disabled', false);
            document.body.style.overflowY = 'visible';
            $("body").unbind();
        }, 500);
        scrolled = true;
    }
}

document.addEventListener('scroll', () => {
    if (window.scrollY != 0) {
        if (!document.getElementById("change-theme").classList.contains("shown")) {
            document.getElementById("change-theme").classList.add("shown");
        }
    } else {
        document.getElementById("change-theme").classList.remove("shown");
    }
});

$("body").on('mousewheel DOMMouseScroll MozMousePixelScroll', showDownloadButton);

document.addEventListener('click', () => showDownloadButton(null));
document.addEventListener('keypress', () => showDownloadButton(null));
document.addEventListener('touchmove', () => showDownloadButton(null));

setTimeout(() => {
    window.scrollTo(0, 0);

    function verNotFound() {
        document.getElementById("latest-version").style.color = "red";
        $('#download-now').prop('disabled', true);
        console.error("could not get latest version");
    }

    try {
        getLatestVersion((res) => {
            if (res != null) {
                document.getElementById("latest-version").innerHTML = res;

                download_now.addEventListener('click', () => {
                    location.href = "https://github.com/MarkusJx/GTA-Online-Autobet/releases/download/" + res + "/autobet_installer.exe";
                });

                show_tag.addEventListener('click', () => {
                    location.href = "https://github.com/MarkusJx/GTA-Online-Autobet/releases/tag/" + res;
                });
            } else {
                verNotFound();
            }
        }, verNotFound);
    } catch (e) {
        verNotFound();
    }

    getLicense((res) => {
        document.getElementById("license-dialog-content").innerHTML = res.split("\n").join("<br>");
    }, () => {
        console.error("Could not get license");
        document.getElementById("copyright-footer").addEventListener("click", () => {
            location.href = "https://github.com/MarkusJx/GTA-Online-Autobet/blob/master/LICENSE";
        });
    });

    changeTheme(window.localStorage.getItem("darktheme") != "true");
}, 100);

function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}


function isWindows() {
    return !isMobile() && getOS() === "Windows";
}

function getLatestVersion(fn, err) {
    $.ajax({
        url: "https://api.github.com/repos/markusjx/gta-online-autobet/tags",
        success: (result) => {
            try {
                fn(result[0]["name"]);
            } catch (error) {
                fn(null);
            }
        },
        error: err
    });
}

function getLicense(fn, err) {
    $.ajax({
        url: "https://raw.githubusercontent.com/MarkusJx/GTA-Online-Autobet/master/LICENSE",
        success: fn,
        error: err
    });
}


/**
 * Check if the client is a mobile device
 *
 * @returns {boolean} true if the client is indeed a mobile device
 */
function isMobile() {
    try {
        if (/Android|webOS|iPhone|iPad|iPod|pocket|psp|kindle|avantgo|blazer|midori|Tablet|Palm|maemo|plucker|phone|BlackBerry|symbian|IEMobile|mobile|ZuneWP7|Windows Phone|Opera Mini/i.test(navigator.userAgent)) {
            return true;
        }
        return false;
    } catch (e) {
        console.log("Error in isMobile");
        return false;
    }
}
