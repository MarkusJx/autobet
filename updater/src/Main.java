import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

public class Main {

    private static final String currentVersion = "0.3.1";
    private static Boolean download = false;

    public static void main(String[] args) {
        if (args.length <= 0) {
            System.out.println("err");
            return;
        }

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                abortDownload();
                Thread.sleep(500);
            } catch (IOException | InterruptedException ignored) {
            }
        }));

        try {
            switch (args[0]) {
                case "--check":
                    String version = getVersion();
                    if (version == null) System.out.println("err");
                    else System.out.println(!currentVersion.equals(version));
                    break;
                case "--downloaded":
                    System.out.println(new File("autobet_installer-NEW.exe").exists());
                    break;
                case "--downloadupdate":
                    downloadUpdate(getVersion());
                    break;
                case "--initupdate":
                    Path tmp = copyFiles();
                    startTmpProgram(tmp);
                    break;
                case "--runupdate":
                    startUpdate();
                    startProgram();
                    break;
                default:
                    System.out.println("err");
                    break;
            }
            //System.out.println("done");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static Path copyFiles() throws IOException {
        Path tmp = Files.createTempDirectory("autobet");
        copyFolder(new File("jre").toPath(), new File(tmp.toFile(), "jre").toPath());
        copy(new File("updater.jar").toPath(), new File(tmp.toFile(), "updater.jar").toPath());
        copy(new File("autobet_installer-NEW.exe").toPath(), new File(tmp.toFile(), "autobet_installer.exe").toPath());
        Files.deleteIfExists(new File("autobet_installer-NEW.exe").toPath());
        copyFolder(new File("electron-win32-x64").toPath(), new File(tmp.toFile(), "electron-win32-x64").toPath());
        File tmpFile = new File(tmp.toFile(), "RUNUPDATE");
        tmpFile.createNewFile();
        return tmp;
    }

    private static void startTmpProgram(Path path) throws IOException {
        Runtime.getRuntime().exec(new File(path.toString() + "/electron-win32-x64/electron.exe").getAbsolutePath(), null, new File(path.toString() + "/electron-win32-x64").getAbsoluteFile());
        System.exit(0);
    }

    private static void startUpdate() throws IOException {
        String[] command = new String[]{"autobet_installer.exe", "/VERYSILENT", "/CURRENTUSER", "/SUPPRESSMSGBOXES", "/CLOSEAPPLICATIONS", "/LOG=\"" + System.getProperty("user.dir") + "/log.txt\""};
        Process p = Runtime.getRuntime().exec(command);
        try {
            p.waitFor();
        } catch (InterruptedException ignored) {
        }
    }

    private static void startProgram() throws IOException {
        BufferedReader br = new BufferedReader(new FileReader("log.txt"));
        String line;
        while ((line = br.readLine()) != null) {
            if (line.contains("Creating directory: ") || line.contains("Directory for uninstall files:")) {
                break;
            }
        }

        if (line != null) {
            String[] ln = line.split("\\s+");
            line = ln[ln.length - 1];

            Runtime.getRuntime().exec(new File(line + "/autobet.exe").getAbsolutePath(), null, new File(line).getAbsoluteFile());
        }
    }

    /**
     * Get a new program version. Contains code from: https://www.baeldung.com/java-http-request
     *
     * @return The newest version
     * @throws IOException If something fails
     */
    private static String getVersion() throws IOException {
        URL url = new URL("https://api.github.com/repos/markusjx/gta-online-autobet/tags");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");
        con.setRequestProperty("Content-Type", "application/json");

        BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
        String input = in.readLine();
        if (input == null) return null;
        input = input.replace("[{", "");
        input = input.split(",")[0].split(":")[1].replaceAll("\"", "");
        in.close();
        con.disconnect();

        return input;
    }

    /**
     * Download update. According to: https://www.baeldung.com/java-download-file
     *
     * @param version the new Version number
     * @throws IOException If something fails
     */
    private static void downloadUpdate(String version) throws IOException {
        download = true;
        BufferedInputStream in = new BufferedInputStream(new URL("https://github.com/MarkusJx/GTA-Online-Autobet/releases/download/" + version + "/autobet_installer.exe").openStream());
        FileOutputStream fileOutputStream = new FileOutputStream("autobet_installer-NEW.exe");
        byte[] dataBuffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = in.read(dataBuffer, 0, 1024)) != -1 && download) {
            fileOutputStream.write(dataBuffer, 0, bytesRead);
        }
        download = false;
    }

    private static void abortDownload() throws IOException {
        if (download) {
            download = false;
            try {
                Thread.sleep(100);
            } catch (InterruptedException ignored) {
            }
            Files.deleteIfExists(new File("autobet_installer-NEW.exe").toPath());
        }
    }

    /**
     * Copy folder according to: https://stackoverflow.com/a/50418060
     *
     * @param src  source path
     * @param dest destination path
     * @throws IOException if something fails
     */
    private static void copyFolder(Path src, Path dest) throws IOException {
        Files.walk(src).forEach(source -> copy(source, dest.resolve(src.relativize(source))));
    }

    private static void copy(Path source, Path dest) {
        try {
            Files.copy(source, dest, REPLACE_EXISTING);
        } catch (Exception e) {
            System.out.println("err");
            System.exit(1);
        }
    }
}
