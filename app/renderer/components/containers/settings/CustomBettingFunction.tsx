import React from "react";
import SettingContainer from "./SettingContainer";
import {InfoAlign, InfoIcon} from "./Info";
import {ContainerHeading} from "../../Container";
import styles from "../../../../styles/components/containers/settings/CustomBettingFunction.module.scss"
import {
    AppBar,
    Button,
    Divider,
    Drawer,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    SxProps,
    Toolbar,
    Typography
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import CachedIcon from "@mui/icons-material/Cached";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-chrome";

interface CustomBettingFunctionState {
    editorVisible: boolean;
    selectedImpl: string;
    drawerOpen: boolean;
}

export default class CustomBettingFunction extends React.Component<any, CustomBettingFunctionState> {
    private editor: AceEditor | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            editorVisible: false,
            selectedImpl: "default",
            drawerOpen: false
        };
    }

    public override render(): React.ReactNode {
        const drawerWidth: string = "200px";
        const drawerSxProps: SxProps = {
            position: "relative",
            marginLeft: "0",
            width: this.state.drawerOpen ? drawerWidth : 0,
            height: "100%",
            "& .MuiBackdrop-root": {
                display: "none"
            },
            "& .MuiDrawer-paper": {
                width: drawerWidth,
                position: "absolute",
                height: "100%",
            }
        };

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
                    <AppBar position="relative">
                        <Toolbar variant="dense">
                            <IconButton color="inherit" aria-label="open drawer"
                                        onClick={this.toggleDrawer.bind(this)} edge="start">
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
                    <div className={styles.drawerEditorContainer}>
                        <Drawer open={this.state.drawerOpen} sx={drawerSxProps} variant="persistent" anchor="left">
                            <div className={styles.drawerHeadingContainer}>
                                <h3 className={`${styles.text} ${styles.heading}`}>
                                    Implementations
                                </h3>
                                <h4 className={`${styles.text} ${styles.subheading}`}>
                                    Select your definition here
                                </h4>
                            </div>
                            <Divider/>
                            <ListItem button>
                                <ListItemIcon>
                                    <CheckCircleOutlineIcon/>
                                </ListItemIcon>
                                <ListItemText primary="Default"/>
                            </ListItem>
                            <Divider/>
                            <ListItem button>
                                <ListItemIcon>
                                    <AddIcon/>
                                </ListItemIcon>
                                <ListItemText primary="Add"/>
                            </ListItem>
                        </Drawer>
                        <AceEditor mode="java" theme="chrome" name="code-editor"
                                   className={`${styles.editor} ${this.state.drawerOpen && styles.drawerOpen}`}
                                   style={{width: 'auto'}} ref={e => this.editor = e}/>
                    </div>
                </div>
            </SettingContainer>
        );
    }

    private onOpenClick(): void {
        this.setState({
            editorVisible: !this.state.editorVisible
        });
    }

    private toggleDrawer(): void {
        this.setState({
            drawerOpen: !this.state.drawerOpen
        }, () => {
            this.editor?.forceUpdate();
        });
    }
}