/*
import React from 'react'
import icon from 'path/to/icon.png';
import menu from 'path/to/menu';
import { remote } from 'electron';

import TitleBar from 'frameless-titlebar'

const currentWindow = remote.getCurrentWindow();

const Example = () => {
    // manage window state, default to currentWindow maximized state
    const [maximized, setMaximized] = useState(currentWindow.isMaximized());
    // add window listeners for currentWindow
    useEffect(() => {
        const onMaximized = () => setMaximized(true);
        const onRestore = () => setMaximized(false);
        currentWindow.on("maximize", onMaximized);
        currentWindow.on("unmaximize", onRestore);
        return () => {
            currentWindow.removeListener("maximize", onMaximized);
            currentWindow.removeListener("unmaximize", onRestore);
        }
    }, []);

    // used by double click on the titlebar
    // and by the maximize control button
    const handleMaximize = () => {
        if (maximized) {
            currentWindow.restore();
        } else {
            currentWindow.maximize();
        }
    }

    return (
        <div>
            <TitleBar
                iconSrc={icon} // app icon
                currentWindow={currentWindow} // electron window instance
                platform={process.platform} // win32, darwin, linux
                menu={menu}
                theme={{
                    // any theme overrides specific
                    // to your application :)
                }}
                title="frameless app"
                onClose={() => currentWindow.close()}
                onMinimize={() => currentWindow.minimize()}
                onMaximize={handleMaximize}
                // when the titlebar is double clicked
                onDoubleClick={handleMaximize}
                // hide minimize windows control
                disableMinimize={false}
                // hide maximize windows control
                disableMaximize={false}
                // is the current window maximized?
                maximized={maximized}
            >
            </TitleBar>
        </div>
    )
}
*/