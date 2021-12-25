import Head from 'next/head'
import React from 'react'
import styles from '../styles/Home.module.scss'
import StaticInstances from "../src/util/StaticInstances";
import CustomAlert from "../components/util/CustomAlert";
import LoadingBackdrop from "../components/util/LoadingBackdrop";
import MainContent from "../components/MainContent";
import Alerts from '../components/Alerts';
import Footer from '../components/Footer';
import Title from "../components/Title";

export default class Home extends React.Component {
    public connectionError: CustomAlert | null = null;
    public disconnectedAlert: CustomAlert | null = null;
    public connectedAlert: CustomAlert | null = null;
    public reloadingAlert: CustomAlert | null = null;
    private loadingBackdrop: LoadingBackdrop | null = null;

    private mainContent: MainContent | null = null;

    public override render(): React.ReactNode {
        return (
            <div className={styles.container}>
                <Head>
                    <title>Autobet</title>
                    <meta name="description" content="Generated by create next app"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>

                <main className={styles.main}>
                    <Title/>
                    <MainContent ref={e => this.mainContent = e}/>
                    <Alerts parent={this}/>
                </main>

                <LoadingBackdrop ref={e => this.loadingBackdrop = e}/>
                <Footer/>
            </div>
        );
    }

    public override componentDidMount(): void {
        this.loadingBackdrop?.setOpen(true);
        StaticInstances.api.logging = false;

        const init = () => {
            StaticInstances.api.init(!!window?.location).then(async () => {
                await this.mainContent?.loadData();
            }).catch(e => {
                console.error(e);
                this.connectionError?.show();
                this.reloadingAlert?.hide();
                this.loadingBackdrop?.setOpen(false);
                reload();
            });
        };

        let timeout: NodeJS.Timeout | null = null;
        const reload = () => {
            this.mainContent?.webSetStopped();
            this.disconnectedAlert?.show();
            if (timeout == null) {
                timeout = setTimeout(() => {
                    if (!StaticInstances.api.connected) {
                        this.loadingBackdrop?.setOpen(true);
                        this.disconnectedAlert?.hide();
                        this.connectionError?.hide();
                        this.reloadingAlert?.show();
                        init();
                    }
                    timeout = null;
                }, 10000);
            }
        };

        StaticInstances.api.listen("disconnect", () => {
            reload();
        });

        StaticInstances.api.listen("connect", () => {
            this.disconnectedAlert?.hide();
            this.loadingBackdrop?.setOpen(false);
            this.connectionError?.hide();
            this.reloadingAlert?.hide();
            this.connectedAlert?.show(10000);
        });

        init();
        this.loadingBackdrop?.setOpen(false);
    }
}
