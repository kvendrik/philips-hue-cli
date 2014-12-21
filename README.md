Philips Hue CLI
===============

A simple CLI to control the Philips Hue lights and manage its users.

### Using the CLI
Install the module globally and run the init command. This will walk you through the steps of setting up the CLI with your bridge.
```
sudo npm install philips-hue-cli -g
hue init
```

### Help
```
hue --help
```

### Detailed Manual
```
hue --manual
```

### Install manually
Clone this repo, move into the folder, install the dependencies and run the init command.
```
git clone https://github.com/kvendrik/philips-hue-cli.git
cd philips-hue-cli
sudo npm install
./hue init
```

If you would like to install the manually installed CLI globally then run this when in the folder:
```
sudo npm install -g
```

Then check the installation using:
```
hue -v
```
