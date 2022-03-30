import SwitchComponent from "../../util/SwitchComponent";

export default class AutoUpdate extends SwitchComponent {
    public constructor(props: {}) {
        super("Automatic updates", <>
            Select whether to disable/enable automatic updates. If enabled, the program may be updated after it has
            closed if an update is available. The updates are downloaded while the program is running. This setting is
            only effective after restarting the program.
        </>, props);
    }

    public override componentDidMount(): void {
        this.checked = window.store.getAutoUpdate();
        this.disabled = false;
    }

    protected override async onChange(checked: boolean): Promise<void> {
        this.disabled = true;
        window.store.setAutoUpdate(checked);
        this.disabled = false;
    }
}