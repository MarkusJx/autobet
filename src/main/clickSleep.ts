import autobetLib from "@autobet/autobetlib";
import {showSnackbar, addDescriptionTo} from "./utils";

import {MDCTextField} from "@material/textfield";

export const click_sleep_textField = new MDCTextField(document.getElementById('click-sleep-field'));
export const afterClick_sleep_textField = new MDCTextField(document.getElementById('after-click-sleep-field'));

/**
 * Load the sleep times
 */
export function loadSleepTimes() {
    click_sleep_textField.value = String(autobetLib.uiNavigation.clicks.getClickSleep());
    afterClick_sleep_textField.value = String(autobetLib.uiNavigation.clicks.getAfterClickSleep());
}

// Listen for keyup events on the input of the click_sleep_textField
(click_sleep_textField as any).input_.addEventListener('keyup', (event: KeyboardEvent) => {
    // Only do this if the key pressed was 'enter'
    if (event.keyCode === 13) {
        event.preventDefault();
        // If the length of the value string is not zero,
        // save the settings
        if (click_sleep_textField.value.length !== 0) {
            click_sleep_textField.disabled = true;
            autobetLib.uiNavigation.clicks.setClickSleep(Number(click_sleep_textField.value)).then(() => {
                click_sleep_textField.disabled = false;
                showSnackbar("Settings saved.");
            });
        }
    }
});

// Listen for keyup events on the input of the afterClick_sleep_textField
(afterClick_sleep_textField as any).input_.addEventListener('keyup', (event: KeyboardEvent) => {
    // Only do this if the key pressed was 'enter'
    if (event.keyCode === 13) {
        event.preventDefault();
        // If the length of the value string is not zero,
        // save the settings
        if (afterClick_sleep_textField.value.length !== 0) {
            afterClick_sleep_textField.disabled = true;
            autobetLib.uiNavigation.clicks.setAfterClickSleep(Number(afterClick_sleep_textField.value)).then(() => {
                afterClick_sleep_textField.disabled = false;
                showSnackbar("Settings saved.");
            });
        }
    }
});

addDescriptionTo("click-sleep-info", "Click sleep", "Set the time to sleep between a button is " +
    "pressed and then released. Increase this value if button clicks are not recognized by the game. Press enter to save");
addDescriptionTo("after-click-sleep-info", "After click sleep", "Set the time to sleep after " +
    "a button is pressed. Increase this value if button clicks are not recognized by the game. Press enter to save")