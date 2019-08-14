import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class Main {

    public static void main(String[] args) throws Exception {
        URL url = new URL("https://api.github.com/repos/markusjx/gta-online-autobet/tags");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");
        con.setRequestProperty("Content-Type", "application/json");

        BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
        String input = in.readLine();
        input = input.replace("[{", "");
        input = input.split(",")[0].split(":")[1].replaceAll("\"", "");
        in.close();
        con.disconnect();
        System.out.println(input);

        downloadUpdate(input);
    }

    private static void downloadUpdate(String version) throws Exception {
        BufferedInputStream in = new BufferedInputStream(new URL("https://github.com/MarkusJx/GTA-Online-Autobet/releases/download/" + version + "/autobet_installer.exe").openStream());
        FileOutputStream fileOutputStream = new FileOutputStream("autobet_installer.exe");
        byte[] dataBuffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = in.read(dataBuffer, 0, 1024)) != -1) {
            fileOutputStream.write(dataBuffer, 0, bytesRead);
        }
    }
}
