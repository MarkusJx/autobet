import React from "react";
import {ADialog} from "./Dialog";
import {CircularProgress, Collapse, List, ListItemButton, ListItemText} from "@mui/material";
import {CompleteLicenseFile, LicenseInfo} from "../../../electron-src/preload/licenses";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import {Scrollbars} from "rc-scrollbars";
import styles from "../../styles/components/LicenseViewerDialog.module.scss";

class LicenseViewerDialogElement extends ADialog {
    public constructor(props: {}) {
        super(props, "View licenses", "", false, null, undefined, undefined, true);
    }
}

function ListCollapse(props: { info: LicenseInfo, onClick: (id: number, name: string) => void }): JSX.Element {
    const [open, setOpen] = React.useState(false);

    const handleClick = () => {
        setOpen(!open);
    };

    return (
        <>
            <ListItemButton onClick={handleClick}>
                <ListItemText primary={props.info.name}/>
                {open ? <ExpandLess/> : <ExpandMore/>}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {
                        props.info.files.map(f => (
                            <ListItemButton sx={{pl: 4}} key={f.name}
                                            onClick={props.onClick.bind(null, props.info.id, f.name)}>
                                <ListItemText primary={f.name}/>
                            </ListItemButton>
                        ))
                    }
                </List>
            </Collapse>
        </>
    );
}

interface LicenseViewerDialogState {
    content: LicenseInfo[] | null;
    displayedFile: string | null;
}

export default class LicenseViewerDialog extends React.Component<{}, LicenseViewerDialogState> {
    private element?: LicenseViewerDialogElement;

    public constructor(props: {}) {
        super(props);
        this.state = {
            content: null,
            displayedFile: null
        };
    }

    private set displayedFile(f: CompleteLicenseFile | null) {
        if (f) {
            this.element?.setTitle(`View Licenses (Currently viewing license of '${f?.softwareName}')`);
        } else {
            this.element?.setTitle("View Licenses");
        }

        this.setState({
            displayedFile: f?.content || null
        });
    }

    public override render(): React.ReactNode {
        return (
            <LicenseViewerDialogElement ref={e => this.element = e!}>
                {this.getContent()}
            </LicenseViewerDialogElement>
        );
    }

    public open(): void {
        this.element?.open();
        if (!this.state.content) {
            window.licenses.getLicenses().then(licenses => {
                this.setState({
                    content: licenses
                });
                return window.licenses.getMainLicense();
            }).then(license => {
                this.displayedFile = license;
            });
        }
    }

    private getMenuItems(): React.ReactNode[] {
        return this.state.content!.map(l => {
            if (l.files.length > 1) {
                return (
                    <ListCollapse info={l} onClick={this.displayFile.bind(this)} key={l.name}/>
                );
            } else {
                return (
                    <ListItemButton key={l.name} onClick={this.displayFile.bind(this, l.id, l.files[0].name)}>
                        <ListItemText primary={l.name}/>
                    </ListItemButton>
                );
            }
        });
    }

    private getLicenseFile(): React.ReactNode {
        if (this.state.displayedFile) {
            return (
                <p className={styles.text}>
                    {this.state.displayedFile}
                </p>
            );
        } else {
            return (
                <div className={styles.progressContainer}>
                    <CircularProgress/>
                </div>
            );
        }
    }

    private getContent(): React.ReactNode {
        if (this.state.content) {
            return (
                <div className={styles.mainContent}>
                    <Scrollbars autoHide autoHideTimeout={1000} autoHideDuration={200} autoHeight
                                autoHeightMin={0} thumbMinSize={30} universal autoHeightMax="calc(100vh - 92px)">
                        <List sx={{width: '100%', maxWidth: 360, bgcolor: 'background.paper'}} component="nav">
                            {this.getMenuItems()}
                        </List>
                    </Scrollbars>
                    <Scrollbars autoHide autoHideTimeout={1000} autoHideDuration={200} autoHeight
                                autoHeightMin={0} thumbMinSize={30} universal autoHeightMax="calc(100vh - 92px)"
                                classes={{view: styles.scrollbarView}}>
                        {this.getLicenseFile()}
                    </Scrollbars>
                </div>
            );
        } else {
            return (
                <div className={styles.progressContainer}>
                    <CircularProgress/>
                </div>
            );
        }
    }

    private async displayFile(id: number, fileName: string): Promise<void> {
        this.displayedFile = null;
        this.displayedFile = await window.licenses.getLicenseFile(id, fileName);
    }
}