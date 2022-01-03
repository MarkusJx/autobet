import React from "react";
import Image from "next/image";
import CopyrightIcon from "@mui/icons-material/Copyright";
import GitHubIcon from "@mui/icons-material/GitHub";
import styles from "../styles/components/Footer.module.scss";

export default class Footer extends React.Component {
    public override render(): React.ReactNode {
        return (
            <footer className={styles.footer}>
                <a href="https://github.com/MarkusJx/autobet">
                    <GitHubIcon className={styles.icon}/>
                    <span className={styles.viewOnGH}>View on GitHub</span>
                </a>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                    <span className={styles.poweredBy}>Powered by{' '}</span>
                    <span className={styles.logo}>
                        <Image src="/Nextjs-logo.svg" alt="NextJs Logo" width={50} height={32}/>
                    </span>
                </a>
                <a href="https://github.com/MarkusJx">
                    <CopyrightIcon className={styles.icon}/>
                    <span className={styles.author}>MarkusJx</span>
                    <span className={styles.year}>2022</span>
                </a>
            </footer>
        );
    }
}