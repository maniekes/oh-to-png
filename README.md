# oh-to-png
serve openhab panels as static images for embedded devices

## sample config
1. create some panels in habpanel for example
2. create device-mappings.yml file with resolutuon, links etc:
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
3. run `npm install`
4. test if it works:
    - `npm run start`
    - open http://localhost:3001/screenshot?device=device_1
5. if all works fine install it as service  `npm run startup` (and follow instructions from pm2)

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