# oh-to-png
i have couple of EspHome devices which are displaying weather/home status/temperatures etc. i love EspHome but i hate creating graphical interfaces using C/yaml/lvgl. for read-only panels i think this is too much overhead. instead i preffer to create nice design using proper html/css/js somwhere else and just load into them, 

[HABPanel](https://www.openhab.org/docs/ui/habpanel/habpanel.html#the-main-menu) is something that fits perfectly into my area of interests

this little script will help to render complex webpages with javascript into simple png file which can be easly transfered into dummy esphome device and they might look like this:
![device](img/sample-device.png)

## sample config
1. create some panels in habpanel for example
1. check out this repo somewhere on ur server
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
1. run `npm install`
1. test if it works:
    - `npm run start`
    - open http://localhost:3001/screenshot?device=device_1
    - depending what u configured something like this should appear
    ![sample output](img/sample-output.png)
1. if all works fine install it as service  `npm run startup` (and follow instructions from pm2)
2. you can browse logs using standard pm2 commands [check quickstart](https://pm2.keymetrics.io/docs/usage/quick-start/)

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