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
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import dynamic from "next/dynamic";
import ace from "ace-builds";
import BettingFunctionImplementation from "../../../util/BettingFunctionImplementation";
import defaultBettingFunction from "../../../util/defaultBettingFunction";
import {FunctionStore} from "../../../util/FunctionStore";
import StaticInstances from "../../../util/StaticInstances";

const BettingFunctionEditor = dynamic(import("./BettingFunctionEditor"), {
    ssr: false
});

const ForwardRefEditor = forwardRef<editor_t>((props, ref) =>
    <BettingFunctionEditor {...props} editorRef={ref}/>
);

type editor_t = import("./BettingFunctionEditor").BettingFunctionEditor;

interface CustomBettingFunctionState {
    editorVisible: boolean;
    selectedImpl: BettingFunctionImplementation | null;
    drawerOpen: boolean;
    openButtonDisabled: boolean;
    saveButtonDisabled: boolean;
    deleteButtonDisabled: boolean;
    setDefaultButtonDisabled: boolean;
    checkImplButtonDisabled: boolean;
    addImplementation: boolean;
    implementations: BettingFunctionImplementation[];
}

const defaultImplementation = new BettingFunctionImplementation(defaultBettingFunction, "Default", null, true);

export default class CustomBettingFunction extends React.Component<any, CustomBettingFunctionState> {
    private editor: editor_t | null = null;
    private lastChangeOn: BettingFunctionImplementation | null = null;
    private drawerButtons: HTMLDivElement[] = [];
    private addButton: HTMLDivElement | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            editorVisible: false,
            selectedImpl: defaultImplementation,
            drawerOpen: false,
            openButtonDisabled: false,
            saveButtonDisabled: false,
            deleteButtonDisabled: false,
            setDefaultButtonDisabled: false,
            checkImplButtonDisabled: false,
            addImplementation: false,
            implementations: [defaultImplementation]
        };

        defaultImplementation.ok = true;
    }

    private _activeImplementation: BettingFunctionImplementation | null = defaultImplementation;

    public set activeImplementation(newVal: BettingFunctionImplementation) {
        if (this._activeImplementation != newVal) {
            if (this._activeImplementation) this._activeImplementation.active = false;
            this._activeImplementation = newVal;
        }
    }

    public set openButtonDisabled(val: boolean) {
        this.setState({
            openButtonDisabled: val
        });
    }

    private set saveButtonDisabled(val: boolean) {
        this.setState({
            saveButtonDisabled: val
        });
    }

    private set deleteButtonDisabled(val: boolean) {
        this.setState({
            deleteButtonDisabled: val
        });
    }

    private set setDefaultButtonDisabled(val: boolean) {
        this.setState({
            setDefaultButtonDisabled: val
        });
    }

    private set checkImplButtonDisabled(val: boolean) {
        this.setState({
            checkImplButtonDisabled: val
        });
    }

    private set selectedImpl(val: BettingFunctionImplementation) {
        this.setState({
            selectedImpl: val
        });
    }

    private set editorDisabled(val: boolean) {
        this.aceEditor?.setReadOnly(val);
        const element = (this.aceEditor as Record<string, any> | undefined)?.textInput?.getElement();
        if (element && element.disabled != undefined) element.disabled = val;
    }

    private get aceEditor(): ace.Ace.Editor | undefined {
        return this.editor?.editor?.editor;
    }

    private set drawerOpen(val: boolean) {
        this.editor?.setDrawerOpen(val);
        this.setState({
            drawerOpen: val
        });
    }

    private set addImplementation(val: boolean) {
        this.setState({
            addImplementation: val
        });
    }

    private get sidebarButtons(): React.ReactNode[] {
        this.drawerButtons = [];
        return this.state.implementations.map((i, index) => (
            <ListItem button ref={e => {
                if (e) this.drawerButtons[index] = e;
            }} onClick={() => {
                this.select(i);
                if (this.addButton) this.addButton.style.backgroundColor = "";
                this.drawerButtons.forEach(b => b.style.backgroundColor = "");
                this.drawerButtons[index].style.backgroundColor = "#ffffff1f";
            }} key={i.name} style={{
                borderRadius: '5px',
                backgroundColor: this.state.selectedImpl == i ? "#ffffff1f" : undefined
            }}>
                <ListItemIcon>
                    {i.waiting ? <WatchLaterOutlinedIcon/> : (i.ok ? (i.active ? <CheckCircleOutlineIcon/> :
                        <CheckOutlinedIcon/>) : <ErrorOutlineOutlinedIcon/>)}
                </ListItemIcon>
                <ListItemText primary={i.name}/>
            </ListItem>
        ));
    }

    public reloadDrawer(): void {
        this.setState({
            implementations: this.state.implementations
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
                                {this.state.addImplementation ? "Add implementation" : `View ${this.state.selectedImpl?.name || "Default"}`}
                            </Typography>
                            <IconButton size="large" aria-label="reload" color="inherit"
                                        onClick={this.checkCurrent.bind(this)}
                                        disabled={this.state.checkImplButtonDisabled}>
                                <CachedIcon/>
                            </IconButton>
                            <IconButton size="large" aria-label="set-active" color="inherit"
                                        onClick={this.setCurrentActive.bind(this)}
                                        disabled={this.state.setDefaultButtonDisabled}>
                                <CheckIcon/>
                            </IconButton>
                            <IconButton size="large" aria-label="save" color="inherit"
                                        disabled={this.state.saveButtonDisabled} onClick={this.saveCurrent.bind(this)}>
                                <SaveIcon/>
                            </IconButton>
                            <IconButton size="large" aria-label="delete" color="inherit"
                                        disabled={this.state.deleteButtonDisabled}
                                        onClick={this.deleteCurrent.bind(this)}>
                                <DeleteForeverIcon/>
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <div className={styles.drawerEditorContainer}>
                        <Drawer open={this.state.drawerOpen} sx={drawerSxProps} variant="persistent" anchor="left"
                                style={{backgroundColor: '#1e1e1e'}}>
                            <div className={styles.drawerHeadingContainer}>
                                <h3 className={`${styles.text} ${styles.heading}`}>
                                    Implementations
                                </h3>
                                <h4 className={`${styles.text} ${styles.subheading}`}>
                                    Select your definition here
                                </h4>
                            </div>
                            <Divider/>
                            {this.sidebarButtons}
                            <Divider/>
                            <ListItem button onClick={this.onAddButtonClick.bind(this)} ref={e => this.addButton = e}>
                                <ListItemIcon>
                                    <AddIcon/>
                                </ListItemIcon>
                                <ListItemText primary="Add"/>
                            </ListItem>
                        </Drawer>
                        <ForwardRefEditor ref={this.editorLoaded.bind(this)}/>
                    </div>
                </div>
            </SettingContainer>
        );
    }

    public override componentDidMount(): void {
        window.BettingFunctionUtil.setRevertToDefaultCallback(() => {
            if (this.activeImplementation != null && this.activeImplementation.active) {
                this.activeImplementation.active = false;
            } else {
                this.state.implementations.forEach(i => i.active = false);
            }

            this.setActive(defaultImplementation);
        });
    }

    public select(impl: BettingFunctionImplementation): void {
        this.selectedImpl = impl;
        this.aceEditor?.setValue(impl.implementation, -1);
        this.drawerOpen = false;
        this.addImplementation = false;

        // If this is the default implementation,
        // the title is 'View default', the save
        // and the delete buttons are disabled.
        // Additionally, the editor is disabled
        if (impl.isDefault) {
            this.saveButtonDisabled = true;
            this.deleteButtonDisabled = true;
            this.editorDisabled = true;
        } else {
            // Disable the 'delete' and 'save' buttons when
            // waiting for the function to be checked
            this.deleteButtonDisabled = impl.waiting;
            this.saveButtonDisabled = true;
            this.editorDisabled = false;
        }

        this.checkImplButtonDisabled = impl.waiting;
        this.setDefaultButtonDisabled = impl.active || !impl.ok;
    }

    public hide(): void {
        this.setState({
            editorVisible: false
        });
    }

    private addImpl(impl: BettingFunctionImplementation): void {
        this.setState({
            implementations: [
                ...this.state.implementations,
                impl
            ]
        });
    }

    private saveCurrent(): void {
        if (this.state.addImplementation) {
            const nameRegex: RegExp = /^[a-zA-Z0-9_]+$/g;
            const closeListener = (value: string): void => {
                value = value.trim();
                if (value.length === 0) {
                    StaticInstances.selectBettingFunctionNameDialog?.setInvalid(true, "The function name cannot be empty");
                    StaticInstances.selectBettingFunctionNameDialog?.open(closeListener);
                } else if (value.length > 20) {
                    StaticInstances.selectBettingFunctionNameDialog?.setInvalid(true, "The function name may only be up to 20 characters in length");
                    StaticInstances.selectBettingFunctionNameDialog?.open(closeListener);
                } else if (window.BettingFunctionUtil.nameExists(value)) {
                    StaticInstances.selectBettingFunctionNameDialog?.setInvalid(true, "An implementation with the given name already exists");
                    StaticInstances.selectBettingFunctionNameDialog?.open(closeListener);
                } else if (!nameRegex.test(value)) {
                    StaticInstances.selectBettingFunctionNameDialog?.setInvalid(true, "The given name is invalid. Function names may only contain characters (a-z), numbers(0-9) and underscores in any combination.");
                    StaticInstances.selectBettingFunctionNameDialog?.open(closeListener);
                } else {
                    const store = window.BettingFunctionUtil.addFunction(value, this.aceEditor!.getValue());
                    const impl = BettingFunctionImplementation.fromStore(store);
                    this.addImpl(impl);
                    StaticInstances.bettingFunctionSavedAlert?.setText("Successfully saved the implementation");
                    StaticInstances.bettingFunctionSavedAlert?.show(5000);
                    this.addButton!.style.backgroundColor = '';
                    this.select(impl);
                    this.check(impl);
                }
            };
            StaticInstances.selectBettingFunctionNameDialog?.open(closeListener);
        } else {
            // Revert to default impl if to save == current
            if (this.state.selectedImpl?.active) {
                this.setActive(defaultImplementation);
            }

            this.saveButtonDisabled = true;
            this.state.selectedImpl?.setImplementation(this.aceEditor!.getValue());
            StaticInstances.bettingFunctionSavedAlert?.setText("Successfully saved the implementation");
            StaticInstances.bettingFunctionSavedAlert?.show(5000);
            this.checkCurrent();
        }
    }

    private deleteCurrent(): void {
        if (this.state.selectedImpl?.active) {
            this.setActive(defaultImplementation);
        }

        if (!this.state.addImplementation && this.state.selectedImpl) {
            this.setState({
                implementations: this.state.implementations.filter(f => f != this.state.selectedImpl)
            });
            window.BettingFunctionUtil.deleteFunction(this.state.selectedImpl.store!);
            StaticInstances.bettingFunctionSavedAlert?.setText(`Successfully deleted implementation '${this.state.selectedImpl.name}'`);
            StaticInstances.bettingFunctionSavedAlert?.show(5000);
        } else if (this.state.addImplementation) {
            StaticInstances.bettingFunctionSavedAlert?.setText("Discarded the changes made");
            StaticInstances.bettingFunctionSavedAlert?.show(5000);
        }

        this.select(defaultImplementation);
    }

    private editorLoaded(e: editor_t | null): void {
        if (!e) return;
        const alreadyLoaded: boolean = !!this.editor;

        this.editor = e;
        this.aceEditor!.on("change", () => {
            if (this.state.selectedImpl != null && this.lastChangeOn != this.state.selectedImpl) {
                this.lastChangeOn = this.state.selectedImpl;
                this.saveButtonDisabled = false;
                this.checkImplButtonDisabled = true;
                this.setDefaultButtonDisabled = true;
            }
        });

        if (!alreadyLoaded) {
            this.aceEditor?.setValue(defaultImplementation.implementation, -1);
            this.saveButtonDisabled = true;
            this.deleteButtonDisabled = true;
            this.editorDisabled = true;
            this.checkImplButtonDisabled = defaultImplementation.active;
            this.loadFunctions();
            this.select(defaultImplementation);
        }
    }

    private loadFunctions(): void {
        const functions: FunctionStore[] = window.store.getFunctions();
        defaultImplementation.defaultLoadActive();
        const implementations = [
            defaultImplementation,
            ...functions.map(f => BettingFunctionImplementation.fromStore(f))
        ];

        /*console.log(window.store.getActiveFunction(), window.BettingFunctionUtil.defaultIsActive())
        if (window.BettingFunctionUtil.defaultIsActive()) {
            console.log("Setting default to active")
            defaultImplementation.active = true;
            console.log(defaultImplementation);
        }*/

        this.activeImplementation = implementations.find(i => i.active)!;
        this.setDefaultButtonDisabled = defaultImplementation.active;
        //console.log(implementations);
        this.setState({
            implementations: implementations
        });
    }

    private setActive(val: BettingFunctionImplementation) {
        val.active = true;
        this.activeImplementation = val;
        this.setDefaultButtonDisabled = !!this.state.selectedImpl?.active;
        this.reloadDrawer();
        StaticInstances.bettingFunctionSavedAlert?.setText(`Set '${val.name}' as the active implementation`);
        StaticInstances.bettingFunctionSavedAlert?.show(5000);
    }

    private setCurrentActive(): void {
        if (this.state.selectedImpl) {
            this.setActive(this.state.selectedImpl);
        }
    }

    private check(impl: BettingFunctionImplementation): void {
        this.checkImplButtonDisabled = true;
        this.saveButtonDisabled = true;
        this.deleteButtonDisabled = true;
        impl.checkImplementation();
        this.checkImplButtonDisabled = false;

        if (!impl.isDefault) {
            this.deleteButtonDisabled = false;
            this.setDefaultButtonDisabled = !impl.ok;
            this.saveButtonDisabled = impl.ok;
        }
    }

    private checkCurrent(): void {
        if (this.state.selectedImpl) {
            this.check(this.state.selectedImpl);
        }
    }

    private onOpenClick(): void {
        this.setState({
            editorVisible: !this.state.editorVisible
        });
    }

    private toggleDrawer(): void {
        this.drawerOpen = !this.state.drawerOpen;
    }

    private onAddButtonClick(): void {
        this.toggleDrawer();
        this.drawerButtons.forEach(b => b.style.backgroundColor = "");
        if (this.addButton) this.addButton.style.backgroundColor = "#ffffff1f";
        this.addImplementation = true;
        this.aceEditor?.setValue("", -1);
        this.saveButtonDisabled = false;
        this.deleteButtonDisabled = false;
        this.setDefaultButtonDisabled = true;
        this.checkImplButtonDisabled = true;
        this.editorDisabled = false;
    }
}