{ pkgs, ... }:

let
  # see: https://discourse.nixos.org/t/running-playwright-tests/25655/33
  playwright-driver = pkgs.playwright-driver;
  playwright-driver-browsers = pkgs.playwright-driver.browsers;
  playwright-browsers-json =
    builtins.fromJSON (builtins.readFile "${playwright-driver}/browsers.json");

  playwright-chromium = builtins.elemAt
    (builtins.filter (browser: browser.name == "chromium")
      playwright-browsers-json.browsers) 0;
  playwright-firefox = builtins.elemAt
    (builtins.filter (browser: browser.name == "firefox")
      playwright-browsers-json.browsers) 0;
  playwright-webkit = builtins.elemAt
    (builtins.filter (browser: browser.name == "webkit")
      playwright-browsers-json.browsers) 0;
in {
  cachix.enable = false;
  dotenv.enable = true;

  packages = [ playwright-driver ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${playwright-driver-browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH =
      "${playwright-driver-browsers}/chromium-${playwright-chromium.revision}/chrome-linux/chrome";
    PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH =
      "${playwright-driver-browsers}/firefox-${playwright-firefox.revision}/firefox/firefox";
    PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH =
      "${playwright-driver-browsers}/webkit-${playwright-webkit.revision}/pw_run.sh";
  };

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    pnpm.enable = true;
  };
}
