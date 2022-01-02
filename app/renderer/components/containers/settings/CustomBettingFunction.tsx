import React from "react";
import SettingContainer from "./SettingContainer";
import {InfoAlign, InfoIcon} from "./Info";
import {ContainerHeading} from "../../Container";
import styles from "../../../../styles/components/containers/settings/CustomBettingFunction.module.scss"
import {Button, IconButton, Box, CssBaseline, AppBar, Toolbar, Typography} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import CachedIcon from "@mui/icons-material/Cached";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-chrome";

interface CustomBettingFunctionState {
    editorVisible: boolean;
    selectedImpl: string;
    drawerOpen: boolean;
}

export default class CustomBettingFunction extends React.Component<any, CustomBettingFunctionState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            editorVisible: false,
            selectedImpl: "default",
            drawerOpen: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer className={styles.container}>
                <InfoAlign className={styles.headingContainer}>
                    <ContainerHeading>Custom betting function</ContainerHeading>
                    <InfoIcon/>
                </InfoAlign>

                <Button variant="outlined" onClick={this.onOpenClick.bind(this)} style={{
                    margin: '10px auto auto auto'
                }}>
                    {`${this.state.editorVisible ? "Hide" : "Show"} editor`}
                </Button>

                <div className={`${styles.editorContainer} ${this.state.editorVisible ? styles.open : ""}`}
                     id="editor-container">
                    <Box sx={{display: 'flex'}} id="drawer-container">
                        <CssBaseline/>
                        <AppBar position="relative">
                            <Toolbar variant="dense">
                                <IconButton color="inherit" aria-label="open drawer"
                                            onClick={this.toggleDrawer.bind(this, true)} edge="start"
                                            sx={{mr: 2, ...(this.state.drawerOpen && {display: 'none'})}}>
                                    <MenuIcon/>
                                </IconButton>
                                <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                                    {`View ${this.state.selectedImpl}`}
                                </Typography>
                                <IconButton size="large" aria-label="reload" color="inherit">
                                    <CachedIcon/>
                                </IconButton>
                                <IconButton size="large" aria-label="test" color="inherit">
                                    <CheckIcon/>
                                </IconButton>
                                <IconButton size="large" aria-label="save" color="inherit">
                                    <SaveIcon/>
                                </IconButton>
                                <IconButton size="large" aria-label="delete" color="inherit">
                                    <DeleteForeverIcon/>
                                </IconButton>
                            </Toolbar>
                        </AppBar>
                        <AceEditor mode="java" theme="chrome" name="code-editor" style={{width: '100%'}}/>
                    </Box>
                </div>
            </SettingContainer>
        );
    }

    private onOpenClick(): void {
        this.setState({
            editorVisible: !this.state.editorVisible
        });
    }

    private toggleDrawer(open?: boolean): void {
        if (open == undefined) {
            this.setState({
                drawerOpen: !this.state.drawerOpen
            });
        } else {
            this.setState({
                drawerOpen: open
            });
        }
    }
}