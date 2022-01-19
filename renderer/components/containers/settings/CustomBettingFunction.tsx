import React, {forwardRef} from "react";
import SettingContainer from "./SettingContainer";
import {InfoAlign, InfoIcon} from "./Info";
import {ContainerHeading} from "../../Container";
import styles from "../../../styles/components/containers/settings/CustomBettingFunction.module.scss"
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
import dynamic from "next/dynamic";

const BettingFunctionEditor = dynamic(import("./BettingFunctionEditor"), {
    ssr: false
});

const ForwardRefEditor = forwardRef((props, ref) =>
    <BettingFunctionEditor {...props} editorRef={ref}/>
);

type editor_t = import("./BettingFunctionEditor").BettingFunctionEditor;

interface CustomBettingFunctionState {
    editorVisible: boolean;
    selectedImpl: string;
    drawerOpen: boolean;
    openButtonDisabled: boolean;
}

export default class CustomBettingFunction extends React.Component<any, CustomBettingFunctionState> {
    private editor: editor_t | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            editorVisible: false,
            selectedImpl: "default",
            drawerOpen: false,
            openButtonDisabled: false
        };
    }

    public set openButtonDisabled(val: boolean) {
        this.setState({
            openButtonDisabled: val
        });
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
                    <InfoIcon title="Custom betting function">
                        In here you can set a custom function to be called in order to determine whether (an where) a
                        bet should be placed. The function should be written in JavaScript, the odds are stored in the
                        odds variable and at the end, you should pass the odd for a bet to be placed on to the
                        setResult() function. If no bet should be placed, pass null to setResult(). If you don't pass
                        anything, the result will be interpreted as invalid and the Program will fall back to the native
                        implementation.
                    </InfoIcon>
                </InfoAlign>

                <Button variant="outlined" onClick={this.onOpenClick.bind(this)} style={{
                    margin: '10px auto auto auto'
                }} disabled={this.state.openButtonDisabled}>
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
                        <ForwardRefEditor ref={(e: editor_t) => this.editor = e}/>
                    </div>
                </div>
            </SettingContainer>
        );
    }

    public hide(): void {
        this.setState({
            editorVisible: false
        });
    }

    private onOpenClick(): void {
        this.setState({
            editorVisible: !this.state.editorVisible
        });
    }

    private toggleDrawer(): void {
        this.editor?.setDrawerOpen(!this.state.drawerOpen);
        this.setState({
            drawerOpen: !this.state.drawerOpen
        });
    }
}