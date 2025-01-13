# web2png

I have a few EspHome devices that display weather, home status, temperatures, etc. While I enjoy using EspHome, I find
creating graphical interfaces with C/YAML/LVGL tedious and overly complex, especially for read-only panels. Instead, I
prefer designing a clean and aesthetically pleasing interface using HTML/CSS/JS elsewhere and then simply loading it
onto the devices.

[HABPanel](https://www.openhab.org/docs/ui/habpanel/habpanel.html#the-main-menu) fits perfectly for this purpose.

This script renders complicated webpages with JavaScript into plain PNG files that can easily be transferred to dummy
EspHome devices. The resulting output might look something like this:

![device](img/sample-device.png)

### Usage of web2png

The `web2png` program is designed to render complex webpages into PNG files efficiently. It can be installed globally
via npm using the command:

```bash
npm i -g web2png
```

Once installed, the PM2 process manager can be used to run `web2png` as a background service:

1. Start the application with PM2 using the command:
   ```bash
   pm2 start web2png --name web2png
   ```

2. Save the PM2 process list to ensure it restarts after a systepm2m reboot:
   ```bash
   pm2 save
   ```

3. Configure PM2 to start on startup:
   ```bash
   pm2 startup
   ```

The configuration file (`device-mappings.yml`) is essential for controlling how `web2png` renders webpages, specifying
settings like resolution, delay, grayscale, and URL mappings for different devices. You can create or customize the
configuration file according to your needs.

By default, the application starts on port `3001`. This can be overridden using the `-p` option when starting `web2png`.
You can also specify a custom configuration file using the `-c` option. For example:

```bash
web2png -c custom-config.yml -p 8080
```

This setup allows you to adapt `web2png` to match your preferred environment and workflow with minimal effort.


## sample config
1. create some panels in habpanel for example
1. create device-mappings.yml file with resolutuon, links etc:
    ```yaml
    default:
        resolution: '960x540'
        delay: 0
        grayscale: true
        negate: true
    devices:
    device_1:
        url: 'https://google.com'
    ```
1. run `web2-png`
1. test if it works:
    - open http://localhost:3001/screenshot?device=device_1
    - depending what u configured something like this should appear
    ![sample google](img/sample-google.png)

## sample usage in esphome:

```yaml
online_image:
  - url: "http://localhost:3001/screenshot?device=device_1"
    format: png
    id: my_online_image
    update_interval: never
    type: grayscale
    on_error:
      then:
        - logger.log: error downloading!
    on_download_finished:
      then:
        - logger.log: image downloaded
        - component.update: eink_display
        - deep_sleep.enter
display:
- platform: t547
  id: eink_display
  update_interval: never
  lambda: |-
    it.image(0, 0, id(my_online_image), COLOR_OFF, COLOR_ON);
```
