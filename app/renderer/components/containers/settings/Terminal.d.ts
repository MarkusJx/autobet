interface TerminalProps {
    readOnly: boolean;
    commands: object;
    className: string;
    messageClassName: string;
    style?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
}

declare module 'react-console-emulator' {
    import React from "react";

    class Terminal extends React.Component<TerminalProps> {
        public pushToStdout(message: string, options?: object): void;

        public clearStdout(): void;

        public scrollToBottom(): void;
    }

    export = Terminal;
}
