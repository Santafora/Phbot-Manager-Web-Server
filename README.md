TR
Basit bir web sunucusu kısaca manager'ın tuttuğu çeşitli bilgileri aşağıda detaylı görebilirsiniz. Web üzerinde göstererek bir veye birden çok hesabınızı kolaylıkla takip etmenize yarıyor.

Kurulum:

Manager;
Manager ekranında sol üst tarafta Manager butonuna basıyoruz ardından, HTTP sekmesine gelerek;
URI :http://localhost:4050/
Upload Interval(isteğe bağlı değiştirebilirsiniz) :10000
ve Enabled seçeneğini tikleyerek Save butonuna basarak kaydediyoruz.

![image](https://github.com/user-attachments/assets/2b485b7b-4087-4a0c-825a-c82fcc4477db)
![image](https://github.com/user-attachments/assets/14026a1b-2f63-4f83-b90b-cc760012a180)


Web Server;
Node.js 'e ihtiyacınız var. indirmek için :https://nodejs.org/en/download/prebuilt-installer
İndirip kurdukdan sonra Phbot-Manager-Web-Server'i indirin indirdiğiniz klasörde bir Cmd,Powershell açarak sırasıyla;
npm install
node index.js
Yazarak sunucuyu başlatıyoruz.

http://localhost:4050 urline tarayıcıdan giderek kullanmaya başlayabilirsiniz.

Dipnot: Eğer Vds veya açık bir portunuz varsa port ayarını güncelleyip her yerden erişim sağlayarak kullanabilirsiniz.

EN
A simple web server that allows you to easily track one or multiple accounts by displaying various information managed by the manager on the web.

Installation:

Manager;
On the Manager screen, click the Manager button in the top left corner, then go to the HTTP tab;

URI: http://localhost:4050/
Upload Interval (optional, you can change it): 10000
Check the Enabled option and click the Save button to save the settings.
![image](https://github.com/user-attachments/assets/2b485b7b-4087-4a0c-825a-c82fcc4477db)
![image](https://github.com/user-attachments/assets/14026a1b-2f63-4f83-b90b-cc760012a180)

Web Server;
You need Node.js. To download: Node.js Download
After downloading and installing, download the Phbot-Manager-Web-Server. Open a command prompt or PowerShell in the downloaded folder and run the following commands in order:

npm install
node index.js
You can start using it by going to http://localhost:4050 in your browser.

Note: If you have a VDS or an open port, you can update the port settings to access and use it from anywhere.
