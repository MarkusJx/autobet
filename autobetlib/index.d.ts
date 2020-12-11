/**
 * Initialize everything
 *
 * @returns true, if the startup was successful
 */
export function init(): Promise<boolean>;

/**
 * Start the main loop
 */
export function start(): Promise<void>;

/**
 * Start the web ui
 *
 * @returns true, if the web ui could be started
 */
export function startWebServer(): Promise<boolean>;

/**
 * Check if GTA V is running
 *
 * @returns true, if it is running
 */
export function getGtaRunning(): boolean;

/**
 * Load the winnings
 */
export function loadWinnings(): Promise<void>;

/**
 * Get this computer's IPv4 address
 *
 * @returns the IP address as a string
 */
export function getIP(): string;

/**
 * Open the web ui website
 */
export function openWebsite(): void;

/**
 * Check if the betting has been stopped
 *
 * @returns true, if the betting has been stopped
 */
export function stopped(): boolean;

/**
 * Get the time the betting has been running
 *
 * @returns the time in seconds
 */
export function getTimeRunning(): number;

/**
 * Set if the script is starting
 *
 * @param starting true, if it is starting, false otherwhise
 */
export function setStarting(starting: boolean): void;

/**
 * Start the betting
 */
export function startBetting(): void;

/**
 * Stop the betting
 */
export function stopBetting(): void;

/**
 * Callbacks to set
 */
export namespace callbacks {
    /**
     * Set the callback function to get if GTA is running
     *
     * @param callback the callback function
     */
    function setGtaRunningCallback(callback: (running: boolean) => void): void;

    /**
     * Set the callback function to add money
     *
     * @param callback the callback function
     */
    function setAddMoneyCallback(callback: (money: boolean) => void): void;

    /**
     * Set the callback function to set all money made
     *
     * @param callback the callback function
     */
    function setAllMoneyMadeCallback(callback: (moneyMade: number) => void): void;

    /**
     * Set the callback function to the script being started
     *
     * @param callback the callback function
     */
    function setUiKeycombStartCallback(callback: () => void): void;

    /**
     * Set the callback function to the script being stopped
     *
     * @param callback the callback function
     */
    function setUiKeycombStopCallback(callback: () => void): void;

    /**
     * Set the callback function to stop the program
     *
     * @param quit the callback function
     */
    function setQuitCallback(quit: () => void): void;

    /**
     * Set the callback function when an exception occurs
     *
     * @param exception the callback function
     */
    function setExceptionCallback(exception: () => void): void;

    /**
     * Set the function to be called when the betting is stopped due to an error
     * 
     * @param callback the callback function
     */
    function setBettingExceptionCallback(callback: (errMsg: string) => void): void;
}

/**
 * A namespace for the custom betting function
 */
export namespace customBettingFunction {
    /**
     * Set the callback function to get the horse to bet on
     *
     * @param func the callback function
     */
    function setBettingPositionCallback(func: (odds: string[]) => number): void;

    /**
     * Set whether to use the custom betting function
     * 
     * @param val whether to use the function
     */
    function setUseBettingFunction(val: boolean): void;
}

/**
 * A logging namespace
 */
export namespace logging {
    /**
     * Set a logging function
     *
     * @param log the logging function
     */
    function setLogCallback(log: (toLog: string) => void): void;

    /**
     * Check if the program is logging to a file
     *
     * @return true, if it is logging to a file
     */
    function isLoggingToFile(): boolean;

    /**
     * Set if the program should log to a file
     *
     * @param logToFile true, if it should log to a file
     */
    function setLogToFile(logToFile: boolean): void;

    /**
     * Check if the program is logging to the console
     *
     * @return true, if it is logging to the console
     */
    function isLoggingToConsole(): boolean;

    /**
     * Set if the program should log to the console
     *
     * @param logToConsole true, if it should log to the console
     */
    function setLogToConsole(logToConsole: boolean): void;

    /**
     * Log a debug message
     * 
     * @param message the message to log
     */
    function debug(message: string): void;

    /**
     * Log a warning message
     * 
     * @param message the message to log
     */
    function warn(message: string): void;

    /**
     * Log an error message
     * 
     * @param message the message to log
     */
    function error(message: string): void;
}

/**
 * A settings namespace
 */
export namespace settings {
    /**
     * Set if the program should collect full debugging info
     *
     * @param debugFull if the program should collect full debugging info
     * @return true, if the operation was successful, false otherwise
     */
    function setDebugFull(debugFull: boolean): Promise<boolean>;

    /**
     * Set if the web server should be used
     *
     * @param webServer true, if it should be used
     * @return true, if the operation was successful, false otherwise
     */
    function setWebServer(webServer: boolean): Promise<boolean>;

    /**
     * Get if the web server is activated in the settings
     *
     * @return true, if the web server was activated
     */
    function webServerActivated(): boolean;

    /**
     * Check if the web server is running
     *
     * @return true, if it is running
     */
    function webServerRunning(): boolean;

    /**
     * Set the time to sleep between bets
     *
     * @param timeSleep the time to sleep
     */
    function setTimeSleep(timeSleep: number): void;

    /**
     * Get the time to sleep between bets
     *
     * @return the time to sleep
     */
    function getTimeSleep(): number;

    /**
     * Save the settings
     */
    function saveSettings(): Promise<void>;
}

/**
 * Quit
 */
export function quit(): void;

/**
 * Start the shutdown hook
 */
export function shutdown(): Promise<void>;