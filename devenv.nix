{ pkgs, ... }:

{
  cachix.enable = false;
  dotenv.enable = true;

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    pnpm.enable = true;
  };
}
